// dish tags (set by the menu script or whoever adds the dish) -> what you're in the mood for
export const MOODS = [
  { id: 'cozy', label: 'Cozy' },
  { id: 'healthy', label: 'Fresh' },
  { id: 'spicy', label: 'Spicy' },
  { id: 'sweet', label: 'Sweet' },
  { id: 'value', label: 'Cheap & filling' },
  { id: 'protein', label: 'Protein' },
  { id: 'sick', label: 'Sick day' },
];

export const moodLabel = (id) => MOODS.find((m) => m.id === id)?.label || id;

// why you rated something the way you did
export const REASONS = [
  { id: 'flavor', label: 'Flavor' },
  { id: 'value', label: 'Worth the price' },
  { id: 'portion', label: 'Big portion' },
  { id: 'texture', label: 'Texture' },
  { id: 'fresh', label: 'Tasted fresh' },
  { id: 'quick', label: 'Quick' },
  { id: 'vibe', label: 'Good spot' },
];

export const reasonLabel = (id) => REASONS.find((r) => r.id === id)?.label || id;
