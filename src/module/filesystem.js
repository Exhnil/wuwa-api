import { promises as fs, existsSync } from "fs";
import path from "path";
import keyv from "keyv";

const cache = new keyv();
const dataDir = path.join(process.cwd(), "/assets/data");

export async function containsFolders(path) {
  const folder = await fs.readdir("assets/data/" + path, {
    withFileTypes: true,
  });
  return folder[0].isDirectory();
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
  const found = await cache.get(("data-" + type).toLowerCase());
  if (found) {
    return found;
  }
  await cache.set(("data-" + type).toLowerCase());
  console.log("Cached " + type);
  const entities = await fs.readdir(path.join(dataDir, type));
  return entities;
}

export async function getEntity(type, id) {
  const cacheId = ("data-" + type + "-" + id).toLowerCase();
  const found = await cache.get(cacheId);
  if (found) {
    return found;
  }
  const filePath = path.join(dataDir, type, id, id + ".json").normalize();

  const exists = existsSync(filePath);

  if (!exists) {
    return "404 not found";
  }

  const file = await fs.readFile(filePath);
  const entity = JSON.parse(file.toString("utf-8"));
  await cache.set(cacheId, entity);
  console.log("Cached " + entity);
  return entity;
}

export async function getImage() {}
