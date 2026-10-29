export const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);

// must match dish_id() in py/common.py
export const dishIdFor = (placeId, name) => `${placeId}__${slugify(name)}`;
