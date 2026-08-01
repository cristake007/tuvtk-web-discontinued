#!/usr/bin/env node

/**
 * Rescanează routerul și sursele React fără parser sau pachete externe.
 *
 * Utilizare:
 *   node docs/page-structure/viewer/refresh-data.mjs
 *   node docs/page-structure/viewer/refresh-data.mjs --check
 *   node docs/page-structure/viewer/refresh-data.mjs --verbose
 *
 * Scannerul este intenționat conservator: păstrează analiza documentată existentă,
 * atașează un snapshot derivat din surse fiecărei rute și generează automat
 * înregistrări complete pentru rutele care nu există încă în data.json.
 */

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SCANNER_VERSION = 2;
const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const verbose = args.has("--verbose");
const allowedArgs = new Set(["--check", "--verbose", "--help"]);

if (args.has("--help")) {
  console.log(`Rescanează structura frontendului React și actualizează viewerul.

Utilizare:
  node docs/page-structure/viewer/refresh-data.mjs [--check] [--verbose]

Opțiuni:
  --check    Scanează și validează, dar nu scrie fișiere.
  --verbose  Listează rutele și fișierele nerezolvate.
  --help     Afișează acest mesaj.`);
  process.exit(0);
}

const unknownArgs = [...args].filter((arg) => !allowedArgs.has(arg));
if (unknownArgs.length) {
  throw new Error(`Opțiuni necunoscute: ${unknownArgs.join(", ")}`);
}

const viewerDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(viewerDirectory, "../../..");
const frontendSourceRoot = join(repositoryRoot, "frontend/src");
const routerFile = join(frontendSourceRoot, "app/router.tsx");
const dataFile = join(viewerDirectory, "data.json");
const viewerAppFile = join(viewerDirectory, "app.js");
const backendScannerFile = join(viewerDirectory, "scan-backend.py");
const sharedRuntimeReportFile = resolve(viewerDirectory, "../_runtime-comun.md");

const htmlTags = new Set([
  "a", "article", "aside", "blockquote", "button", "caption", "cite", "code",
  "dd", "details", "dialog", "div", "dl", "dt", "fieldset", "footer", "form",
  "h1", "h2", "h3", "h4", "h5", "h6", "header", "img", "input", "kbd",
  "label", "legend", "li", "main", "nav", "ol", "option", "p", "section",
  "select", "small", "span", "strong", "summary", "svg", "table", "tbody",
  "td", "textarea", "tfoot", "th", "thead", "tr", "ul",
]);
const voidTags = new Set(["img", "input"]);
const ignoredSourceParts = [".test.", ".spec.", "/test/", "/__tests__/", "/node_modules/"];
const genericComponents = new Set([
  "ApplicationState", "QueryApplicationState", "Suspense", "Fragment", "Navigate",
  "Outlet", "RouteErrorBoundary", "ApplicationAccessRoute", "StaffRoute",
]);

function toPosix(filePath) {
  return relative(repositoryRoot, filePath).split(sep).join("/");
}

function stableUnique(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right, "ro"));
}

function slugify(value) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return slug || "root";
}

function hashValue(value) {
  return createHash("sha256").update(value).digest("hex");
}

function unquote(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  const quote = trimmed[0];
  if ((quote === '"' || quote === "'") && trimmed.at(-1) === quote) {
    return trimmed.slice(1, -1);
  }
  return null;
}

function skipLexical(source, index) {
  const character = source[index];
  const next = source[index + 1];
  if (character === "/" && next === "/") {
    const end = source.indexOf("\n", index + 2);
    return end < 0 ? source.length : end;
  }
  if (character === "/" && next === "*") {
    const end = source.indexOf("*/", index + 2);
    return end < 0 ? source.length : end + 2;
  }
  if (character !== '"' && character !== "'" && character !== "`") return index;
  const quote = character;
  let cursor = index + 1;
  while (cursor < source.length) {
    if (source[cursor] === "\\") {
      cursor += 2;
      continue;
    }
    if (source[cursor] === quote) return cursor + 1;
    cursor += 1;
  }
  return source.length;
}

function findMatching(source, start, opening, closing) {
  if (source[start] !== opening) return -1;
  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    const skipped = skipLexical(source, index);
    if (skipped !== index) {
      index = skipped - 1;
      continue;
    }
    if (source[index] === opening) depth += 1;
    if (source[index] === closing) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function splitTopLevel(source, opening = "[", closing = "]") {
  const start = source.indexOf(opening);
  const end = start >= 0 ? findMatching(source, start, opening, closing) : -1;
  if (start < 0 || end < 0) return [];
  const values = [];
  let valueStart = start + 1;
  const depths = { "(": 0, "[": 0, "{": 0 };
  const closingToOpening = { ")": "(", "]": "[", "}": "{" };
  for (let index = start + 1; index < end; index += 1) {
    const skipped = skipLexical(source, index);
    if (skipped !== index) {
      index = skipped - 1;
      continue;
    }
    const character = source[index];
    if (character in depths) depths[character] += 1;
    if (character in closingToOpening) depths[closingToOpening[character]] -= 1;
    if (character === "," && Object.values(depths).every((depth) => depth === 0)) {
      const value = source.slice(valueStart, index).trim();
      if (value) values.push(value);
      valueStart = index + 1;
    }
  }
  const tail = source.slice(valueStart, end).trim();
  if (tail) values.push(tail);
  return values;
}

function parseObjectProperties(objectSource) {
  const start = objectSource.indexOf("{");
  const end = start >= 0 ? findMatching(objectSource, start, "{", "}") : -1;
  if (start < 0 || end < 0) return new Map();
  const properties = new Map();
  let cursor = start + 1;
  while (cursor < end) {
    while (/[\s,]/.test(objectSource[cursor] ?? "")) cursor += 1;
    const keyMatch = objectSource.slice(cursor).match(/^([A-Za-z_$][\w$]*)\s*:/);
    if (!keyMatch) {
      cursor += 1;
      continue;
    }
    const key = keyMatch[1];
    cursor += keyMatch[0].length;
    const valueStart = cursor;
    const depths = { "(": 0, "[": 0, "{": 0 };
    const closingToOpening = { ")": "(", "]": "[", "}": "{" };
    while (cursor < end) {
      const skipped = skipLexical(objectSource, cursor);
      if (skipped !== cursor) {
        cursor = skipped;
        continue;
      }
      const character = objectSource[cursor];
      if (character in depths) depths[character] += 1;
      if (character in closingToOpening) depths[closingToOpening[character]] -= 1;
      if (character === "," && Object.values(depths).every((depth) => depth === 0)) break;
      cursor += 1;
    }
    properties.set(key, objectSource.slice(valueStart, cursor).trim());
    cursor += 1;
  }
  return properties;
}

function firstComponent(expression) {
  return expression?.match(/<([A-Z][A-Za-z0-9.]*)\b/)?.[1] ?? null;
}

function titleFromExpression(expression) {
  return expression?.match(/\btitle\s*=\s*["']([^"']+)["']/)?.[1] ?? null;
}

function joinRoutePath(parentPath, childPath) {
  if (!childPath) return parentPath || "/";
  if (childPath === "*") return parentPath && parentPath !== "/" ? `${parentPath}/*` : "*";
  if (childPath.startsWith("/")) return childPath;
  const parent = parentPath === "/" ? "" : parentPath.replace(/\/$/, "");
  return `${parent}/${childPath}` || "/";
}

function inferModule(routePath) {
  if (routePath === "/" || routePath === "*" || routePath.startsWith("/tablou")) return "core";
  if (routePath.startsWith("/administrare")) return "administrare";
  if (routePath.startsWith("/planificator-cursuri")) return "course-planner";
  if (routePath.startsWith("/crm") || routePath === "/companies") return "crm";
  if (routePath.startsWith("/training")) return "training";
  if (routePath.startsWith("/certificari")) return "certificari";
  if (routePath.startsWith("/industrial")) return "industrial";
  if (routePath.startsWith("/documente")) return "documente";
  return "other";
}

function inferPageType(routePath, componentName) {
  const value = `${routePath} ${componentName}`.toLowerCase();
  if (componentName === "Navigate") return "redirect";
  if (routePath === "*" || routePath.endsWith("/*")) return "not-found";
  if (value.includes("placeholder")) return "placeholder";
  if (value.includes("form")) return "form";
  if (value.includes("history") || value.includes("istoric") || value.includes("table")) return "table";
  if (value.includes("integration") || value.includes("integrari")) return "integration";
  if (value.includes("administration") || value.includes("administrare")) return "administration";
  if (value.includes("dashboard") || value.includes("tablou") || value.includes("documente")) return "dashboard";
  if (value.includes("workspace")) return "workspace";
  if (/generator|xml|matcher|wordpress/.test(value)) return "workflow";
  return "other";
}

function inferTitle(routePath, componentName) {
  if (routePath === "/") return "Redirect către Tablou de bord";
  if (routePath === "*" || routePath.endsWith("/*")) return "Pagina nu a fost găsită";
  const segment = routePath.split("/").filter(Boolean).at(-1) ?? componentName;
  return segment
    .replace(/^:/, "Parametru ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toLocaleUpperCase("ro-RO"));
}

function updateRouteContext(context, elementExpression, hasChildren) {
  if (!hasChildren) return context;
  const component = firstComponent(elementExpression);
  const wrappers = [...context.wrappers];
  if (component && !wrappers.includes(component)) wrappers.push(component);
  let access = context.access;
  const applicationKey = elementExpression?.match(/applicationKey\s*=\s*["']([^"']+)["']/)?.[1];
  if (component === "StaffRoute") access = "staff";
  else if (applicationKey) access = `aplicație: ${applicationKey}`;
  else if (component === "AuthenticationGate" && access === "public") access = "autentificat";
  return { ...context, access, wrappers };
}

function discoverRoutes(routerSource) {
  const assignment = routerSource.indexOf("export const appRoutes");
  const arrayStart = routerSource.indexOf("[", assignment);
  const arrayEnd = arrayStart >= 0 ? findMatching(routerSource, arrayStart, "[", "]") : -1;
  if (assignment < 0 || arrayStart < 0 || arrayEnd < 0) {
    throw new Error("Nu am putut localiza export const appRoutes în router.tsx.");
  }
  const routes = [];

  function visitArray(arraySource, context) {
    for (const objectSource of splitTopLevel(arraySource)) {
      if (!objectSource.trimStart().startsWith("{")) continue;
      const properties = parseObjectProperties(objectSource);
      const rawPath = unquote(properties.get("path"));
      const isIndex = properties.get("index") === "true";
      const element = properties.get("element") ?? "";
      const handle = properties.get("handle") ?? "";
      const children = properties.get("children");
      const hasChildren = Boolean(children);
      const ownPath = rawPath ? joinRoutePath(context.parentPath, rawPath) : context.parentPath;
      const nextContext = updateRouteContext(
        { ...context, parentPath: ownPath },
        element,
        hasChildren,
      );

      if (isIndex || (rawPath && !hasChildren)) {
        const routePath = isIndex ? context.parentPath || "/" : ownPath;
        routes.push({
          path: routePath,
          entryComponent: firstComponent(element) ?? "UnknownRouteComponent",
          inlineTitle: titleFromExpression(element),
          headerComponent: firstComponent(handle),
          access: context.access,
          wrappers: context.wrappers,
          element,
        });
      }

      if (children) visitArray(children, nextContext);
    }
  }

  visitArray(routerSource.slice(arrayStart, arrayEnd + 1), {
    access: "public",
    parentPath: "",
    wrappers: [],
  });
  return routes;
}

async function walkSourceFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkSourceFiles(fullPath));
      continue;
    }
    if (![".ts", ".tsx"].includes(extname(entry.name))) continue;
    const normalized = fullPath.split(sep).join("/");
    if (ignoredSourceParts.some((part) => normalized.includes(part))) continue;
    files.push(fullPath);
  }
  return files.sort();
}

function resolveLocalImport(fromFile, specifier) {
  let basePath;
  if (specifier.startsWith("@/")) basePath = join(frontendSourceRoot, specifier.slice(2));
  else if (specifier.startsWith(".")) basePath = resolve(dirname(fromFile), specifier);
  else return null;
  const candidates = [basePath, `${basePath}.tsx`, `${basePath}.ts`, join(basePath, "index.tsx"), join(basePath, "index.ts")];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function parseImports(source, filePath) {
  const imports = new Map();
  const pattern = /import\s+(type\s+)?([\s\S]*?)\s+from\s+["']([^"']+)["']\s*;?/g;
  for (const match of source.matchAll(pattern)) {
    if (match[1]) continue;
    const clause = match[2].trim();
    const specifier = match[3];
    const resolved = resolveLocalImport(filePath, specifier);
    const add = (localName, importedName = localName) => {
      if (localName && /^[A-Za-z_$][\w$]*$/.test(localName)) {
        imports.set(localName, { importedName, resolved, specifier });
      }
    };
    const defaultMatch = clause.match(/^([A-Za-z_$][\w$]*)\s*(?:,|$)/);
    if (defaultMatch) add(defaultMatch[1], "default");
    const namedMatch = clause.match(/{([\s\S]*?)}/);
    if (namedMatch) {
      for (const item of namedMatch[1].split(",")) {
        const clean = item.trim();
        if (!clean || clean.startsWith("type ")) continue;
        const [imported, local] = clean.split(/\s+as\s+/);
        add((local ?? imported).trim(), imported.trim());
      }
    }
    const namespaceMatch = clause.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
    if (namespaceMatch) add(namespaceMatch[1]);
  }
  return imports;
}

function declaredComponents(source) {
  const names = new Set();
  for (const match of source.matchAll(/(?:export\s+)?(?:default\s+)?function\s+([A-Z][A-Za-z0-9]*)\b/g)) names.add(match[1]);
  for (const match of source.matchAll(/(?:export\s+)?const\s+([A-Z][A-Za-z0-9]*)\s*(?::[^=]+)?=/g)) names.add(match[1]);
  return names;
}

function extractComponentBody(source, componentName) {
  const functionPattern = new RegExp(`(?:export\\s+)?(?:default\\s+)?function\\s+${componentName}\\b`);
  const functionMatch = functionPattern.exec(source);
  if (functionMatch) {
    const parametersStart = source.indexOf("(", functionMatch.index + functionMatch[0].length);
    const parametersEnd = parametersStart >= 0 ? findMatching(source, parametersStart, "(", ")") : -1;
    const bodyStart = parametersEnd >= 0 ? source.indexOf("{", parametersEnd) : -1;
    const bodyEnd = bodyStart >= 0 ? findMatching(source, bodyStart, "{", "}") : -1;
    if (bodyStart >= 0 && bodyEnd >= 0) return source.slice(bodyStart + 1, bodyEnd);
  }

  const constPattern = new RegExp(`(?:export\\s+)?const\\s+${componentName}\\b`);
  const constMatch = constPattern.exec(source);
  if (constMatch) {
    const arrow = source.indexOf("=>", constMatch.index + constMatch[0].length);
    if (arrow >= 0) {
      let bodyStart = arrow + 2;
      while (/\s/.test(source[bodyStart] ?? "")) bodyStart += 1;
      if (source[bodyStart] === "{") {
        const bodyEnd = findMatching(source, bodyStart, "{", "}");
        if (bodyEnd >= 0) return source.slice(bodyStart + 1, bodyEnd);
      }
      const end = source.indexOf(";", bodyStart);
      return source.slice(bodyStart, end >= 0 ? end : source.length);
    }
  }
  return source;
}

function parseStaticAttribute(attributes, attributeName) {
  const pattern = new RegExp(`\\b${attributeName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|{\\s*\`([^\`]*)\`\\s*})`);
  const match = attributes.match(pattern);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function scanJsxTags(body) {
  const tags = [];
  for (let index = 0; index < body.length; index += 1) {
    if (body[index] !== "<") continue;
    let cursor = index + 1;
    const closing = body[cursor] === "/";
    if (closing) cursor += 1;
    const nameMatch = body.slice(cursor).match(/^([A-Za-z][A-Za-z0-9.-]*)/);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    cursor += name.length;
    const attributesStart = cursor;
    let braceDepth = 0;
    while (cursor < body.length) {
      const skipped = skipLexical(body, cursor);
      if (skipped !== cursor) {
        cursor = skipped;
        continue;
      }
      if (body[cursor] === "{") braceDepth += 1;
      else if (body[cursor] === "}") braceDepth = Math.max(0, braceDepth - 1);
      else if (body[cursor] === ">" && braceDepth === 0) break;
      cursor += 1;
    }
    if (cursor >= body.length) continue;
    const attributes = body.slice(attributesStart, cursor);
    tags.push({
      attributes,
      closing,
      index,
      name,
      selfClosing: /\/\s*$/.test(attributes),
    });
    index = cursor;
  }
  return tags;
}

function parseJsx(body, imports, localComponents) {
  const roots = [];
  const stack = [{ name: "__root__", children: roots }];
  for (const tag of scanJsxTags(body)) {
    const { closing, name } = tag;
    const isHtml = htmlTags.has(name);
    const isComponent = /^[A-Z]/.test(name) && (imports.has(name) || localComponents.has(name) || ["Suspense", "Navigate", "Outlet"].includes(name));
    if (!isHtml && !isComponent) continue;
    if (closing) {
      for (let index = stack.length - 1; index > 0; index -= 1) {
        if (stack[index].name === name) {
          stack.length = index;
          break;
        }
      }
      continue;
    }
    const prefix = body.slice(Math.max(0, tag.index - 180), tag.index);
    const className = parseStaticAttribute(tag.attributes, "className");
    const id = parseStaticAttribute(tag.attributes, "id");
    const node = {
      name,
      kind: isHtml ? "html" : "component",
      classes: className ? className.split(/\s+/).filter((value) => value && !value.includes("${")) : [],
      id,
      conditional: /(?:&&|\?|:\s*)[^;{}]{0,100}$/.test(prefix),
      repeated: /\.map\s*\([^)]{0,160}$/.test(prefix),
      children: [],
    };
    stack.at(-1).children.push(node);
    const selfClosing = tag.selfClosing || voidTags.has(name);
    if (!selfClosing) stack.push(node);
  }
  return roots;
}

function lazyComponents(routerSource) {
  const result = new Map();
  const pattern = /const\s+([A-Z][A-Za-z0-9]*)\s*=\s*lazy\s*\([\s\S]*?import\(["']([^"']+)["']\)[\s\S]*?\}\s*\);/g;
  for (const match of routerSource.matchAll(pattern)) {
    result.set(match[1], resolveLocalImport(routerFile, match[2]));
  }
  return result;
}

function wrapperTerminals(routerSource) {
  const result = new Map();
  for (const match of routerSource.matchAll(/function\s+([A-Z][A-Za-z0-9]*Route)\s*\(/g)) {
    const body = extractComponentBody(routerSource, match[1]);
    const components = [...body.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)].map((item) => item[1]);
    const terminal = [...components].reverse().find((name) => /Page$/.test(name));
    if (terminal) result.set(match[1], terminal);
  }
  return result;
}

function renderOutline(node, label, childrenKey = "children") {
  const lines = [label(node)];
  function visit(children, prefix) {
    children.forEach((child, index) => {
      const last = index === children.length - 1;
      lines.push(`${prefix}${last ? "└── " : "├── "}${label(child)}`);
      visit(child[childrenKey] ?? [], `${prefix}${last ? "    " : "│   "}`);
    });
  }
  visit(node[childrenKey] ?? [], "");
  return lines.join("\n");
}

function componentLabel(node) {
  const source = node.source ? ` — ${node.source}` : "";
  const repeat = node.repeated ? " × listă" : "";
  const condition = node.conditional ? " [condiționat]" : "";
  const cycle = node.cycle ? " [referință repetată]" : "";
  return `<${node.name} />${source}${repeat}${condition}${cycle}`;
}

function domLabel(node) {
  if (node.kind === "component") return `[${node.name}] — ${node.source ?? "sursă externă"}`;
  const classes = node.classes.slice(0, 8).map((className) => `.${className}`).join("");
  const id = node.id ? `#${node.id}` : "";
  const repeat = node.repeated ? " × listă" : "";
  const condition = node.conditional ? " [condiționat]" : "";
  return `${node.name}${classes}${id} — ${node.owner} — ${node.source}${repeat}${condition}`;
}

function normalizeDomTree(nodes, owner, source, componentChildren, depth = 0) {
  if (depth > 20) return [];
  return nodes.flatMap((node) => {
    if (node.kind === "html") {
      return [{ ...node, owner, source, children: normalizeDomTree(node.children, owner, source, componentChildren, depth + 1) }];
    }
    const component = componentChildren.find((candidate) => candidate.name === node.name);
    if (!component) return [];
    return [{
      ...node,
      source: component.source,
      children: normalizeDomTree(component.jsxTree, component.name, component.source ?? source, component.children, depth + 1),
    }];
  });
}

function jsxTemplateSignature(nodes) {
  return nodes.map((node) => {
    if (node.kind === "component") {
      return `Component(${jsxTemplateSignature(node.children)})`;
    }
    const classes = [...node.classes].sort().join(".");
    const id = node.id ? "#id" : "";
    return `${node.name}${classes ? `.${classes}` : ""}${id}(${jsxTemplateSignature(node.children)})`;
  }).join("|");
}

function rootStructure(nodes) {
  const directHtml = nodes.find((node) => node.kind === "html");
  if (directHtml) {
    const classes = [...directHtml.classes].sort().join(".");
    return `${directHtml.name}${classes ? `.${classes}` : ""}`;
  }
  const directComponent = nodes.find((node) => node.kind === "component");
  return directComponent ? "componentă delegată direct" : "fără element JSX detectabil";
}

function collectTreeNodes(node, result = []) {
  result.push(node);
  for (const child of node.children ?? []) collectTreeNodes(child, result);
  return result;
}

function buildComponentScanner(fileSources, importCache) {
  const unresolved = new Set();

  function expand(componentName, filePath, ancestors = [], inheritedFlags = {}, budget = { count: 0 }) {
    budget.count += 1;
    const sourcePath = filePath ? toPosix(filePath) : null;
    const key = `${componentName}@${sourcePath ?? "external"}`;
    if (!filePath || !fileSources.has(filePath)) {
      return { ...inheritedFlags, name: componentName, source: sourcePath, children: [], jsxTree: [] };
    }
    if (ancestors.includes(key) || ancestors.length >= 12 || budget.count > 350) {
      return { ...inheritedFlags, name: componentName, source: sourcePath, children: [], jsxTree: [], cycle: true };
    }
    const source = fileSources.get(filePath);
    const imports = importCache.get(filePath);
    const locals = declaredComponents(source);
    const body = extractComponentBody(source, componentName);
    const jsxTree = parseJsx(body, imports, locals);
    const occurrences = [];
    function findComponents(nodes) {
      for (const node of nodes) {
        if (node.kind === "component" && node.name !== componentName) occurrences.push(node);
        findComponents(node.children);
      }
    }
    findComponents(jsxTree);
    const seen = new Set();
    const children = [];
    for (const occurrence of occurrences) {
      if (seen.has(occurrence.name)) continue;
      seen.add(occurrence.name);
      const imported = imports.get(occurrence.name);
      const childFile = imported?.resolved ?? (locals.has(occurrence.name) ? filePath : null);
      if (!childFile && !imported) unresolved.add(`${occurrence.name} (${sourcePath})`);
      const stopAtPrimitive = childFile?.includes(`${sep}components${sep}ui${sep}`);
      const occurrenceFlags = { conditional: occurrence.conditional, repeated: occurrence.repeated };
      const child = stopAtPrimitive
        ? { ...occurrenceFlags, name: occurrence.name, source: toPosix(childFile), children: [], jsxTree: [] }
        : expand(occurrence.name, childFile, [...ancestors, key], occurrenceFlags, budget);
      children.push(child);
    }
    return { ...inheritedFlags, name: componentName, source: sourcePath, children, jsxTree };
  }

  return { expand, unresolved };
}

function dependencyFiles(startFile, fileSources, importCache) {
  const visited = new Set();
  const usedExports = new Map();
  function visit(filePath, depth, importedName = "*") {
    if (!filePath || !fileSources.has(filePath) || depth > 18) return;
    if (!usedExports.has(filePath)) usedExports.set(filePath, new Set());
    usedExports.get(filePath).add(importedName);
    if (visited.has(filePath)) return;
    visited.add(filePath);
    if (filePath.includes(`${sep}components${sep}ui${sep}`)) return;
    for (const imported of importCache.get(filePath).values()) visit(imported.resolved, depth + 1, imported.importedName);
  }
  visit(startFile, 0);
  return { files: [...visited].sort(), usedExports };
}

function interpolateEndpoint(expression, constants) {
  let value = expression.trim();
  if (/^[A-Za-z_$][\w$]*$/.test(value)) value = constants.get(value) ?? value;
  else if ((value.startsWith("`") && value.endsWith("`")) || ((value.startsWith('"') || value.startsWith("'")) && value.at(-1) === value[0])) {
    value = value.slice(1, -1);
  }
  value = value.replace(/\$\{([A-Za-z_$][\w$]*)}/g, (_match, name) => constants.get(name) ?? `{${name}}`);
  value = value.replace(/\$\{([^}]+)}/g, (_match, name) => `{${String(name).trim().replace(/\W+/g, "_")}}`);
  return value;
}

function extractEndpoints(files, fileSources, usedExports) {
  const endpoints = new Map();
  for (const filePath of files) {
    const source = fileSources.get(filePath);
    if (!source || filePath.endsWith(`${sep}api${sep}http.ts`)) continue;
    const constants = new Map();
    for (const match of source.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=\s*(["'])([^"']*\/api\/v1\/[^"']*)\2/g)) constants.set(match[1], match[3]);
    for (const match of source.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=\s*`([^`]*\/api\/v1\/[^`]*)`/g)) constants.set(match[1], match[2]);
    const callPattern = /\b(apiRequest|apiDownload)(?:<[^;()]*>)?\s*\(\s*(`(?:\\.|[^`])*`|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|[A-Za-z_$][\w$]*)/g;
    for (const match of source.matchAll(callPattern)) {
      const path = interpolateEndpoint(match[2], constants);
      if (!path.startsWith("/api/")) continue;
      const open = source.indexOf("(", match.index + match[1].length);
      const close = open >= 0 ? findMatching(source, open, "(", ")") : -1;
      const callSource = close >= 0 ? source.slice(open, close + 1) : source.slice(open, open + 500);
      const method = callSource.match(/\bmethod\s*:\s*["'](GET|POST|PUT|PATCH|DELETE)["']/i)?.[1]?.toUpperCase() ?? "GET";
      const prefix = source.slice(0, match.index);
      const consumers = [...prefix.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)];
      const consumer = consumers.at(-1)?.[1] ?? toPosix(filePath);
      const requestedExports = usedExports.get(filePath);
      const isApiModule = filePath.endsWith(`${sep}api.ts`) || filePath.includes(`${sep}api${sep}`);
      if (
        isApiModule &&
        requestedExports &&
        !requestedExports.has("*") &&
        !requestedExports.has(consumer)
      ) continue;
      endpoints.set(`${method} ${path}`, { method, path, consumer, source: toPosix(filePath) });
    }
  }
  return [...endpoints.values()].sort((left, right) => `${left.path} ${left.method}`.localeCompare(`${right.path} ${right.method}`));
}

function scanFrontendConsumers(routes, sourceFiles, fileSources, importCache) {
  const allExports = new Map(sourceFiles.map((filePath) => [filePath, new Set(["*"])]));
  const definitions = extractEndpoints(sourceFiles, fileSources, allExports);
  const consumers = [];
  for (const definition of definitions) {
    const definitionFile = join(repositoryRoot, definition.source);
    for (const importerFile of sourceFiles) {
      const importerSource = fileSources.get(importerFile) ?? "";
      const importerPath = toPosix(importerFile);
      if (/\.(?:test|spec)\.[jt]sx?$/.test(importerPath)) continue;
      const matchingImports = [...(importCache.get(importerFile)?.entries() ?? [])].filter(([, imported]) =>
        imported.resolved === definitionFile && imported.importedName === definition.consumer,
      );
      if (!matchingImports.length) continue;
      const usedLocals = matchingImports.map(([local]) => local).filter((local) => new RegExp(`\\b${local}\\b`).test(importerSource));
      if (!usedLocals.length) continue;
      const componentNames = [...declaredComponents(importerSource)];
      const exportedFunctions = [...importerSource.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)].map((match) => match[1]);
      const owner = stableUnique([...componentNames, ...exportedFunctions]).join(", ") || importerPath;
      const routePaths = routes
        .filter((route) => route.autoScan?.sourceFiles.includes(importerPath))
        .map((route) => route.path);
      consumers.push({
        method: definition.method,
        path: definition.path,
        apiFunction: definition.consumer,
        component: owner,
        source: importerPath,
        apiSource: definition.source,
        routePaths,
      });
    }
  }
  return consumers;
}

function detectStates(files, fileSources) {
  const source = files.map((filePath) => fileSources.get(filePath) ?? "").join("\n");
  const loading = /\bisLoading\b|\bisPending\b|\bloading\b|<Suspense\b|QueryApplicationState/.test(source);
  const error = /\bisError\b|\berror\b|<Alert\b|ApiError|onError/.test(source);
  const empty = /\.length\s*===?\s*0|!\s*\w+\.length|<Empty\b|Nu există|Niciun(?:ă)?\s/.test(source);
  const forms = [];
  if (/<form\b/.test(source)) forms.push("Formular HTML detectat automat în graful rutei.");
  if (/<input\b|<Input\b/.test(source)) forms.push("Câmpuri input detectate automat.");
  if (/<textarea\b|<Textarea\b/.test(source)) forms.push("Câmp textarea detectat automat.");
  if (/<select\b|<Select\b|<NativeSelect\b/.test(source)) forms.push("Control de selecție detectat automat.");
  const actions = [];
  if (/<button\b|<Button\b/.test(source)) actions.push("Butoane/acțiuni detectate automat în JSX.");
  if (/useMutation|mutateAsync|\.mutate\b/.test(source)) actions.push("Mutație TanStack Query detectată automat.");
  if (/download|apiDownload/i.test(source)) actions.push("Acțiune de descărcare detectată automat.");
  return {
    badges: {
      loading: loading ? "present" : "missing",
      error: error ? "present" : "missing",
      empty: empty ? "present" : "missing",
    },
    forms,
    actions,
  };
}

function resolveRouteTerminal(route, routerImports, lazyMap, wrapperMap) {
  let terminalComponent = route.entryComponent;
  if (wrapperMap.has(terminalComponent)) terminalComponent = wrapperMap.get(terminalComponent);
  const sourceFile = lazyMap.get(terminalComponent) ?? routerImports.get(terminalComponent)?.resolved ?? null;
  const lazy = lazyMap.has(terminalComponent) || wrapperMap.has(route.entryComponent);
  return { terminalComponent, sourceFile, lazy };
}

function wrapComponentTree(componentTree, wrappers, importCache) {
  let node = componentTree;
  const routerImports = importCache.get(routerFile);
  for (const wrapper of [...wrappers].reverse()) {
    const sourceFile = routerImports.get(wrapper)?.resolved ?? routerFile;
    node = { name: wrapper, source: toPosix(sourceFile), children: [node], jsxTree: [] };
  }
  return node;
}

function buildScan(route, terminal, scanner, fileSources, importCache) {
  const componentTree = scanner.expand(terminal.terminalComponent, terminal.sourceFile);
  const wrappedTree = wrapComponentTree(componentTree, route.wrappers, importCache);
  const dependencyGraph = dependencyFiles(terminal.sourceFile, fileSources, importCache);
  const componentNodes = collectTreeNodes(wrappedTree, []);
  const domChildren = normalizeDomTree(componentTree.jsxTree, componentTree.name, componentTree.source ?? "frontend/src/app/router.tsx", componentTree.children);
  const domRoot = {
    kind: "component",
    name: componentTree.name,
    source: componentTree.source,
    children: domChildren,
  };
  const componentOutline = renderOutline(wrappedTree, componentLabel);
  const domOutline = renderOutline(domRoot, domLabel);
  const endpoints = extractEndpoints(dependencyGraph.files, fileSources, dependencyGraph.usedExports);
  const detectedStates = detectStates(dependencyGraph.files, fileSources);
  const sourceFiles = stableUnique([
    ...dependencyGraph.files.map(toPosix),
    ...componentNodes.map((node) => node.source),
    "frontend/src/app/router.tsx",
  ]);
  const componentEntries = stableUnique(componentNodes.map((node) => node.name)).map((name) => {
    const node = componentNodes.find((candidate) => candidate.name === name);
    return { name, source: node?.source ?? null };
  });
  const domEntries = collectTreeNodes(domRoot, []).filter((node) => node.kind === "html").map(domLabel);
  const fingerprintInput = sourceFiles.map((sourcePath) => {
    const absolute = join(repositoryRoot, sourcePath);
    return `${sourcePath}\0${fileSources.get(absolute) ?? ""}`;
  }).join("\0");
  return {
    version: SCANNER_VERSION,
    sourceFingerprint: hashValue(fingerprintInput),
    sourceFiles,
    components: componentEntries,
    domNodes: stableUnique(domEntries),
    endpoints,
    detectedStates,
    routeTemplateSignature: jsxTemplateSignature(componentTree.jsxTree),
    rootStructure: rootStructure(componentTree.jsxTree),
    wrappers: route.wrappers,
    terminalSource: componentTree.source,
    componentOutline,
    domOutline,
  };
}

function sameEndpointFamily(left, right) {
  const leftSegments = left.split("?", 1)[0].split("/");
  const rightSegments = right.split("?", 1)[0].split("/");
  if (leftSegments.length !== rightSegments.length) return false;
  return leftSegments.every((segment, index) => {
    const other = rightSegments[index];
    return segment === other || /{[^}]+}/.test(segment) || /{[^}]+}/.test(other);
  });
}

function mergeEndpoints(documented, scanned) {
  const result = [...documented];
  for (const endpoint of scanned) {
    const represented = result.some((candidate) =>
      candidate.method === endpoint.method && sameEndpointFamily(candidate.path, endpoint.path),
    );
    if (!represented) result.push(endpoint);
  }
  return result;
}

function mergeBadge(documented, scanned) {
  if (documented === "present" || scanned !== "present") return documented;
  if (documented === "common") return "partial";
  return "present";
}

function markdownSection(markdown, heading) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return markdown.match(new RegExp(`## ${escapedHeading}\\s*([\\s\\S]*?)(?=\\n## |$)`))?.[1] ?? "";
}

function markdownCodeBlock(markdown, heading) {
  return markdownSection(markdown, heading).match(/```(?:text)?\s*\n([\s\S]*?)\n```/)?.[1]?.trim() ?? null;
}

function markdownIssues(markdown) {
  return [...markdownSection(markdown, "Probleme structurale").matchAll(/^-\s+(.+)$/gm)]
    .map((match) => match[1].replace(/`/g, "").trim());
}

async function documentedRouteAnalysis(route) {
  if (!route.report) return { domOutline: route.domOutline, issues: route.issues };
  const reportPath = resolve(viewerDirectory, route.report);
  if (!existsSync(reportPath)) return { domOutline: route.domOutline, issues: route.issues };
  const markdown = await readFile(reportPath, "utf8");
  const domOutline = markdownCodeBlock(markdown, "DOM outline estimat") ?? route.domOutline;
  const issues = markdownIssues(markdown);
  const hasIssuesSection = markdown.includes("## Probleme structurale");
  return { domOutline, issues: hasIssuesSection ? issues : route.issues };
}

function componentRootLabel(scan, componentName) {
  const marker = ` — ${componentName} — `;
  return scan.domNodes.find((node) => node.includes(marker))?.split(marker, 1)[0] ?? null;
}

function isNestedMainClaim(text) {
  return /al doilea\s+main|main\s+(?:i|î)mbricat|main\s*>\s*(?:[^.\n]*>\s*)?main/i.test(text);
}

function reconcileDomOutline(domOutline, scan) {
  const applicationStateRoot = componentRootLabel(scan, "ApplicationState");
  if (!applicationStateRoot || applicationStateRoot.startsWith("main")) return domOutline;

  return domOutline.split("\n").map((line) => {
    const markerIndex = line.indexOf("[ApplicationState]");
    if (markerIndex < 0) return line;
    const rootIndex = line.lastIndexOf("main", markerIndex);
    if (rootIndex < 0) return line;
    return `${line.slice(0, rootIndex)}${applicationStateRoot} ${line.slice(markerIndex)}`;
  }).join("\n");
}

function reconcileIssues(issues, scan) {
  const applicationStateRoot = componentRootLabel(scan, "ApplicationState");
  if (!applicationStateRoot || applicationStateRoot.startsWith("main")) return issues;
  return issues.filter((issue) => !isNestedMainClaim(issue));
}

function reconcileDocumentedPatterns(patterns, scans) {
  const applicationStateRoot = scans.map((scan) => componentRootLabel(scan, "ApplicationState")).find(Boolean);
  if (!applicationStateRoot || applicationStateRoot.startsWith("main")) return patterns;

  return patterns.map((pattern) => {
    if (!isNestedMainClaim(pattern.differences ?? "")) return pattern;
    return {
      ...pattern,
      category: pattern.id === "async-page-state" ? "existent" : pattern.category,
      differences: pattern.id === "async-page-state"
        ? "Query-urile blocante folosesc retry; erorile operațiilor locale rămân inline sau în toast. ApplicationState produce o secțiune semantică în shell."
        : pattern.differences.replace(/ApplicationState produce main\s+(?:i|î)mbricat în shell\.?/i, "ApplicationState produce o secțiune semantică în shell."),
      candidate: pattern.id === "async-page-state"
        ? "Păstrează contractul comun QueryApplicationState și separă erorile blocante de feedbackul operațiilor locale."
        : pattern.candidate,
    };
  });
}

function assertNoContradictedApplicationStateMainClaims(data, scans) {
  const applicationStateRoot = scans.map((scan) => componentRootLabel(scan, "ApplicationState")).find(Boolean);
  if (!applicationStateRoot || applicationStateRoot.startsWith("main")) return;
  const serialized = JSON.stringify(data);
  if (isNestedMainClaim(serialized) || /main[^"\\n]*\[ApplicationState\]/i.test(serialized)) {
    throw new Error("Analiza manuală contrazice scanarea actuală: ApplicationState are root section, dar viewerul păstrează o afirmație despre main imbricat.");
  }
}

async function documentedEndpoints(route) {
  if (!route.report) return route.api;
  const reportPath = resolve(viewerDirectory, route.report);
  if (!existsSync(reportPath)) return route.api;
  const markdown = await readFile(reportPath, "utf8");
  const section = markdown.match(/## Endpointuri Django\/API\s*([\s\S]*?)(?=\n## |$)/)?.[1] ?? "";
  const found = new Map();
  const currentByKey = new Map(route.api.map((endpoint) => [`${endpoint.method} ${endpoint.path}`, endpoint]));
  const add = (method, path, consumer) => {
    const key = `${method} ${path}`;
    found.set(key, currentByKey.get(key) ?? { method, path, consumer: consumer || "raport Markdown" });
  };
  for (const match of section.matchAll(/`(GET|POST|PUT|PATCH|DELETE)\s+(\/api\/[^`]+)`(?:\s*(?:—|-)\s*([^\n]+))?/g)) {
    add(match[1], match[2], match[3]?.replace(/`/g, "").trim());
  }
  for (const match of section.matchAll(/^\|\s*`(GET|POST|PUT|PATCH|DELETE)`\s*\|\s*`([^`]+)`\s*\|\s*(.*?)\|\s*$/gm)) {
    add(match[1], match[2], match[3].replace(/`/g, "").trim());
  }
  return found.size ? [...found.values()] : route.api;
}

function automaticRouteRecord(route, terminal, scan, order, data) {
  const title = route.inlineTitle ?? inferTitle(route.path, terminal.terminalComponent);
  const module = inferModule(route.path);
  const pageType = inferPageType(route.path, terminal.terminalComponent);
  return {
    id: `auto-${slugify(route.path)}`,
    order,
    path: route.path,
    title,
    module,
    pageType,
    terminalComponent: terminal.terminalComponent,
    pageComponentDescription: `${terminal.terminalComponent} detectată automat din ${scan.components.find((item) => item.name === terminal.terminalComponent)?.source ?? "router"}.`,
    access: route.access,
    lazy: terminal.lazy,
    report: null,
    componentOutline: scan.componentOutline,
    domOutline: scan.domOutline,
    api: scan.endpoints.length ? scan.endpoints : [{ method: "GET", path: "/api/v1/core/bootstrap", consumer: "runtime comun" }],
    stateBadges: scan.detectedStates.badges,
    states: {
      loading: scan.detectedStates.badges.loading === "present" ? ["Stare loading detectată automat în sursele rutei."] : [],
      error: scan.detectedStates.badges.error === "present" ? ["Stare error detectată automat în sursele rutei."] : [],
      empty: scan.detectedStates.badges.empty === "present" ? ["Stare empty detectată automat în sursele rutei."] : [],
      forms: scan.detectedStates.forms,
      actions: scan.detectedStates.actions,
      all: [...scan.detectedStates.forms, ...scan.detectedStates.actions],
    },
    issues: ["Rută nouă documentată automat; nestingul, condițiile și stările trebuie confirmate manual pentru precizie semantică."],
    sourceRefs: scan.sourceFiles.filter((sourcePath) => !/\/(?:types|constants)\.ts$/.test(sourcePath)),
    similarRoutes: data.routes.filter((candidate) => candidate.module === module).map((candidate) => candidate.path).slice(0, 8),
    patternIds: ["runtime-shell"],
    autoGenerated: true,
    autoScan: scan,
  };
}

function updateExistingRoute(existing, discovered, terminal, scan, documentedApi, documentedAnalysis) {
  const sourceRefs = stableUnique([
    ...existing.sourceRefs,
    ...scan.sourceFiles.filter((sourcePath) => /\.tsx$/.test(sourcePath) || /\/api\.ts$/.test(sourcePath)),
  ]);
  const issues = reconcileIssues(
    documentedAnalysis.issues.filter((issue) => !issue.startsWith("Scanner automat:")),
    scan,
  );
  const previousComponents = new Set((existing.autoScan?.components ?? []).map((item) => `${item.name}@${item.source ?? ""}`));
  const currentComponents = new Set(scan.components.map((item) => `${item.name}@${item.source ?? ""}`));
  if (existing.autoScan) {
    const removed = [...previousComponents].filter((key) => !currentComponents.has(key));
    if (removed.length) issues.push(`Scanner automat: ${removed.length} componente din scanarea precedentă nu mai sunt detectate; consultă arborele „Scan actual”.`);
  }
  const previousScannedEndpoints = existing.autoScan?.endpoints ?? [];
  const stillPresentDiscoveries = (existing.autoDiscoveredApi ?? []).filter((endpoint) =>
    scan.endpoints.some((candidate) => candidate.method === endpoint.method && sameEndpointFamily(candidate.path, endpoint.path)),
  );
  const newlyDiscoveredEndpoints = existing.autoScan
    ? scan.endpoints.filter((endpoint) => !previousScannedEndpoints.some((previous) =>
      previous.method === endpoint.method && sameEndpointFamily(previous.path, endpoint.path),
    ))
    : [];
  const autoDiscoveredApi = mergeEndpoints(stillPresentDiscoveries, newlyDiscoveredEndpoints);
  return {
    ...existing,
    path: discovered.path,
    terminalComponent: terminal.terminalComponent,
    access: discovered.access,
    lazy: terminal.lazy,
    domOutline: reconcileDomOutline(documentedAnalysis.domOutline, scan),
    api: mergeEndpoints(documentedApi, autoDiscoveredApi),
    autoDiscoveredApi,
    stateBadges: {
      loading: mergeBadge(existing.stateBadges.loading, scan.detectedStates.badges.loading),
      error: mergeBadge(existing.stateBadges.error, scan.detectedStates.badges.error),
      empty: mergeBadge(existing.stateBadges.empty, scan.detectedStates.badges.empty),
    },
    issues,
    sourceRefs,
    autoScan: scan,
  };
}

function automaticPatterns(routes, documentedPatterns) {
  const documentedText = documentedPatterns.map((pattern) => `${pattern.component} ${pattern.title}`).join(" ").toLowerCase();
  const usage = new Map();
  for (const route of routes) {
    for (const component of route.autoScan?.components ?? []) {
      if (!component.source || genericComponents.has(component.name) || component.source.includes("/components/ui/")) continue;
      const key = `${component.name}@${component.source}`;
      if (!usage.has(key)) usage.set(key, { ...component, routes: [] });
      usage.get(key).routes.push(route.path);
    }
  }
  return [...usage.values()]
    .filter((entry) => new Set(entry.routes).size >= 2)
    .filter((entry) => !documentedText.includes(entry.name.toLowerCase()))
    .map((entry) => ({
      id: `auto-component-${slugify(entry.name)}`,
      title: `${entry.name} detectată pe mai multe rute`,
      category: "scan automat",
      component: entry.name,
      source: entry.source,
      routes: stableUnique(entry.routes),
      evidence: `Scannerul a găsit componenta în graful JSX al ${new Set(entry.routes).size} rute.`,
      differences: "Scannerul static nu poate confirma diferențele de props sau comportamentul runtime.",
      candidate: "Verifică manual dacă folosirile reprezintă aceeași structură înainte de orice refactorizare.",
    }));
}

function generateInconsistencies(routes, patterns, labels) {
  const groups = [];
  const byRoutePath = new Map(routes.map((route) => [route.path, route]));
  const groupValues = (items, keyFor) => {
    const grouped = new Map();
    for (const item of items) {
      const key = keyFor(item);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(item);
    }
    return grouped;
  };
  const variantsFor = (items, labelFor) => [...groupValues(items, labelFor)].map(([label, members]) => ({
    label,
    routes: members.map((route) => route.path),
  }));

  for (const pattern of patterns.filter((item) => ["duplicat", "inconsistent", "candidat"].includes(item.category))) {
    const patternRoutes = pattern.routes.map((routePath) => byRoutePath.get(routePath)).filter(Boolean);
    if (patternRoutes.length < 2) continue;
    groups.push({
      id: `known-${pattern.id}`,
      kind: "known-pattern",
      severity: pattern.category === "inconsistent" ? "high" : "medium",
      confidence: 95,
      title: pattern.title,
      routes: patternRoutes.map((route) => route.path),
      common: pattern.evidence,
      differences: pattern.differences,
      recommendation: pattern.candidate,
      sources: stableUnique([pattern.source, ...patternRoutes.flatMap((route) => route.sourceRefs.slice(0, 2))]),
      variants: variantsFor(patternRoutes, (route) => `${route.pageType} · ${route.terminalComponent}`),
    });
  }

  for (const [terminalComponent, members] of groupValues(routes, (route) => route.terminalComponent)) {
    if (members.length < 2) continue;
    const pageTypes = new Set(members.map((route) => route.pageType));
    const modules = new Set(members.map((route) => route.module));
    const terminalSource = members.find((route) => route.autoScan?.terminalSource)?.autoScan?.terminalSource;
    groups.push({
      id: `same-view-${slugify(terminalComponent)}`,
      kind: "same-view",
      severity: pageTypes.size > 1 ? "high" : "info",
      confidence: 100,
      title: `${terminalComponent} deservește ${members.length} rute`,
      routes: members.map((route) => route.path),
      common: `Aceeași componentă terminală și aceeași implementare sursă sunt randate de toate cele ${members.length} rute.`,
      differences: `Rutele acoperă ${pageTypes.size} tipuri de pagină și ${modules.size} module; diferențele sunt furnizate prin props, parametri sau contextul routerului.`,
      recommendation: pageTypes.size > 1
        ? "Separă prezentările cu semnificație diferită (de exemplu placeholder față de not-found), păstrând doar cadrul comun reutilizabil."
        : "Reutilizarea este deja centralizată. Verifică dacă aliasurile de rută sunt intenționate și dacă variațiile prin props rămân accesibile.",
      sources: stableUnique([terminalSource, ...members.flatMap((route) => route.sourceRefs.slice(0, 1))]),
      variants: variantsFor(members, (route) => `${route.module} · ${route.pageType}`),
    });
  }

  const templateCandidates = routes.filter((route) => route.autoScan?.routeTemplateSignature);
  for (const [key, members] of groupValues(templateCandidates, (route) => `${route.pageType}\0${route.autoScan.routeTemplateSignature}`)) {
    if (members.length < 2 || new Set(members.map((route) => route.terminalComponent)).size < 2) continue;
    const signature = key.split("\0")[1];
    groups.push({
      id: `same-template-${hashValue(key).slice(0, 10)}`,
      kind: "same-template",
      severity: "medium",
      confidence: 92,
      title: `${members.length} componente de pagină au același template JSX`,
      routes: members.map((route) => route.path),
      common: `Structura directă a componentei de rută este identică după normalizarea numelor componentelor copil: ${signature.slice(0, 180)}.`,
      differences: `Componentele terminale sunt ${stableUnique(members.map((route) => route.terminalComponent)).join(", ")}.`,
      recommendation: "Evaluează un wrapper comun de pagină sau o convenție unică; păstrează componentele separate dacă ele reprezintă granițe de domeniu utile.",
      sources: stableUnique(members.map((route) => route.autoScan.terminalSource)),
      variants: variantsFor(members, (route) => route.terminalComponent),
    });
  }

  for (const [pageType, members] of groupValues(routes, (route) => route.pageType)) {
    if (members.length < 2) continue;
    const stateLabel = (route) => `loading:${route.stateBadges.loading} · error:${route.stateBadges.error} · empty:${route.stateBadges.empty}`;
    const variants = variantsFor(members, stateLabel);
    if (variants.length < 2) continue;
    const hasMissing = members.some((route) => Object.values(route.stateBadges).includes("missing"));
    groups.push({
      id: `state-variation-${slugify(pageType)}`,
      kind: "state-variation",
      severity: hasMissing ? "high" : "medium",
      confidence: 100,
      title: `Stări asincrone neuniforme pentru paginile de tip „${labels.pageTypes[pageType] ?? pageType}”`,
      routes: members.map((route) => route.path),
      common: `Toate cele ${members.length} rute sunt clasificate ca ${labels.pageTypes[pageType] ?? pageType}.`,
      differences: `${variants.length} combinații distincte de loading/error/empty sunt documentate.`,
      recommendation: "Definește același contract loading/error/empty pentru paginile cu același rol și justifică explicit excepțiile.",
      sources: stableUnique(members.flatMap((route) => route.sourceRefs.slice(0, 1))),
      variants,
    });
  }

  for (const [module, members] of groupValues(routes.filter((route) => !["redirect", "not-found"].includes(route.pageType)), (route) => route.module)) {
    if (members.length < 3) continue;
    const variants = variantsFor(members, (route) => route.autoScan?.rootStructure ?? "necunoscut");
    if (variants.length < 2) continue;
    groups.push({
      id: `layout-variation-${slugify(module)}`,
      kind: "layout-variation",
      severity: "medium",
      confidence: 90,
      title: `Structuri root diferite în modulul „${labels.modules[module] ?? module}”`,
      routes: members.map((route) => route.path),
      common: `Rutele aparțin aceluiași modul și folosesc același shell global${module === "administrare" ? " plus AdministrationLayout" : ""}.`,
      differences: `${variants.length} forme distincte ale elementului root au fost detectate în componentele terminale.`,
      recommendation: "Alege o convenție pentru wrapperul route-level (element semantic, min-height, flex și gap) și documentează excepțiile de workflow.",
      sources: stableUnique(members.map((route) => route.autoScan?.terminalSource)),
      variants,
    });
  }

  const severityRank = { high: 0, medium: 1, info: 2 };
  groups.sort((left, right) =>
    severityRank[left.severity] - severityRank[right.severity] || left.title.localeCompare(right.title, "ro"),
  );
  return {
    summary: {
      total: groups.length,
      high: groups.filter((group) => group.severity === "high").length,
      duplicateImplementations: groups.filter((group) => ["same-view", "same-template"].includes(group.kind)).length,
      stateMismatches: groups.filter((group) => group.kind === "state-variation").length,
      layoutMismatches: groups.filter((group) => group.kind === "layout-variation").length,
    },
    groups,
  };
}

function snapshotAppSource(appSource, serializedData) {
  const startMarker = "/* DATA_SNAPSHOT_START — actualizat de refresh-data.mjs */";
  const endMarker = "/* DATA_SNAPSHOT_END */";
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker);
  if (start < 0 || end < 0 || end <= start) throw new Error("Markerii snapshotului lipsesc din app.js.");
  const replacement = `${startMarker}\nconst EMBEDDED_DATA = ${serializedData};\n`;
  return appSource.slice(0, start) + replacement + appSource.slice(end);
}

function runBackendScanner() {
  const result = spawnSync("python3", [backendScannerFile], {
    cwd: repositoryRoot,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`Scannerul backend a eșuat:\n${result.stderr || result.stdout}`);
  }
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`Scannerul backend nu a produs JSON valid: ${error.message}`);
  }
}

function endpointPathMatches(frontendPath, backendPath) {
  const normalize = (value) => value
    .split("?", 1)[0]
    .replace(/\/$/, "")
    .split("/")
    .filter(Boolean);
  const frontendSegments = normalize(frontendPath);
  const backendSegments = normalize(backendPath);
  if (frontendSegments.length !== backendSegments.length) return false;
  return frontendSegments.every((segment, index) => {
    const other = backendSegments[index];
    const dynamic = /{[^}]+}|…|\[[^\]]+]/;
    return segment === other || dynamic.test(segment) || dynamic.test(other);
  });
}

function backendEntityIndexes(backend) {
  const serializers = new Map();
  const services = new Map();
  const models = new Map();
  const tasks = new Map();
  const permissions = new Map();
  const authentication = new Map();
  const throttles = new Map();
  const filters = new Map();
  const paginators = new Map();
  for (const app of backend.applications) {
    for (const serializer of app.serializers) serializers.set(serializer.name, {...serializer, app: app.id});
    for (const service of app.services) {
      services.set(service.qualifiedName, service);
      services.set(service.name, service);
    }
    for (const model of app.models) {
      models.set(`${app.id}.${model.name}`, {...model, app: app.id});
      models.set(model.name, {...model, app: app.id});
    }
    for (const task of app.tasks) tasks.set(`apps.${app.id}.tasks.${task.name}`, {...task, app: app.id});
    for (const item of app.permissions) permissions.set(item.name, {...item, app: app.id});
    for (const item of app.authenticationClasses) authentication.set(item.name, {...item, app: app.id});
    for (const item of app.throttles) throttles.set(item.name, {...item, app: app.id});
    for (const item of app.filters) filters.set(item.name, {...item, app: app.id});
    for (const item of app.paginators) paginators.set(item.name, {...item, app: app.id});
  }
  return {serializers, services, models, tasks, permissions, authentication, throttles, filters, paginators};
}

function buildApiFindings(endpoints) {
  const findings = [];
  const byPath = new Map();
  for (const endpoint of endpoints) {
    const canonicalPath = endpoint.path.replace(/\/$/, "");
    if (!byPath.has(canonicalPath)) byPath.set(canonicalPath, []);
    byPath.get(canonicalPath).push(endpoint);
  }
  const authAliases = endpoints.filter((endpoint) => endpoint.method === "GET" && ["/api/v1/auth", "/api/v1/auth/"].includes(endpoint.path));
  if (authAliases.length === 2) {
    findings.push({
      id: "api-auth-alias",
      title: "Două rute GET expun rădăcina autentificării",
      classification: "corect și intenționat",
      severity: "info",
      certainty: "confirmed",
      endpointIds: authAliases.map((endpoint) => endpoint.id),
      evidence: "Contractul backend declară explicit atât /api/v1/auth, cât și /api/v1/auth/; implementările returnează inventarul endpointurilor de autentificare.",
      recommendation: "Păstrează aliasurile numai cât timp sunt parte din contract și testează răspunsul identic.",
    });
  }
  for (const [path, members] of byPath) {
    if (members.length < 2) continue;
    const permissionSets = new Set(members.map((endpoint) => endpoint.permissions.join(",")));
    if (permissionSets.size > 1) {
      findings.push({
        id: `api-permission-${slugify(path)}`,
        title: `Permissions diferite pe aceeași resursă: ${path}`,
        classification: "posibil inconsistent",
        severity: "medium",
        certainty: "confirmed",
        endpointIds: members.map((endpoint) => endpoint.id),
        evidence: members.map((endpoint) => `${endpoint.method}: ${endpoint.permissions.join(", ")}`).join("; "),
        recommendation: "Confirmă dacă diferența este cerută de operație; nu uniformiza automat citirea publică și scrierea administrativă.",
      });
    }
    const categories = new Set(members.map((endpoint) => endpoint.category));
    if (categories.has("CRUD") && categories.has("workflow/comandă")) {
      findings.push({
        id: `api-mixed-${slugify(path)}`,
        title: `CRUD și comandă workflow pe aceeași resursă: ${path}`,
        classification: "necesită decizie de arhitectură",
        severity: "medium",
        certainty: "inference",
        endpointIds: members.map((endpoint) => endpoint.id),
        evidence: members.map((endpoint) => `${endpoint.method} → ${endpoint.category}`).join("; "),
        recommendation: "Decide dacă acțiunea reprezintă tranziția resursei sau o comandă separată; ambele variante pot fi corecte.",
      });
    }
  }
  const reactSpecificPublic = endpoints.filter((endpoint) =>
    endpoint.reactRoutes.length && endpoint.permissions.includes("AllowAny") &&
    ["endpoint intern pentru frontend", "auth/bootstrap"].includes(endpoint.category),
  );
  if (reactSpecificPublic.length) {
    findings.push({
      id: "api-react-public-boundary",
      title: "Endpointuri folosite de shell-ul React sunt accesibile fără autentificare",
      classification: "necesită decizie de arhitectură",
      severity: "info",
      certainty: "confirmed",
      endpointIds: reactSpecificPublic.map((endpoint) => endpoint.id),
      evidence: reactSpecificPublic.map((endpoint) => `${endpoint.method} ${endpoint.path}`).join(", "),
      recommendation: "Documentează explicit care date sunt branding/bootstrap public și care aparțin sesiunii; React nu este o limită de securitate.",
    });
  }
  const unconsumed = endpoints.filter((endpoint) => endpoint.usage === "fără consumator static identificat" && endpoint.path.startsWith("/api/v1/"));
  if (unconsumed.length) {
    findings.push({
      id: "api-no-static-consumer",
      title: `${unconsumed.length} endpointuri fără consumator identificabil static`,
      classification: "necesită decizie de arhitectură",
      severity: "info",
      certainty: "inference",
      endpointIds: unconsumed.map((endpoint) => endpoint.id),
      evidence: "Au fost verificate apelurile React scanate și referințele URL literale din backend; consumatori externi/runtime pot exista.",
      recommendation: "Nu elimina endpointurile pe baza acestei constatări; confirmă schema, clienții externi, joburile și logurile de acces.",
    });
  }
  return findings;
}

function correlateBackendScan(scan, routes, frontendConsumers) {
  const backend = scan.backend;
  const indexes = backendEntityIndexes(backend);
  const endpoints = scan.api.endpoints;
  const consumersByEndpoint = new Map(endpoints.map((endpoint) => [endpoint.id, []]));
  const matchScore = (frontendPath, backendPath) => {
    const left = frontendPath.split("?", 1)[0].replace(/\/$/, "").split("/").filter(Boolean);
    const right = backendPath.split("?", 1)[0].replace(/\/$/, "").split("/").filter(Boolean);
    return left.reduce((score, segment, index) => {
      const other = right[index];
      if (segment === other) return score + 4;
      if (/{[^}]+}|…|\[[^\]]+]/.test(segment) && /{[^}]+}/.test(other)) return score + 2;
      return score;
    }, 0);
  };
  for (const route of routes) {
    for (const api of route.api) {
      const scannedConsumer = (route.autoScan?.endpoints ?? []).find((candidate) =>
        candidate.method === api.method && endpointPathMatches(candidate.path, api.path),
      );
      const candidates = endpoints.filter((endpoint) =>
        endpoint.method === api.method && endpointPathMatches(api.path, endpoint.path),
      );
      const bestScore = Math.max(-1, ...candidates.map((endpoint) => matchScore(api.path, endpoint.path)));
      for (const endpoint of candidates.filter((candidate) => matchScore(api.path, candidate.path) === bestScore)) {
        consumersByEndpoint.get(endpoint.id).push({
          routeId: route.id,
          routePath: route.path,
          component: route.terminalComponent,
          consumer: api.consumer,
          source: scannedConsumer?.source ?? route.autoScan?.terminalSource ?? route.sourceRefs[0] ?? null,
        });
      }
    }
  }
  for (const frontendConsumer of frontendConsumers) {
    const candidates = endpoints.filter((endpoint) =>
      endpoint.method === frontendConsumer.method && endpointPathMatches(frontendConsumer.path, endpoint.path),
    );
    const bestScore = Math.max(-1, ...candidates.map((endpoint) => matchScore(frontendConsumer.path, endpoint.path)));
    for (const endpoint of candidates.filter((candidate) => matchScore(frontendConsumer.path, candidate.path) === bestScore)) {
      const routePaths = frontendConsumer.routePaths.length ? frontendConsumer.routePaths : [null];
      for (const routePath of routePaths) {
        const existing = consumersByEndpoint.get(endpoint.id).find((consumer) => consumer.routePath === routePath);
        if (existing) {
          existing.hookOrComponent = frontendConsumer.component;
          existing.apiFunction = frontendConsumer.apiFunction;
          existing.source = frontendConsumer.source;
          existing.apiSource = frontendConsumer.apiSource;
          continue;
        }
        const route = routePath ? routes.find((candidate) => candidate.path === routePath) : null;
        consumersByEndpoint.get(endpoint.id).push({
          routeId: route?.id ?? null,
          routePath,
          component: route?.terminalComponent ?? frontendConsumer.component,
          hookOrComponent: frontendConsumer.component,
          apiFunction: frontendConsumer.apiFunction,
          consumer: frontendConsumer.apiFunction,
          source: frontendConsumer.source,
          apiSource: frontendConsumer.apiSource,
        });
      }
    }
  }
  for (const endpoint of endpoints) {
    const consumers = consumersByEndpoint.get(endpoint.id);
    endpoint.reactConsumers = consumers;
    endpoint.reactRoutes = stableUnique(consumers.map((consumer) => consumer.routePath).filter(Boolean));
    endpoint.usage = consumers.length
      ? "utilizat de React"
      : ["/api/schema", "/api/docs", "/api/redoc", "/api/v1/health"].includes(endpoint.path)
        ? "intern/infrastructură"
        : "fără consumator static identificat";
    endpoint.usageCertainty = consumers.length ? "confirmed" : "inference";
    endpoint.permissionDetails = endpoint.permissions.map((name) => indexes.permissions.get(name)).filter(Boolean);
    endpoint.authenticationDetails = endpoint.authentication.map((name) => indexes.authentication.get(name)).filter(Boolean);
    endpoint.throttleDetails = endpoint.throttling.map((name) => indexes.throttles.get(name)).filter(Boolean);
    endpoint.filterDetails = endpoint.filters.map((name) => indexes.filters.get(name)).filter(Boolean);
    endpoint.paginationDetails = endpoint.pagination.map((name) => indexes.paginators.get(name)).filter(Boolean);
    const serviceQueue = [...endpoint.services];
    const serviceClosure = [];
    while (serviceQueue.length) {
      const serviceName = serviceQueue.shift();
      if (serviceClosure.includes(serviceName)) continue;
      serviceClosure.push(serviceName);
      const service = indexes.services.get(serviceName);
      for (const call of service?.calls ?? []) {
        if (indexes.services.has(call) && !serviceClosure.includes(call)) serviceQueue.push(call);
      }
    }
    endpoint.services = serviceClosure;
    endpoint.serializerDetails = stableUnique([
      endpoint.requestSerializer,
      ...endpoint.parameterSerializers,
      ...endpoint.responseSerializers,
      ...endpoint.errorSerializers,
    ]).map((name) => indexes.serializers.get(name)).filter(Boolean);
    const serviceModels = endpoint.services.flatMap((serviceName) => indexes.services.get(serviceName)?.models ?? []);
    const serializerModels = endpoint.serializerDetails.flatMap((serializer) => serializer.models ?? []);
    endpoint.models = stableUnique([...endpoint.models, ...serviceModels, ...serializerModels]);
    endpoint.serviceDetails = endpoint.services.map((name) => indexes.services.get(name)).filter(Boolean);
    endpoint.tasks = endpoint.tasks.map((name) => ({name, source: indexes.tasks.get(name)?.file ?? endpoint.viewSource.file}));
    const app = backend.applications.find((candidate) => candidate.id === endpoint.app);
    const serviceCalls = endpoint.serviceDetails.flatMap((service) => service.calls);
    endpoint.externalIntegrations = (app?.integrations ?? []).filter((integration) => {
      const moduleName = integration.file.replace(/^backend\//, "").replace(/\.py$/, "").replaceAll("/", ".");
      return serviceCalls.some((call) => call === moduleName || call.startsWith(moduleName + "."));
    });
    endpoint.modelDetails = endpoint.models.map((name) => indexes.models.get(name) ?? indexes.models.get(name.split(".").at(-1))).filter(Boolean);
    endpoint.sourceRefs = stableUnique([
      endpoint.urlConfiguration.file,
      endpoint.viewSource.file,
      ...endpoint.permissionDetails.map((item) => item.file),
      ...endpoint.authenticationDetails.map((item) => item.file),
      ...endpoint.throttleDetails.map((item) => item.file),
      ...endpoint.filterDetails.map((item) => item.file),
      ...endpoint.paginationDetails.map((item) => item.file),
      ...endpoint.serializerDetails.map((item) => item.file),
      ...endpoint.serviceDetails.map((item) => item.file),
      ...endpoint.modelDetails.map((item) => item.file),
      ...endpoint.tasks.map((item) => item.source),
      ...endpoint.externalIntegrations.map((item) => item.file),
      ...endpoint.reactConsumers.flatMap((consumer) => [consumer.source, consumer.apiSource]),
    ]);
  }
  const apiFindings = buildApiFindings(endpoints);
  for (const endpoint of endpoints) {
    endpoint.findings = apiFindings.filter((finding) => finding.endpointIds.includes(endpoint.id));
  }
  return {
    apiExplorer: {
      meta: scan.meta,
      endpoints,
      findings: apiFindings,
      summary: {
        endpoints: endpoints.length,
        applications: new Set(endpoints.map((endpoint) => endpoint.app)).size,
        usedByReact: endpoints.filter((endpoint) => endpoint.reactRoutes.length).length,
        withAnyReactConsumer: endpoints.filter((endpoint) => endpoint.reactConsumers.length).length,
        staticReactConsumers: frontendConsumers.length,
        noStaticConsumer: endpoints.filter((endpoint) => endpoint.usage === "fără consumator static identificat").length,
        withFindings: endpoints.filter((endpoint) => endpoint.findings.length).length,
      },
    },
    backendExplorer: {
      meta: scan.meta,
      ...backend,
      summary: {
        applications: backend.applications.length,
        models: backend.applications.reduce((sum, app) => sum + app.models.length, 0),
        views: backend.applications.reduce((sum, app) => sum + app.views.length, 0),
        serializers: backend.applications.reduce((sum, app) => sum + app.serializers.length, 0),
        services: backend.applications.reduce((sum, app) => sum + app.services.length, 0),
        tasks: backend.applications.reduce((sum, app) => sum + app.tasks.length, 0),
        findings: backend.findings.length,
      },
    },
  };
}

function buildDataFlows(routes, apiExplorer, backendExplorer) {
  const endpointFlows = apiExplorer.endpoints.map((endpoint) => {
    const consumers = endpoint.reactConsumers;
    const relatedRoutes = consumers.map((consumer) => routes.find((route) => route.id === consumer.routeId)).filter(Boolean);
    const stages = [
      {
        type: "react-route",
        label: "React route",
        certainty: consumers.length ? "confirmed" : "not-applicable",
        items: consumers.length
          ? consumers.map((consumer) => ({label: consumer.routePath ?? "runtime React comun", detail: consumer.component, source: consumer.source}))
          : [{label: "Niciun consumator React identificat", detail: endpoint.usage, source: null}],
      },
      {
        type: "react-consumer",
        label: "Query / mutation / componentă",
        certainty: consumers.length ? "confirmed" : "not-applicable",
        items: consumers.map((consumer) => ({label: consumer.hookOrComponent ?? consumer.consumer, detail: consumer.apiFunction ?? consumer.component, source: consumer.source})),
      },
      {
        type: "http",
        label: "HTTP endpoint",
        certainty: "confirmed",
        items: [{label: `${endpoint.method} ${endpoint.path}`, detail: endpoint.routeName, source: endpoint.urlConfiguration.file}],
      },
      {
        type: "django-view",
        label: "Django URL → View",
        certainty: "confirmed",
        items: [{label: endpoint.view, detail: endpoint.viewType, source: endpoint.viewSource.file}],
      },
      {
        type: "serializer",
        label: "Serializers",
        certainty: endpoint.serializerDetails.length ? "confirmed" : "not-applicable",
        items: endpoint.serializerDetails.map((serializer) => ({label: serializer.name, detail: serializer.bases.join(", "), source: serializer.file})),
      },
      {
        type: "service",
        label: "Services",
        certainty: endpoint.serviceDetails.length ? "confirmed" : "not-applicable",
        items: endpoint.serviceDetails.map((service) => ({label: service.name, detail: service.qualifiedName, source: service.file})),
      },
      {
        type: "model",
        label: "Models / database",
        certainty: endpoint.models.length ? "confirmed" : "not-applicable",
        items: endpoint.models.map((name) => {
          const model = endpoint.modelDetails.find((candidate) => `${candidate.app}.${candidate.name}` === name);
          return {label: name, detail: model ? `${model.fields.length} câmpuri` : "model extern / Django", source: model?.file ?? null};
        }),
      },
      {
        type: "task-integration",
        label: "Celery / integrare externă",
        certainty: endpoint.tasks.length || endpoint.externalIntegrations.length ? "confirmed" : "not-applicable",
        items: [
          ...endpoint.tasks.map((task) => ({label: task.name, detail: "Celery task", source: task.source})),
          ...endpoint.externalIntegrations.map((integration) => ({label: integration.name, detail: integration.libraries.join(", ") || "integrare externă", source: integration.file})),
        ],
      },
      {
        type: "response",
        label: "Response → React state",
        certainty: "confirmed",
        items: [{
          label: endpoint.responseSerializers.join(", ") || endpoint.responseCodes.join(", "),
          detail: relatedRoutes.length
            ? stableUnique(relatedRoutes.map((route) => `loading:${route.stateBadges.loading}/error:${route.stateBadges.error}/empty:${route.stateBadges.empty}`)).join("; ")
            : endpoint.errorShape,
          source: endpoint.viewSource.file,
        }],
      },
    ];
    return {
      id: `flow-${endpoint.id}`,
      title: `${endpoint.method} ${endpoint.path}`,
      endpointId: endpoint.id,
      app: endpoint.app,
      routes: endpoint.reactRoutes,
      reactConsumers: consumers.length,
      models: endpoint.models,
      services: endpoint.serviceDetails.map((service) => service.qualifiedName),
      tasks: endpoint.tasks.map((task) => task.name),
      stages,
      hasInference: stages.some((stage) => stage.certainty === "inference"),
      hasProblem: endpoint.findings.length > 0,
    };
  });
  const flows = [...endpointFlows];
  const endpointRouteIds = new Set(apiExplorer.endpoints.flatMap((endpoint) => endpoint.reactConsumers.map((consumer) => consumer.routeId)));
  for (const route of routes.filter((candidate) => !endpointRouteIds.has(candidate.id))) {
    flows.push({
      id: `flow-route-${route.id}`,
      kind: "react-route",
      title: route.path,
      endpointId: null,
      app: null,
      routes: [route.path],
      models: [],
      services: [],
      tasks: [],
      stages: [
        {type: "react-route", label: "React route", certainty: "confirmed", items: [{label: route.path, detail: route.title, source: "frontend/src/app/router.tsx"}]},
        {type: "react-consumer", label: "Componentă route-level", certainty: "confirmed", items: [{label: route.terminalComponent, detail: route.pageType, source: route.autoScan?.terminalSource ?? route.sourceRefs[0]}]},
        {type: "http", label: "HTTP endpoint", certainty: "not-applicable", items: [{label: "Niciun endpoint corelat", detail: "Ruta nu declară apeluri API în analiza frontend curentă.", source: null}]},
        {type: "response", label: "React state", certainty: "confirmed", items: [{label: `loading:${route.stateBadges.loading} / error:${route.stateBadges.error} / empty:${route.stateBadges.empty}`, detail: route.states?.actions?.join("; ") ?? "", source: route.autoScan?.terminalSource ?? route.sourceRefs[0]}]},
      ],
      hasInference: false,
      hasProblem: route.issues.length > 0,
    });
  }
  for (const app of backendExplorer.applications) {
    const modelNames = app.models.map((model) => `${app.id}.${model.name}`);
    const serviceNames = app.services.map((service) => service.qualifiedName);
    const taskNames = app.tasks.map((task) => `apps.${app.id}.tasks.${task.name}`);
    flows.push({
      id: `flow-app-${app.id}`,
      kind: "django-application",
      title: app.id,
      endpointId: null,
      app: app.id,
      routes: [],
      models: modelNames,
      services: serviceNames,
      tasks: taskNames,
      stages: [
        {type: "django-app", label: "Aplicație Django", certainty: "confirmed", items: [{label: app.id, detail: app.name, source: app.config}]},
        {type: "django-view", label: "URL-uri / views", certainty: "confirmed", items: app.views.map((view) => ({label: view.name, detail: view.bases.join(", "), source: view.file}))},
        {type: "serializer", label: "Serializers", certainty: "confirmed", items: app.serializers.map((serializer) => ({label: serializer.name, detail: `${serializer.lines} linii`, source: serializer.file}))},
        {type: "service", label: "Services", certainty: "confirmed", items: app.services.map((service) => ({label: service.qualifiedName, detail: service.models.join(", "), source: service.file}))},
        {type: "model", label: "Models", certainty: "confirmed", items: app.models.map((model) => ({label: `${app.id}.${model.name}`, detail: `${model.fields.length} câmpuri`, source: model.file}))},
        {type: "task-integration", label: "Tasks / integrări", certainty: app.tasks.length || app.integrations.length ? "confirmed" : "not-applicable", items: [
          ...app.tasks.map((task) => ({label: `apps.${app.id}.tasks.${task.name}`, detail: task.calls.join(", "), source: task.file})),
          ...app.integrations.map((integration) => ({label: integration.name, detail: integration.libraries.join(", "), source: integration.file})),
        ]},
        {type: "dependency", label: "Dependențe cross-app", certainty: "confirmed", items: app.dependencies.filter((edge) => edge.from === app.id).map((edge) => ({label: `${edge.from} → ${edge.to}`, detail: edge.symbol, source: edge.source}))},
      ],
      hasInference: false,
      hasProblem: app.findings.length > 0,
    });
    for (const model of app.models) {
      const modelName = `${app.id}.${model.name}`;
      const consumers = app.services.filter((service) => service.models.includes(modelName));
      flows.push({
        id: `flow-model-${slugify(modelName)}`,
        kind: "model",
        title: modelName,
        endpointId: null,
        app: app.id,
        routes: [],
        models: [modelName],
        services: consumers.map((service) => service.qualifiedName),
        tasks: [],
        stages: [
          {type: "django-app", label: "Aplicație Django", certainty: "confirmed", items: [{label: app.id, detail: app.name, source: app.config}]},
          {type: "model", label: "Model / database", certainty: "confirmed", items: [{label: modelName, detail: `${model.fields.length} câmpuri · ${model.methods.length} metode`, source: model.file}]},
          {type: "relation", label: "Relații model", certainty: model.relations.length ? "confirmed" : "not-applicable", items: model.relations.map((relation) => ({label: `${relation.type} ${relation.field} → ${relation.target}`, detail: "relație declarată în model", source: model.file}))},
          {type: "service", label: "Services care accesează modelul", certainty: consumers.length ? "confirmed" : "not-applicable", items: consumers.map((service) => ({label: service.qualifiedName, detail: "referință statică la model", source: service.file}))},
        ],
        hasInference: false,
        hasProblem: false,
      });
    }
    for (const service of app.services) {
      const relatedTasks = app.tasks.filter((task) => task.calls.includes(service.qualifiedName));
      const relatedIntegrations = app.integrations.filter((integration) => {
        const moduleName = integration.file.replace(/^backend\//, "").replace(/\.py$/, "").replaceAll("/", ".");
        return service.calls.some((call) => call === moduleName || call.startsWith(moduleName + "."));
      });
      flows.push({
        id: `flow-service-${slugify(service.qualifiedName)}`,
        kind: "service",
        title: service.qualifiedName,
        endpointId: null,
        app: app.id,
        routes: [],
        models: service.models.filter((model) => model.startsWith(`${app.id}.`)),
        services: [service.qualifiedName],
        tasks: relatedTasks.map((task) => `apps.${app.id}.tasks.${task.name}`),
        stages: [
          {type: "django-app", label: "Aplicație Django", certainty: "confirmed", items: [{label: app.id, detail: app.name, source: app.config}]},
          {type: "service", label: "Service", certainty: "confirmed", items: [{label: service.qualifiedName, detail: `${service.lines} linii`, source: service.file}]},
          {type: "call", label: "Apeluri statice", certainty: service.calls.length ? "confirmed" : "not-applicable", items: service.calls.map((call) => ({label: call, detail: "apel identificat în AST", source: service.file}))},
          {type: "model", label: "Models accesate", certainty: service.models.length ? "confirmed" : "not-applicable", items: service.models.map((model) => ({label: model, detail: "referință statică", source: service.file}))},
          {type: "task-integration", label: "Celery / integrare externă", certainty: relatedTasks.length || relatedIntegrations.length ? "confirmed" : "not-applicable", items: [
            ...relatedTasks.map((task) => ({label: `apps.${app.id}.tasks.${task.name}`, detail: "apelează service-ul", source: task.file})),
            ...relatedIntegrations.map((integration) => ({label: integration.name, detail: integration.libraries.join(", "), source: integration.file})),
          ]},
        ],
        hasInference: false,
        hasProblem: false,
      });
    }
    for (const task of app.tasks) {
      const taskName = `apps.${app.id}.tasks.${task.name}`;
      const calledServices = app.services.filter((service) => task.calls.includes(service.qualifiedName));
      const taskIntegrations = app.integrations.filter((integration) => {
        const moduleName = integration.file.replace(/^backend\//, "").replace(/\.py$/, "").replaceAll("/", ".");
        return calledServices.some((service) => service.calls.some((call) => call === moduleName || call.startsWith(moduleName + ".")));
      });
      flows.push({
        id: `flow-task-${slugify(taskName)}`,
        kind: "celery-task",
        title: taskName,
        endpointId: null,
        app: app.id,
        routes: [],
        models: stableUnique(calledServices.flatMap((service) => service.models.filter((model) => model.startsWith(`${app.id}.`)))),
        services: calledServices.map((service) => service.qualifiedName),
        tasks: [taskName],
        stages: [
          {type: "django-app", label: "Aplicație Django", certainty: "confirmed", items: [{label: app.id, detail: app.name, source: app.config}]},
          {type: "task-integration", label: "Celery task", certainty: "confirmed", items: [{label: taskName, detail: task.decorators.join(", "), source: task.file}]},
          {type: "call", label: "Apeluri din task", certainty: task.calls.length ? "confirmed" : "not-applicable", items: task.calls.map((call) => ({label: call, detail: "apel identificat în AST", source: task.file}))},
          {type: "service", label: "Services apelate", certainty: calledServices.length ? "confirmed" : "not-applicable", items: calledServices.map((service) => ({label: service.qualifiedName, detail: service.models.join(", "), source: service.file}))},
          {type: "model", label: "Models accesate prin service", certainty: calledServices.some((service) => service.models.length) ? "confirmed" : "not-applicable", items: calledServices.flatMap((service) => service.models.map((model) => ({label: model, detail: `prin ${service.qualifiedName}`, source: service.file})))},
          {type: "integration", label: "Integrări externe prin service", certainty: taskIntegrations.length ? "confirmed" : "not-applicable", items: taskIntegrations.map((integration) => ({label: integration.name, detail: integration.libraries.join(", "), source: integration.file}))},
        ],
        hasInference: false,
        hasProblem: false,
      });
    }
  }
  const indexValues = (key) => stableUnique(flows.flatMap((flow) => flow[key] ?? []));
  return {
    flows,
    startOptions: {
      route: indexValues("routes"),
      endpoint: apiExplorer.endpoints.map((endpoint) => endpoint.id),
      application: stableUnique(backendExplorer.applications.map((app) => app.id)),
      model: indexValues("models"),
      service: indexValues("services"),
      task: indexValues("tasks"),
    },
    summary: {
      flows: flows.length,
      endpointFlows: endpointFlows.length,
      withReact: endpointFlows.filter((flow) => flow.reactConsumers).length,
      withModels: flows.filter((flow) => flow.models.length).length,
      withTasksOrIntegrations: flows.filter((flow) => flow.stages.find((stage) => stage.type === "task-integration")?.items.length).length,
      withInference: flows.filter((flow) => flow.hasInference).length,
    },
  };
}

async function main() {
  for (const requiredPath of [frontendSourceRoot, routerFile, dataFile, viewerAppFile, backendScannerFile, sharedRuntimeReportFile]) {
    if (!existsSync(requiredPath)) throw new Error(`Lipsește calea necesară: ${requiredPath}`);
  }

  const [routerSource, existingDataSource, viewerAppSource, sourceFiles] = await Promise.all([
    readFile(routerFile, "utf8"),
    readFile(dataFile, "utf8"),
    readFile(viewerAppFile, "utf8"),
    walkSourceFiles(frontendSourceRoot),
  ]);
  const data = JSON.parse(existingDataSource);
  const fileSources = new Map(await Promise.all(sourceFiles.map(async (filePath) => [filePath, await readFile(filePath, "utf8")])));
  const importCache = new Map(sourceFiles.map((filePath) => [filePath, parseImports(fileSources.get(filePath), filePath)]));
  const discoveredRoutes = discoverRoutes(routerSource);
  const routerImports = importCache.get(routerFile);
  const lazyMap = lazyComponents(routerSource);
  const wrapperMap = wrapperTerminals(routerSource);
  const scanner = buildComponentScanner(fileSources, importCache);
  const existingByPath = new Map(data.routes.map((route) => [route.path, route]));
  const nextRoutes = [];
  let newRouteCount = 0;

  for (const [index, discovered] of discoveredRoutes.entries()) {
    const terminal = resolveRouteTerminal(discovered, routerImports, lazyMap, wrapperMap);
    const scan = buildScan(discovered, terminal, scanner, fileSources, importCache);
    const existing = existingByPath.get(discovered.path);
    const documentedApi = existing ? await documentedEndpoints(existing) : [];
    const documentedAnalysis = existing ? await documentedRouteAnalysis(existing) : null;
    const route = existing
      ? updateExistingRoute(existing, discovered, terminal, scan, documentedApi, documentedAnalysis)
      : automaticRouteRecord(discovered, terminal, scan, index + 1, data);
    if (!existing) newRouteCount += 1;
    route.order = index + 1;
    nextRoutes.push(route);
    if (verbose) console.log(`${String(index + 1).padStart(2, "0")} ${discovered.path} → ${terminal.terminalComponent} (${scan.sourceFiles.length} fișiere)`);
  }

  const removedRoutes = data.routes.filter((route) => !discoveredRoutes.some((discovered) => discovered.path === route.path));
  const documentedPatterns = reconcileDocumentedPatterns(
    data.patterns.filter((pattern) => !pattern.id.startsWith("auto-component-")),
    nextRoutes.map((route) => route.autoScan),
  );
  const generatedPatterns = automaticPatterns(nextRoutes, documentedPatterns);
  const patterns = [...documentedPatterns, ...generatedPatterns];
  const patternByRoute = new Map();
  for (const pattern of generatedPatterns) {
    for (const routePath of pattern.routes) {
      if (!patternByRoute.has(routePath)) patternByRoute.set(routePath, []);
      patternByRoute.get(routePath).push(pattern.id);
    }
  }
  for (const route of nextRoutes) {
    route.patternIds = stableUnique([
      ...route.patternIds.filter((id) => !id.startsWith("auto-component-")),
      ...(patternByRoute.get(route.path) ?? []),
    ]);
  }
  const runtimePattern = patterns.find((pattern) => pattern.id === "runtime-shell");
  if (runtimePattern) runtimePattern.routes = nextRoutes.map((route) => route.path);

  const allSourceFingerprint = hashValue(sourceFiles.map((filePath) => `${toPosix(filePath)}\0${fileSources.get(filePath)}`).join("\0"));
  const previousFingerprint = data.meta.scan?.sourceFingerprint;
  const changedAt = previousFingerprint === allSourceFingerprint
    ? data.meta.scan?.lastChangedAt
    : new Date().toISOString();
  data.meta = {
    ...data.meta,
    generatedFrom: "frontend/src/app/router.tsx + analiza documentată existentă",
    routeCount: nextRoutes.length,
    note: "Analiza documentată este recitită din rapoartele Markdown și reconciliată cu autoScan, regenerat direct din router și sursele TS/TSX.",
    scan: {
      version: SCANNER_VERSION,
      sourceFingerprint: allSourceFingerprint,
      lastChangedAt: changedAt,
      scannedFiles: sourceFiles.length,
      discoveredRoutes: discoveredRoutes.length,
      automaticallyGeneratedRoutes: nextRoutes.filter((route) => route.autoGenerated).length,
      removedRoutes: removedRoutes.map((route) => route.path),
      unresolvedComponents: scanner.unresolved.size,
    },
  };
  data.routes = nextRoutes;
  data.patterns = patterns;
  const sharedRuntimeMarkdown = await readFile(sharedRuntimeReportFile, "utf8");
  data.sharedRuntime = {
    ...data.sharedRuntime,
    componentOutline: markdownCodeBlock(sharedRuntimeMarkdown, "React component tree global") ?? data.sharedRuntime.componentOutline,
    domOutline: markdownCodeBlock(sharedRuntimeMarkdown, "DOM outline comun") ?? data.sharedRuntime.domOutline,
  };
  data.inconsistencies = generateInconsistencies(nextRoutes, patterns, data.labels);
  const backendScan = runBackendScanner();
  const frontendConsumers = scanFrontendConsumers(nextRoutes, sourceFiles, fileSources, importCache);
  const correlated = correlateBackendScan(backendScan, nextRoutes, frontendConsumers);
  data.apiExplorer = correlated.apiExplorer;
  data.backendExplorer = correlated.backendExplorer;
  data.dataFlows = buildDataFlows(nextRoutes, data.apiExplorer, data.backendExplorer);
  data.meta.backendScan = backendScan.meta;
  assertNoContradictedApplicationStateMainClaims(data, nextRoutes.map((route) => route.autoScan));

  const serializedData = JSON.stringify(data);
  const nextViewerApp = snapshotAppSource(viewerAppSource, serializedData);
  const dataChanged = serializedData !== existingDataSource.trim();
  const appChanged = nextViewerApp !== viewerAppSource;

  if (!checkOnly) {
    if (dataChanged) await writeFile(dataFile, `${serializedData}\n`, "utf8");
    if (appChanged) await writeFile(viewerAppFile, nextViewerApp, "utf8");
  }

  console.log(`Scanare încheiată: ${discoveredRoutes.length} rute, ${sourceFiles.length} fișiere TS/TSX, ${generatedPatterns.length} tipare automate.`);
  console.log(`Backend: ${backendScan.meta.endpoints} endpointuri, ${backendScan.meta.djangoApplications} aplicații Django, ${backendScan.meta.pythonFiles} fișiere Python.`);
  console.log(`Rute noi: ${newRouteCount}; rute eliminate din router: ${removedRoutes.length}; componente nerezolvate: ${scanner.unresolved.size}.`);
  if (checkOnly) {
    console.log(dataChanged || appChanged ? "Viewerul trebuie regenerat (rulează fără --check)." : "Viewerul este sincronizat.");
    if (dataChanged || appChanged) process.exitCode = 1;
  }
  else console.log(dataChanged || appChanged ? "data.json și snapshotul file:// au fost actualizate." : "Nu au fost necesare modificări.");
  if (verbose && scanner.unresolved.size) console.log(`Nerezolvate:\n- ${[...scanner.unresolved].sort().join("\n- ")}`);
  if (removedRoutes.length) console.log(`Eliminate din inventar: ${removedRoutes.map((route) => route.path).join(", ")}`);
}

const directInvocation = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (directInvocation) await main();

export { discoverRoutes };
