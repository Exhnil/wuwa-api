import { Router } from "express";
import {
  getTypes,
  containsFolders,
  getAvailableEntities,
  getEntity,
} from "../module/filesystem.js";

const router = Router();

router.get("/", async (req, res) => {
  res.json({ types: await getTypes() });
});

router.get("/:type{/:id}", async (req, res) => {
  const { type, id } = req.params;

  const fullPath = id ? type + "/" + id : type;

  if (await containsFolders(fullPath)) {
    const entities = await getAvailableEntities(fullPath);
    res.json(entities);
  } else {
    const entity = await getEntity(type, id);
    res.json(entity);
  }
});

export default router;
