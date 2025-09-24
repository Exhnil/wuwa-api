import { Router } from "express";
import { getTypes } from "../module/filesystem.js";

const router = Router();

router.get("/", async (req, res) => {
  res.json({ types: await getTypes() });
});

export default router;
