import { Router } from "express";
import {
  getTypes,
  getAvailableEntities,
  getEntity,
  getAvailableImages,
  getImage,
  getAsset,
} from "../module/filesystem.js";
import {
  validateImage,
  validateType,
  validateTypeAndId,
} from "../middleware/validator.js";

const router = Router();

//Various Assets
router.get("/assets/*path", async (req, res, next) => {
  try {
    const path = req.params.path.join("/");
    const asset = await getAsset(path);

    if (!asset) {
      return res.status(404).json({ error: "Not found" });
    }

    res.set("Content-Type", asset.type);
    res.send(asset.image);
  } catch (e) {
    next(e);
  }
});

// Root path
router.get("/", async (req, res, next) => {
  try {
    const types = await getTypes();

    res.json({
      types,
      endpoints: types.map((t) => ({
        type: t,
        list: `/api/${t}`,
        all: `/api/${t}/all`,
        item: `/api/${t}/:id`,
        images: `/api/${t}/:id/images`,
      })),
      count: types.length,
    });
  } catch (e) {
    next(e);
  }
});

//Get all entities ids
router.get("/:type", validateType, async (req, res, next) => {
  const { type } = req.params;

  try {
    const entities = await getAvailableEntities(type);
    res.json(entities ?? []);
  } catch (e) {
    next(e);
  }
});

//Get all entities full object
router.get("/:type/all", validateType, async (req, res, next) => {
  const { type } = req.params;

  try {
    const entities = await getAvailableEntities(type);

    if (entities.length > 200) {
      return res.status(400).json({ error: "Too many entities" });
    }
    const data = await Promise.all(entities.map((id) => getEntity(type, id)));
    res.json(data);
  } catch (e) {
    console.error(`Error getting all entities for type ${type}:`, e);
    next(e);
  }
});

//Get Single Entity
router.get("/:type/:id", validateTypeAndId, async (req, res, next) => {
  const { type, id } = req.params;

  try {
    const entity = await getEntity(type, id);
    if (!entity) {
      return res.status(404).json({ error: "Entity not found" });
    }

    res.json(entity);
  } catch (e) {
    next(e);
  }
});

//Get list of images
router.get("/:type/:id/images", validateTypeAndId, async (req, res, next) => {
  const { type, id } = req.params;

  try {
    const images = await getAvailableImages(type, id);
    res.json(images ?? []);
  } catch (e) {
    next(e);
  }
});

//Get single Image
router.get(
  "/:type/:id/images/:imageType",
  validateImage,
  async (req, res, next) => {
    const { type, id, imageType } = req.params;

    try {
      const image = await getImage(type, id, imageType);

      if (!image) return res.status(404).json({ error: "Image not found" });

      res.set("Content-Type", image.type);
      res.send(image.image);
    } catch (e) {
      console.error("Error fetching image " + type);
      next(e);
    }
  },
);

export default router;
