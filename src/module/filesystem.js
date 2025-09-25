import { promises as fs, existsSync } from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "/assets/data");

export async function containsFolders(path) {
  const folder = await fs.readdir("assets/data/" + path, {
    withFileTypes: true,
  });
  console.log("assets/data/" + path);
  console.log(folder[0].isDirectory());
  return folder[0].isDirectory();
}

export async function getTypes() {
  const types = await fs.readdir(dataDir);
  return types;
}

export async function getAvailableEntities(type) {
  const entities = await fs.readdir(path.join(dataDir, type));
  console.log(entities);
  return entities;
}

export async function getEntity(type, id) {
  const filePath = path.join(dataDir, type, id, id + ".json").normalize();

  const exists = existsSync(filePath);

  if (!exists) {
    return "404 not found";
  }

  const file = await fs.readFile(filePath);
  const entity = JSON.parse(file.toString('utf-8'))
  return entity
}

export async function getImage() {}
