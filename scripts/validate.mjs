import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const srcRoot = join(root, "src");
const bannedAssetExtensions = new Set([
  ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg",
  ".gltf", ".glb", ".obj", ".fbx", ".mp3", ".wav", ".ogg",
]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

const allFiles = await walk(root);
const forbiddenAssets = allFiles.filter((file) => bannedAssetExtensions.has(extname(file).toLowerCase()));
if (forbiddenAssets.length) {
  throw new Error(`Zero External Assets violado:\n${forbiddenAssets.join("\n")}`);
}

const jsFiles = (await walk(srcRoot)).filter((file) => file.endsWith(".js"));
const importPattern = /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g;
const missingImports = [];

for (const file of jsFiles) {
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1];
    if (!specifier.startsWith(".")) continue;
    const target = resolve(dirname(file), specifier);
    try {
      const info = await stat(target);
      if (!info.isFile()) missingImports.push(`${file} -> ${specifier}`);
    } catch {
      missingImports.push(`${file} -> ${specifier}`);
    }
  }
}

if (missingImports.length) {
  throw new Error(`Imports locales inexistentes:\n${missingImports.join("\n")}`);
}

const totalSourceLines = (await Promise.all(jsFiles.map(async (file) => {
  const source = await readFile(file, "utf8");
  return source.split("\n").length;
}))).reduce((sum, lines) => sum + lines, 0);

console.log(`OK · ${jsFiles.length} módulos JS · ${totalSourceLines} líneas · Zero External Assets verificado`);
