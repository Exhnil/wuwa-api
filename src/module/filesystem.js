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
const imageDir = path.join(process.cwd(), "assets", "images");

function pathSafety(base, ...parts) {
  const basePath = path.resolve(base);
  const target = path.resolve(basePath, ...parts);

  const relative = path.relative(basePath, target);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Path traversal");
  }

  return target;
}

async function pathExist(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
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
  if (!(await pathExist(filePath))) return [];

  const entries = await fs.readdir(filePath, { withFileTypes: true });

  const images = entries.filter((e) => e.isFile()).map((e) => e.name);

  await cache.set(cacheId, images);
  return images;
}

export async function getImage(type, id, image) {
  try {
    const basePath = pathSafety(imageDir, type, id);
    const extensions = ["png", "jpg", "jpeg", "webp"];
    console.log(basePath);
    for (const ext of extensions) {
      const filePath = path.join(basePath, `${image}.${ext}`);

      if (await pathExist(filePath)) {
        const buffer = await fs.readFile(filePath);
        const mime = mimeType.lookup(filePath) || "application/octet-stream";

        return {
          image: buffer,
          type: mime,
        };
      }
    }
    return null;
  } catch (e) {
    console.error("Error reading image at " + filePath, e);
    return null;
  }
}

export async function getAsset(relativePath) {
  try {
    const basePath = pathSafety(imageDir, relativePath);
    const extensions = ["png", "jpg", "jpeg", "webp"];
    console.log(basePath);
    for (const ext of extensions) {
      const filePath = `${basePath}.${ext}`;
      console.log(filePath);

      if (await pathExist(filePath)) {
        const buffer = await fs.readFile(filePath);
        const mime = mimeType.lookup(filePath) || "application/octet-stream";

        return {
          image: buffer,
          type: mime,
        };
      }
    }
    return null;
  } catch (e) {
    console.log("Error reading asset", e);
    return null;
  }
}

export async function getEntity(type, id) {
  const cacheId = ("data-" + type + "-" + id).toLowerCase();
  const found = await cache.get(cacheId);
  if (found !== undefined) return found;

  const filePath = pathSafety(dataDir, type, id, `${id}.json`);

  if (!(await pathExist(filePath))) return null;

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
