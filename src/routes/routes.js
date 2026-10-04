import { Router } from "express";
import {
  getTypes,
  getAvailableEntities,
  getEntity,
  getAvailableImages,
  getImage,
  getAsset,
  getMisc,
} from "../module/filesystem.js";
import {
  validateImage,
  validateType,
  validateTypeAndId,
} from "../middleware/validator.js";

const router = Router();

//Various Assets
router.get("/assets/{*path}", async (req, res) => {
  const assetPath = req.params.path.join("/");
  const asset = await getAsset(assetPath);

  if (!asset) {
    return res.status(404).json({ error: "Not found" });
  }

  res.set("Content-Type", asset.type);
  res.send(asset.image);
});

// Root path
router.get("/", async (req, res) => {
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
});

//Get misc data
router.get("/misc", async (req, res) => {
  const misc = await getMisc();

  if (!misc) {
    return res.status(404).json({ error: "Misc data not found" })
  }

  res.json(misc)
})

//Get all entities ids
router.get("/:type", validateType, async (req, res) => {
  const { type } = req.params;

  const entities = await getAvailableEntities(type);

  if (!entities) {
    return res.status(404).json({ error: "Type not found" })
  }

  res.json(entities)

});

//Get all entities full object
router.get("/:type/all", validateType, async (req, res) => {
  const { type } = req.params;

  const entities = await getAvailableEntities(type);

  if (!entities) {
    return res.status(404).json({ error: "Type not found" })
  }
  const data = await Promise.all(
    entities.map(async (id) => {
      const entity = await getEntity(type, id);
      if (!entity) {
        throw new Error(`Entity data missing: ${type}/${id}`)
      }
      return entity
    }),
  )
  res.json(data);
});

//Get Single Entity
router.get("/:type/:id", validateTypeAndId, async (req, res) => {
  const { type, id } = req.params;

  const entity = await getEntity(type, id);
  if (!entity) {
    return res.status(404).json({ error: "Entity not found" });
  }

  res.json(entity);
});

//Get list of images
router.get("/:type/:id/images", validateTypeAndId, async (req, res) => {
  const { type, id } = req.params;

  const images = await getAvailableImages(type, id);

  if (!images) {
    return res.status(404).json({ error: "Images not found" })
  }
  res.json(images);
});

//Get single Image
router.get(
  "/:type/:id/images/:imageType",
  validateImage,
  async (req, res) => {
    const { type, id, imageType } = req.params;

    const image = await getImage(type, id, imageType);

    if (!image) return res.status(404).json({ error: "Image not found" });

    res.set("Content-Type", image.type);
    res.send(image.image);
  },
);

export default router;
