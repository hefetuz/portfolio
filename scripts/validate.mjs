import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const content = JSON.parse(await readFile(join(root, "cms", "content.json"), "utf8"));
const errors = [];
const warnings = [];

validateSite();
await validateProjects();

if (warnings.length) {
  warnings.forEach((warning) => console.warn(`Warning: ${warning}`));
}

if (errors.length) {
  errors.forEach((error) => console.error(`Error: ${error}`));
  process.exitCode = 1;
} else {
  console.log("Validation passed");
}

function validateSite() {
  required(content.site?.title, "site.title");
  required(content.site?.description, "site.description");
  required(content.site?.brandName, "site.brandName");
  required(content.site?.email, "site.email");

  if (content.site?.siteUrl && !/^https:\/\//i.test(content.site.siteUrl)) {
    errors.push("site.siteUrl must use HTTPS for production.");
  }

  [
    ["site.xUrl", content.site?.xUrl],
    ["site.behanceUrl", content.site?.behanceUrl],
    ["site.dribbbleUrl", content.site?.dribbbleUrl],
    ["site.instagramUrl", content.site?.instagramUrl]
  ].forEach(([label, url]) => {
    if (url && !/^https:\/\//i.test(url)) {
      errors.push(`${label} must use HTTPS.`);
    }
  });
}

async function validateProjects() {
  if (!Array.isArray(content.projects) || !content.projects.length) {
    errors.push("content.projects must include at least one project.");
    return;
  }

  const slugs = new Set();
  for (const [index, project] of content.projects.entries()) {
    const label = project.slug || project.title || `project[${index}]`;
    required(project.title, `${label}.title`);
    required(project.slug, `${label}.slug`);
    required(project.description, `${label}.description`);
    required(project.summary, `${label}.summary`);

    if (slugs.has(project.slug)) {
      errors.push(`Duplicate project slug: ${project.slug}`);
    }
    slugs.add(project.slug);

    const media = Array.isArray(project.media) ? project.media : [];
    if (!media.length && !project.image) {
      warnings.push(`${label} has no project media.`);
    }

    const mediaSources = [
      project.image,
      project.cover,
      ...media.flatMap((item) => [item?.src, item?.poster])
    ].filter(Boolean);

    for (const source of mediaSources) {
      await validateAsset(source, label);
    }
  }
}

async function validateAsset(source, label) {
  if (/^https?:\/\//i.test(source)) {
    if (!/^https:\/\//i.test(source)) errors.push(`${label} uses non-HTTPS media: ${source}`);
    return;
  }

  try {
    await access(join(root, source));
  } catch {
    errors.push(`${label} references missing media: ${source}`);
  }
}

function required(value, label) {
  if (!String(value || "").trim()) {
    errors.push(`Missing ${label}`);
  }
}
