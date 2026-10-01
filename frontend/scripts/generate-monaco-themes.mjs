/* global console, process */
// Genera el registro de temas de Monaco a partir del paquete `monaco-themes`.
//
// El paquete expone los temas como JSON sueltos en `<packageDir>/themes`. Este
// script los enumera, los reconcilia contra `themelist.json` (slug -> nombre a
// mostrar) y emite un registro con un `import()` dinamico por tema para que cada
// tema se convierta en su propio chunk de Vite.
//
// Uso:
//   node scripts/generate-monaco-themes.mjs           # escribe el archivo
//   node scripts/generate-monaco-themes.mjs --check    # valida sin escribir
import { createRequire } from "node:module";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const outputPath = join(
  scriptDir,
  "..",
  "src",
  "constants",
  "monaco-themes",
  "upstream-themes.generated.ts",
);

const HEADER =
  "// AUTO-GENERADO por scripts/generate-monaco-themes.mjs — no editar a mano.";

/** Escapa un valor para emitirlo como string literal de TypeScript. */
const toTsString = (value) =>
  `'${value.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;

/**
 * Emite la clave de objeto tal como lo haria Prettier (`quoteProps: as-needed`):
 * sin comillas cuando es un identificador valido, con comillas en caso contrario.
 */
const toObjectKey = (value) =>
  /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value) ? value : toTsString(value);

/**
 * Deriva un slug kebab-case a partir del nombre de archivo, para los temas que
 * no tienen entrada en `themelist.json`.
 */
const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Comparador determinista: primero por nombre (sin distinguir mayusculas), luego por id. */
const compareThemes = (a, b) => {
  const aLower = a.name.toLowerCase();
  const bLower = b.name.toLowerCase();
  if (aLower !== bLower) return aLower < bLower ? -1 : 1;
  if (a.name !== b.name) return a.name < b.name ? -1 : 1;
  if (a.id !== b.id) return a.id < b.id ? -1 : 1;
  return 0;
};

/** Lee el paquete instalado y resuelve los temas reconciliados. */
const collectThemes = () => {
  // `monaco-themes@0.4.7` no declara `exports`, por lo que este resolve profundo funciona.
  const packageDir = dirname(require.resolve("monaco-themes/package.json"));
  const themesDir = join(packageDir, "themes");

  const themeList = JSON.parse(
    readFileSync(join(themesDir, "themelist.json"), "utf-8"),
  );
  const slugByDisplayName = new Map(
    Object.entries(themeList).map(([slug, name]) => [name, slug]),
  );

  const themeFiles = readdirSync(themesDir)
    .filter(
      (fileName) => fileName.endsWith(".json") && fileName !== "themelist.json",
    )
    .sort();

  const themes = [];
  const matchedDisplayNames = new Set();
  const unmatchedFiles = [];

  for (const fileName of themeFiles) {
    const stem = fileName.slice(0, -".json".length);
    const slug = slugByDisplayName.get(stem);

    if (slug) {
      matchedDisplayNames.add(stem);
      themes.push({ id: slug, name: stem, fileName });
    } else {
      unmatchedFiles.push(fileName);
      themes.push({ id: slugify(stem), name: stem, fileName });
    }
  }

  const manifestWithoutFile = Object.entries(themeList)
    .filter(([, name]) => !matchedDisplayNames.has(name))
    .map(([slug, name]) => `${slug} (${name})`);

  const seenIds = new Set();
  for (const theme of themes) {
    if (seenIds.has(theme.id))
      throw new Error(
        `Id de tema duplicado: "${theme.id}" (${theme.fileName})`,
      );
    seenIds.add(theme.id);
  }

  return {
    themes: themes.sort(compareThemes),
    unmatchedFiles,
    manifestWithoutFile,
  };
};

/** Construye el contenido completo del archivo generado. */
const buildFile = () => {
  const { themes, unmatchedFiles, manifestWithoutFile } = collectThemes();

  if (unmatchedFiles.length > 0) {
    console.warn(
      `[themes] ${unmatchedFiles.length} archivo(s) sin entrada en themelist.json (se uso el nombre de archivo): ${unmatchedFiles.join(", ")}`,
    );
  }
  if (manifestWithoutFile.length > 0) {
    console.warn(
      `[themes] ${manifestWithoutFile.length} entrada(s) de themelist.json sin archivo (se omiten): ${manifestWithoutFile.join(", ")}`,
    );
  }

  const entries = themes
    .map(
      ({ id, name, fileName }) =>
        `  ${toObjectKey(id)}: { name: ${toTsString(name)}, load: () => import('monaco-themes/themes/${fileName}') },`,
    )
    .join("\n");

  return `${HEADER}\nexport const UpstreamThemes = {\n${entries}\n} as const\n\nexport type UpstreamThemeId = keyof typeof UpstreamThemes\n`;
};

const generated = buildFile();

if (process.argv.includes("--check")) {
  let current = null;
  try {
    current = readFileSync(outputPath, "utf-8");
  } catch {
    console.error(
      `[themes] Falta el archivo generado: ${outputPath}. Ejecuta "pnpm themes:generate".`,
    );
    process.exit(1);
  }
  if (current !== generated) {
    console.error(
      `[themes] El archivo generado esta desactualizado: ${outputPath}. Ejecuta "pnpm themes:generate".`,
    );
    process.exit(1);
  }
  console.log("[themes] El archivo generado esta actualizado.");
  process.exit(0);
}

writeFileSync(outputPath, generated);
console.log(`[themes] Archivo generado: ${outputPath}`);
