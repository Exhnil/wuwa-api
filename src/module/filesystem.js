import { promises as fs } from "fs";
import path from "path";
import keyv from "keyv";
import mimeType from "mime-types";

const cache = new keyv({
  namespace: "wuwa-api",
  ttl: 1000 * 60 * 5,
});
const dataDir = path.join(process.cwd(), "assets", "data");
const imageDir = path.join(process.cwd(), "assets", "images");
const imageExtensions = ["png", "jpg", "jpeg", "webp"];

function pathSafety(base, ...parts) {
  const basePath = path.resolve(base);
  const target = path.resolve(basePath, ...parts);

  const relative = path.relative(basePath, target);

  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    const error = new Error("Path traversal")
    error.code = "PATH_TRAVERSAL"
    throw error;
  }

  return target;
}

export async function getTypes() {
  const cacheId = "types"

  const found = await cache.get(cacheId);
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
  const cacheId = `entities:${type}`;

  const found = await cache.get(cacheId);
  if (found !== undefined) return found;

  const dirPath = pathSafety(dataDir, type);
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    const entities = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();

    await cache.set(cacheId, entities);
    return entities;
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function getAvailableImages(type, id) {
  const cacheId = `images:${type}:${id}`;

  const found = await cache.get(cacheId);
  if (found !== undefined) return found;

  const filePath = pathSafety(imageDir, type, id);

  try {
    const entries = await fs.readdir(filePath, { withFileTypes: true });

    const images = entries.filter((e) => {
      if (!e.isFile()) return false

      const extension = path.extname(e.name).slice(1).toLowerCase()

      return imageExtensions.includes(extension)

    }).map((e) => path.basename(e.name, path.extname(e.name))).sort();

    await cache.set(cacheId, images);
    return images;
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function readImage(filePath) {
  for (const ext of imageExtensions) {
    const candidate = `${filePath}.${ext}`

    try {
      const buffer = await fs.readFile(filePath);
      const mime = mimeType.lookup(filePath) || "application/octet-stream";

      return {
        image: buffer,
        type: mime,
      };
    }
    catch (e) {
      if (e.code === "ENOENT") {
        continue
      }
      throw e
    }
  }

  return null
}

export async function getImage(type, id, image) {
  const filePath = pathSafety(imageDir, type, id, image);
  return readImage(filePath)
}

export async function getAsset(relativePath) {
  const filePath = pathSafety(imageDir, relativePath)
  return readImage(filePath)
}

export async function getEntity(type, id) {
  const cacheId = `entitiy:${type}:${id}`;

  const found = await cache.get(cacheId);
  if (found !== undefined) return found;

  const filePath = pathSafety(dataDir, type, id, `${id}.json`);

  try {
    const file = await fs.readFile(filePath, "utf-8");
    const entity = JSON.parse(file);
    await cache.set(cacheId, entity);
    return entity;
  } catch (e) {
    if (e.code === 'ENOENT') {
      return null
    }

    throw e
  }
}
