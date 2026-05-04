import { promises as fs, existsSync } from "fs";
import path from "path";
import keyv from "keyv";
import sharp from "sharp";
import mimeType from "mime-types";

const cache = new keyv({
  namespace: "wuwa-api",
  ttl: 1000 * 60 * 5,
});
const dataDir = path.join(process.cwd(), "/assets/data");
const imageDir = path.join(process.cwd(), "/assets/images");

async function pathSafety(base, ...parts) {
  const resolveBase = path.resolve(base);
  const p = path.resolve(resolveBase, ...parts);

  if (p === resolveBase || p.startsWith(resolveBase + path.sep)) {
    return p;
  }
  throw new Error("Path traversal");
}

async function pathExist(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function containsFolders(p) {
  const fullPath = pathSafety(dataDir, p);
  const folder = await fs.readdir(fullPath, {
    withFileTypes: true,
  });
  return folder.some((f) => f.isDirectory());
}

export async function getTypes() {
  const found = await cache.get("types");
  if (found !== undefined) return found;

  const dirs = await fs.readdir(dataDir, { withFileTypes: true });

  const types = dirs.filter((d) => d.isDirectory()).map((d) => d.name);

  await cache.set("types", types);
  if (process.env.NODE_ENV === "development") {
    console.log("Cached types");
  }

  return types;
}

export async function getAvailableEntities(type) {
  const cacheId = ("data-" + type).toLowerCase();
  const found = await cache.get(cacheId);
  if (found !== undefined) return found;

  const dirPath = pathSafety(dataDir, type);
  if (!(await pathExist(dirPath))) return [];

  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  const entities = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  await cache.set(cacheId, entities);
  return entities;
}

export async function getAvailableImages(type, id) {
  const cacheId = ("image-" + type + "-" + id).toLowerCase();
  const found = await cache.get(cacheId);
  if (found !== undefined) return found;

  const filePath = pathSafety(imageDir, type, id);
  if (!(await pathExist(dirPath))) return [];

  const entries = await fs.readdir(filePath, { withFileTypes: true });

  const images = entries.filter((e) => e.isFile()).map((e) => e.name);

  await cache.set(cacheId, images);
  return images;
}

export async function getImage(type, id, image) {
  try {
    const filePath = pathSafety(imageDir, type, id, image);

    if (!(await pathExist(dirPath))) return null;

    const buffer = await fs.readFile(filePath);
    const mime = mimeType.lookup(image) || "application/octet-stream";

    return {
      image: buffer,
      type: mime,
    };
  } catch (e) {
    console.error("Error reading image at " + filePath, e);
    return null;
  }
}

export async function getEntity(type, id) {
  const cacheId = ("data-" + type + "-" + id).toLowerCase();
  const found = await cache.get(cacheId);
  if (found !== undefined) return found;

  const filePath = pathSafety(dataDir, type, id, `${id}.json`);

  if (!(await pathExist(dirPath))) return null;

  try {
    const file = await fs.readFile(filePath, "utf-8");
    const entity = JSON.parse(file);
    await cache.set(cacheId, entity);
    return entity;
  } catch (e) {
    console.error("Error reading entity " + type, e);
    return null;
  }
}
