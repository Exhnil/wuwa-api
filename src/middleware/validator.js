export const isValidSlug = (v) => /^[a-z0-9-]+$/.test(v);

export const validateType = (req, res, next) => {
  const { type } = req.params;

  if (!isValidSlug(type)) {
    return res.status(400).json({ error: "Invalid type" });
  }

  next();
};

export const validateTypeAndId = (req, res, next) => {
  const { type, id } = req.params;

  if (!isValidSlug(type) || !isValidSlug(id)) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  next();
};

export const validateImage = (req, res, next) => {
  const { type, id, imageType } = req.params;

  if (!isValidSlug(type) || !isValidSlug(id) || !isValidSlug(imageType)) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  next();
};
