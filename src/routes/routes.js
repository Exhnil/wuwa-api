import { Router } from "express";
import {
  getTypes,
  containsFolders,
  getAvailableEntities,
  getEntity,
  getAvailableImages,
  getImage,
} from "../module/filesystem.js";
import mime from "mime-types";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const types = await getTypes();
    res.json({ types });
  } catch (e) {
    console.error("Error getting types:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:type/:id/list", async (req, res) => {
  const { type, id } = req.params;

  try {
    const images = await getAvailableImages(type, id);
    if (!images || images.length === 0)
      return res.status(404).json({ error: "No images found" });
    res.json(images);
  } catch (e) {
    console.error(`Error getting images for ${type}/${id}:`, e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:type/all", async (req, res) => {
  const { type } = req.params;

  try {
    const entities = await getAvailableEntities(type);
    if (!entities || entities.length === 0) return res.json([]);

    const entityObjects = await Promise.all(
      entities.map(async (id) => await getEntity(type, id))
    );
    res.json(entityObjects);
  } catch (e) {
    console.error(`Error getting all entities for type ${type}:`, e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:type{/:id}", async (req, res) => {
  const { type, id } = req.params;

  try {
    const fullPath = id ? `${type}/${id}` : type;

    if (await containsFolders(fullPath)) {
      const entities = await getAvailableEntities(fullPath);
      res.json(entities || []);
    } else if (id) {
      const entity = await getEntity(type, id);
      if (!entity) return res.status(404).json({ error: "Entity not found" });
      res.json(entity);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  } catch (e) {
    console.error(`Error fetching entity for`, e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:type/:id/:imageType", async (req, res) => {
  const { type, id, imageType } = req.params;

  try {
    const image = await getImage(type, id, imageType);
    if (!image) return res.status(404).json({ error: "Image not found" });

    const mimeType = mime.lookup(imageType) || "application/octet-stream";
    res.writeHead(200, {
      "Conten-Type": mimeType,
      "Content-Length": image.image.length,
    });
    res.end(image.image);
  } catch (e) {
    console.error("Error fetching image " + type);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
