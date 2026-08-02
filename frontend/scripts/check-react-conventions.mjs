import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import ts from "typescript";

const root = process.cwd();
const sourceRoot = path.join(root, "src");
const failures = [];
const effectHooks = new Set(["useEffect", "useLayoutEffect"]);
const manualHeadingTextSizes = new Set([
  "text-xs",
  "text-sm",
  "text-base",
  "text-lg",
  "text-xl",
  "text-2xl",
  "text-3xl",
]);
const manualTextRoleSizes = new Set(["text-xs", "text-sm", "text-base"]);

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(entryPath)));
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      files.push(entryPath);
    }
  }

  return files;
}

function report(sourceFile, node, message) {
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  failures.push(
    `${path.relative(root, sourceFile.fileName)}:${position.line + 1}:${position.character + 1} ${message}`,
  );
}

function isNamedCall(node, names) {
  return (
    ts.isCallExpression(node) && ts.isIdentifier(node.expression) && names.has(node.expression.text)
  );
}

function hasJsxAttribute(attributes, name) {
  return attributes.properties.some(
    (property) =>
      ts.isJsxAttribute(property) && ts.isIdentifier(property.name) && property.name.text === name,
  );
}

function getStaticJsxAttributeText(attributes, name) {
  const attribute = attributes.properties.find(
    (property) =>
      ts.isJsxAttribute(property) && ts.isIdentifier(property.name) && property.name.text === name,
  );

  if (!attribute || !ts.isJsxAttribute(attribute) || !attribute.initializer) {
    return null;
  }

  if (ts.isStringLiteral(attribute.initializer)) {
    return attribute.initializer.text;
  }

  if (
    ts.isJsxExpression(attribute.initializer) &&
    attribute.initializer.expression &&
    (ts.isStringLiteral(attribute.initializer.expression) ||
      ts.isNoSubstitutionTemplateLiteral(attribute.initializer.expression))
  ) {
    return attribute.initializer.expression.text;
  }

  return null;
}

function inspectFile(fileName, sourceText) {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  if (sourceText.includes("@ts-ignore")) {
    failures.push(`${path.relative(root, fileName)} uses @ts-ignore.`);
  }

  const relativePath = path.relative(sourceRoot, fileName).replaceAll(path.sep, "/");
  const isUiPrimitive = relativePath.startsWith("components/ui/");
  const requiresTextRoles = ["features/", "pages/", "layout/"].some((directory) =>
    relativePath.startsWith(directory),
  );
  const permitsManualHeadingClasses =
    relativePath === "components/ui/heading.tsx" ||
    relativePath === "features/administration/AdminPageHeader.tsx" ||
    relativePath === "components/ApplicationState.tsx";
  const expectedPageExport =
    relativePath.startsWith("pages/") && relativePath.endsWith("Page.tsx")
      ? path.basename(fileName, ".tsx")
      : null;
  let hasExpectedPageExport = expectedPageExport === null;

  function visit(node) {
    if (ts.isDebuggerStatement(node)) {
      report(sourceFile, node, "Remove debugger statements.");
    }

    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "console" &&
      ["debug", "log"].includes(node.expression.name.text)
    ) {
      report(sourceFile, node, "Remove console.log/console.debug from application code.");
    }

    if (!isUiPrimitive && isNamedCall(node, effectHooks)) {
      if (node.arguments.length < 2 || !ts.isArrayLiteralExpression(node.arguments[1])) {
        report(sourceFile, node, "Effects must declare an explicit dependency array.");
      }
    }

    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      ts.isIdentifier(node.tagName) &&
      node.tagName.text === "img" &&
      !hasJsxAttribute(node.attributes, "alt")
    ) {
      report(sourceFile, node, "Images must provide an alt attribute.");
    }

    if (
      !permitsManualHeadingClasses &&
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      ts.isIdentifier(node.tagName) &&
      ["h1", "h2", "h3"].includes(node.tagName.text)
    ) {
      const className = getStaticJsxAttributeText(node.attributes, "className");
      const hasManualHeadingTextSize = className
        ?.split(/\s+/)
        .some((classToken) => manualHeadingTextSizes.has(classToken));

      if (hasManualHeadingTextSize) {
        report(
          sourceFile,
          node,
          "Folosește `PageTitle`/`SectionTitle` din `@/components/ui/heading`, nu clase scrise manual.",
        );
      }
    }

    if (
      requiresTextRoles &&
      (ts.isStringLiteral(node) ||
        ts.isNoSubstitutionTemplateLiteral(node) ||
        ts.isTemplateHead(node) ||
        ts.isTemplateMiddle(node) ||
        ts.isTemplateTail(node)) &&
      node.text.split(/\s+/).some((classToken) => manualTextRoleSizes.has(classToken))
    ) {
      report(
        sourceFile,
        node,
        "Folosește rolurile din `@/components/ui/text`, nu clasele de text scrise manual.",
      );
    }

    if (
      expectedPageExport &&
      ts.isFunctionDeclaration(node) &&
      node.name?.text === expectedPageExport &&
      node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      hasExpectedPageExport = true;
    }

    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const importPath = node.moduleSpecifier.text;
      if (
        relativePath.startsWith("features/") &&
        (importPath.startsWith("@/pages") || importPath.startsWith("@/layout"))
      ) {
        report(sourceFile, node, "Feature modules must not depend on pages or layout modules.");
      }
      if (
        isUiPrimitive &&
        (importPath.startsWith("@/features") || importPath.startsWith("@/pages"))
      ) {
        report(
          sourceFile,
          node,
          "UI primitives must remain independent from application features.",
        );
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!hasExpectedPageExport) {
    failures.push(
      `${path.relative(root, fileName)} must export a named ${expectedPageExport} component.`,
    );
  }
}

const files = await collectSourceFiles(sourceRoot);
for (const fileName of files) {
  inspectFile(fileName, await readFile(fileName, "utf8"));
}

if (failures.length > 0) {
  console.error("Frontend convention checks failed:\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Frontend convention checks passed (${files.length} source files).`);
