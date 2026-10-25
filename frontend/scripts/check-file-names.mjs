import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const sourceRoot = path.resolve("src");

const collectSourceFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? collectSourceFiles(entryPath) : [entryPath];
  }));
  return nested.flat().filter((file) => /\.(js|jsx)$/.test(file));
};

const problems = [];
for (const file of await collectSourceFiles(sourceRoot)) {
  const basename = path.basename(file, path.extname(file));
  const source = await readFile(file, "utf8");
  const relative = path.relative(sourceRoot, file);
  const directClasses = [...source.matchAll(/export\s+class\s+([A-Z][A-Za-z0-9]*)/g)].map((match) => match[1]);
  if (directClasses.length === 1 && directClasses[0] !== basename) {
    problems.push(`${relative}: la clase ${directClasses[0]} debe vivir en ${directClasses[0]}${path.extname(file)}`);
  }
  if (basename.startsWith("create") && !new RegExp(`\\b${basename}\\b`).test(source)) {
    problems.push(`${relative}: no exporta una fábrica llamada ${basename}`);
  }
  if (file.endsWith(".jsx")) {
    const defaultExport = source.match(/export\s+default\s+([A-Z][A-Za-z0-9]*)/u)?.[1];
    if (defaultExport && defaultExport !== basename) problems.push(`${relative}: el componente ${defaultExport} debe coincidir con el nombre del archivo`);
  }
}

if (problems.length) {
  console.error(`Se encontraron ${problems.length} nombres incoherentes:\n${problems.map((problem) => `- ${problem}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log("Nombres de archivos comprobados correctamente.");
}
