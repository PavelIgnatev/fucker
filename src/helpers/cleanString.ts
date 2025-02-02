export const cleanString = (id: string) => {
  return id.trim().replace(/['"`]/g, "").replace(/\s+/g, "");
};
