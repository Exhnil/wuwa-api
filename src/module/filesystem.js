import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dataDir = path.join(process.cwd(), "/assets/data");

function exist(p) {
  return fs.existsSync(p);
}

export async function getTypes() {
  const types = await fs.readdirSync(dataDir);
  return types;
}
