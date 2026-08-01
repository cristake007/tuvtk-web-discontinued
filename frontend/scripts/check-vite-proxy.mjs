import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../vite.config.ts", import.meta.url), "utf8");
if (!source.includes('"^/admin(?:/|$)"') || !source.includes('target: "http://backend:8000"')) {
  throw new Error("Vite trebuie să proxifice /admin/ către Django.");
}
if (source.includes('"/administrare": {')) {
  throw new Error("/administrare trebuie să rămână rută SPA, nu proxy Django.");
}
console.log("Vite proxy verificat: /admin/ → Django; /administrare → SPA.");
