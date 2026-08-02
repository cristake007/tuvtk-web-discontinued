import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error("Usage: node scripts/generate-api-types.mjs <openapi.json> <output.ts>");
  process.exit(2);
}

const document = JSON.parse(await readFile(inputPath, "utf8"));
const sourceSchemas = document.components?.schemas ?? {};
const schemas = { ...sourceSchemas };

// drf-spectacular appends `Request` when COMPONENT_SPLIT_REQUEST is enabled.
// Serializer names that already end in Request therefore become names such as
// LoginRequestRequest. Add a stable alias only when no response schema already
// owns the shorter name.
for (const name of Object.keys(sourceSchemas)) {
  if (!name.endsWith("Request")) {
    continue;
  }
  const stableName = name.slice(0, -"Request".length);
  if (stableName && !schemas[stableName]) {
    schemas[stableName] = { $ref: `#/components/schemas/${name}` };
  }
}

function referenceName(reference) {
  return reference.split("/").at(-1);
}

function withNullable(schema, rendered) {
  return schema.nullable ? `${rendered} | null` : rendered;
}

function renderSchema(schema, depth = 0) {
  if (!schema || typeof schema !== "object") {
    return "unknown";
  }
  if (schema.$ref) {
    return `components["schemas"][${JSON.stringify(referenceName(schema.$ref))}]`;
  }
  if (schema.enum) {
    return withNullable(
      schema,
      schema.enum.map((value) => JSON.stringify(value)).join(" | ") || "never",
    );
  }
  if (schema.oneOf || schema.anyOf) {
    const values = schema.oneOf ?? schema.anyOf;
    return withNullable(schema, values.map((value) => renderSchema(value, depth)).join(" | "));
  }
  if (schema.allOf) {
    return withNullable(
      schema,
      schema.allOf.map((value) => renderSchema(value, depth)).join(" & "),
    );
  }
  if (schema.type === "array") {
    return withNullable(schema, `Array<${renderSchema(schema.items, depth)}>`);
  }
  if (schema.type === "object" || schema.properties) {
    const properties = schema.properties ?? {};
    const required = new Set(schema.required ?? []);
    const indentation = "  ".repeat(depth + 1);
    const closingIndentation = "  ".repeat(depth);
    const propertyTypes = [];
    const lines = Object.entries(properties).map(([name, value]) => {
      const optional = required.has(name) ? "" : "?";
      const rendered = renderSchema(value, depth + 1);
      propertyTypes.push(rendered);
      return `${indentation}${JSON.stringify(name)}${optional}: ${rendered};`;
    });
    if (schema.additionalProperties) {
      const additionalType =
        schema.additionalProperties === true
          ? "unknown"
          : renderSchema(schema.additionalProperties, depth + 1);
      const indexType = [...new Set([additionalType, ...propertyTypes])].join(" | ");
      lines.push(`${indentation}[key: string]: ${indexType};`);
    }
    return withNullable(
      schema,
      lines.length ? `{\n${lines.join("\n")}\n${closingIndentation}}` : "Record<string, unknown>",
    );
  }
  if (schema.type === "integer" || schema.type === "number") {
    return withNullable(schema, "number");
  }
  if (schema.type === "boolean") {
    return withNullable(schema, "boolean");
  }
  if (schema.type === "string") {
    return withNullable(schema, "string");
  }
  return withNullable(schema, "unknown");
}

const schemaLines = Object.keys(schemas)
  .sort((left, right) => left.localeCompare(right))
  .map((name) => `    ${JSON.stringify(name)}: ${renderSchema(schemas[name], 2)};`);

const output = `/* eslint-disable */\n/* This file is generated from the backend OpenAPI schema. Do not edit manually. */\n\nexport interface components {\n  schemas: {\n${schemaLines.join("\n")}\n  };\n}\n`;

await writeFile(outputPath, output, "utf8");
console.log(`Generated ${path.resolve(outputPath)} from ${path.resolve(inputPath)}`);
