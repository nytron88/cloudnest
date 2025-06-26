export function slugify(text: string, separator: string = "_"): string {
  let slug = String(text).trim();

  slug = slug.replace(/\s+/g, separator);
  slug = slug.replace(/[^a-zA-Z0-9_.-]/g, "");

  slug = slug.replace(new RegExp(`^${separator}+|${separator}+$`, "g"), "");

  slug = slug.replace(new RegExp(`${separator}{2,}`, "g"), separator);

  return slug;
}
