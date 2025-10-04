import { promises as fs, existsSync } from "fs";
import path from "path";
import keyv from "keyv";
import sharp from "sharp";
import mimeType from "mime-types";

const cache = new keyv();
const dataDir = path.join(process.cwd(), "/assets/data");
const imageDir = path.join(process.cwd(), "/assets/images");

function pathSafety(base, ...parts) {
  const resolveBase = path.resolve(base);
  const p = path.resolve(resolveBase, ...parts);

  if (p === resolveBase || p.startsWith(resolveBase + path.sep)) {
    return p;
  }
  throw new Error("Path traversal");
}

export async function containsFolders(p) {
  const fullPath = pathSafety(dataDir, p);
  if (!existsSync(fullPath)) return false;
  const folder = await fs.readdir(fullPath, {
    withFileTypes: true,
  });
  return folder.some((f) => f.isDirectory());
}

export async function getTypes() {
  const found = await cache.get("types");
  if (found) {
    return found;
  }
  const types = await fs.readdir(dataDir);
  const typesLower = types.map((t) => t.toLowerCase());

  await cache.set("types", typesLower);
  console.log("Cached types");

  return typesLower;
}

export async function getAvailableEntities(type) {
  const cacheId = ("data-" + type).toLowerCase();
  const found = await cache.get(cacheId);
  if (found) return found;

  const dirPath = pathSafety(dataDir, type);
  if (!existsSync(dirPath)) return [];

  const entities = await fs.readdir(dirPath);
  const entitiesLower = entities.map((e) => e.toLowerCase());

  await cache.set(cacheId, entitiesLower);
  return entitiesLower;
}

export async function getAvailableImages(type, id) {
  const cacheId = ("image-" + type + "-" + id).toLowerCase();
  const found = await cache.get(cacheId);
  if (found) return found;

  const filePath = pathSafety(imageDir, type, id);
  if (!existsSync(filePath)) return [];

  const images = await fs.readdir(filePath);
  const imagesLower = images.map((f) => f.toLowerCase());

  await cache.set(cacheId, imagesLower);
  return imagesLower;
}

export async function getImage(type, id, image) {
  try {
    const filePath = pathSafety(imageDir, type, id, image);

    if (!existsSync(filePath)) {
      return null;
    }

    const buffer = await sharp(filePath).toBuffer();
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
  if (found) return found;

  const typeDir = pathSafety(dataDir, type);
  if (!existsSync(typeDir)) return null;

  const folders = await fs.readdir(typeDir);
  const actualFolder = folders.find(
    (f) => f.toLowerCase() === id.toLowerCase()
  );
  if (!actualFolder) return null;

  const filePath = pathSafety(
    dataDir,
    type,
    actualFolder,
    actualFolder + ".json"
  );

  //const filePath = pathSafety(dataDir, type, id, id + ".json");

  if (!existsSync(filePath)) {
    return null;
  }

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
