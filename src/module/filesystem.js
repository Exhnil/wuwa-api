import { promises as fs, existsSync } from "fs";
import path from "path";
import keyv from "keyv";
import sharp from "sharp";
import mimeType from "mime-types";

const cache = new keyv();
const dataDir = path.join(process.cwd(), "/assets/data");
const imageDir = path.join(process.cwd(), "/assets/images");

export async function containsFolders(p) {
  const folder = await fs.readdir(path.join(dataDir, p), {
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

  await cache.set("types", types);
  console.log("Cached types");

  return types;
}

export async function getAvailableEntities(type) {
  const cacheId = ("data-" + type).toLowerCase();
  const found = await cache.get(cacheId);
  if (found) return found;

  const dirPath = path.join(dataDir, type);
  if (!existsSync(dirPath)) return [];

  const entities = await fs.readdir(dirPath);

  await cache.set(cacheId, entities);
  return entities;
}

export async function getAvailableImages(type, id) {
  const cacheId = ("image-" + type + "-" + id).toLowerCase();
  const found = await cache.get(cacheId);
  if (found) return found;

  const filePath = path.join(imageDir, type, id).normalize();
  if (!existsSync(filePath)) return [];

  const images = await fs.readdir(filePath);
  await cache.set(cacheId, images);
  return images;
}

export async function getImage(type, id, image) {
  try {
    const filePath = path.join(imageDir, type, id, image).normalize();

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

  const filePath = path.join(dataDir, type, id, id + ".json").normalize();

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
