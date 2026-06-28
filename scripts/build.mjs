import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const contentPath = join(root, "cms", "content.json");
const sourceIndexPath = join(root, "index.html");

const content = JSON.parse(await readFile(contentPath, "utf8"));
const sourceIndex = await readFile(sourceIndexPath, "utf8");

const siteUrl = normalizeSiteUrl(process.env.SITE_URL || content.site.siteUrl || "https://hefetuz.github.io/portfolio");
const basePath = normalizeBasePath(process.env.BASE_PATH || new URL(siteUrl).pathname);

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await Promise.all([
  cp(join(root, "assets"), join(dist, "assets"), { recursive: true }),
  cp(join(root, "cms"), join(dist, "cms"), { recursive: true }),
  cp(join(root, "js"), join(dist, "js"), { recursive: true }),
  cp(join(root, "styles.css"), join(dist, "styles.css")),
  cp(join(root, "cms.html"), join(dist, "cms.html")),
  cp(join(root, ".nojekyll"), join(dist, ".nojekyll"))
]);

const homeUrl = siteUrl;
const homeImage = absoluteUrl(content.projects?.[0]?.image || content.site.avatar || "assets/efe-avatar.svg");

await writeFile(join(dist, "index.html"), renderPage({
  title: content.site.title,
  description: content.site.description,
  canonicalUrl: homeUrl,
  imageUrl: homeImage,
  structuredData: personSchema()
}), "utf8");

await writeFile(join(dist, "404.html"), renderPage({
  title: content.site.title,
  description: content.site.description,
  canonicalUrl: homeUrl,
  imageUrl: homeImage,
  structuredData: personSchema()
}), "utf8");

for (const [index, project] of content.projects.entries()) {
  const slug = getProjectSlug(project, index);
  const pageUrl = absoluteUrl(`work/${slug}/`);
  const pageTitle = `${project.title} | ${content.site.brandName}`;
  const pageDescription = project.description || project.summary || content.site.description;
  const pageImage = absoluteUrl(project.image || project.cover || project.media?.[0]?.poster || project.media?.[0]?.src || content.projects?.[0]?.image || "assets/efe-avatar.svg");
  const pageDirectory = join(dist, "work", slug);

  await mkdir(pageDirectory, { recursive: true });
  await writeFile(join(pageDirectory, "index.html"), renderPage({
    title: pageTitle,
    description: pageDescription,
    canonicalUrl: pageUrl,
    imageUrl: pageImage,
    structuredData: projectSchema(project, pageUrl, pageImage, index)
  }), "utf8");
}

await writeFile(join(dist, "robots.txt"), [
  "User-agent: *",
  "Allow: /",
  `Sitemap: ${absoluteUrl("sitemap.xml")}`,
  ""
].join("\n"), "utf8");

await writeFile(join(dist, "sitemap.xml"), renderSitemap(), "utf8");
await writeFile(join(dist, "site.webmanifest"), renderManifest(), "utf8");

console.log(`Built ${content.projects.length + 1} pages into dist/`);

function renderPage({ title, description, canonicalUrl, imageUrl, structuredData }) {
  const seoBlock = [
    `  <base href="${escapeAttr(basePath)}">`,
    `  <meta name="description" content="${escapeAttr(description)}">`,
    `  <meta name="theme-color" content="#050505">`,
    `  <link rel="canonical" href="${escapeAttr(canonicalUrl)}">`,
    `  <link rel="manifest" href="site.webmanifest">`,
    `  <meta property="og:type" content="website">`,
    `  <meta property="og:site_name" content="${escapeAttr(content.site.brandName)}">`,
    `  <meta property="og:title" content="${escapeAttr(title)}">`,
    `  <meta property="og:description" content="${escapeAttr(description)}">`,
    `  <meta property="og:url" content="${escapeAttr(canonicalUrl)}">`,
    `  <meta property="og:image" content="${escapeAttr(imageUrl)}">`,
    `  <meta name="twitter:card" content="summary_large_image">`,
    `  <meta name="twitter:title" content="${escapeAttr(title)}">`,
    `  <meta name="twitter:description" content="${escapeAttr(description)}">`,
    `  <meta name="twitter:image" content="${escapeAttr(imageUrl)}">`,
    `  <script type="application/ld+json">${JSON.stringify(structuredData)}</script>`
  ].join("\n");

  return sourceIndex
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/\s*<!-- SEO_START -->[\s\S]*?<!-- SEO_END -->/, `\n${seoBlock}`);
}

function renderSitemap() {
  const urls = [
    { loc: homeUrl, priority: "1.0" },
    ...content.projects.map((project, index) => ({
      loc: absoluteUrl(`work/${getProjectSlug(project, index)}/`),
      priority: "0.8"
    }))
  ];

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls.map(({ loc, priority }) => [
      `  <url>`,
      `    <loc>${escapeXml(loc)}</loc>`,
      `    <priority>${priority}</priority>`,
      `  </url>`
    ].join("\n")),
    `</urlset>`,
    ``
  ].join("\n");
}

function renderManifest() {
  return `${JSON.stringify({
    name: content.site.title,
    short_name: content.site.brandName,
    description: content.site.description,
    start_url: basePath,
    scope: basePath,
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505",
    icons: [
      {
        src: "assets/efe-avatar.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  }, null, 2)}\n`;
}

function personSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: content.site.brandName,
    jobTitle: content.site.role,
    email: content.site.email,
    url: homeUrl,
    image: absoluteUrl(content.site.avatar || "assets/efe-avatar.svg"),
    address: content.site.location,
    sameAs: [
      content.site.xUrl,
      content.site.behanceUrl,
      content.site.dribbbleUrl,
      content.site.instagramUrl
    ].filter(Boolean)
  };
}

function projectSchema(project, pageUrl, imageUrl, index) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    position: index + 1,
    url: pageUrl,
    image: imageUrl,
    description: project.description || project.summary || content.site.description,
    creator: {
      "@type": "Person",
      name: content.site.brandName,
      url: homeUrl
    },
    keywords: [
      ...(project.services || []),
      ...(project.techStack || project.stack || []),
      ...(project.industry || [])
    ].filter(Boolean).join(", ")
  };
}

function absoluteUrl(path = "") {
  return new URL(path.replace(/^\/+/, ""), ensureTrailingSlash(siteUrl)).href;
}

function normalizeSiteUrl(value) {
  return ensureTrailingSlash(value.trim());
}

function normalizeBasePath(value = "/") {
  const path = `/${String(value).replace(/^\/+|\/+$/g, "")}`;
  return path === "/" ? "/" : `${path}/`;
}

function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

function getProjectSlug(project, index = 0) {
  return project.slug || slugify(project.title) || `project-${index + 1}`;
}

function slugify(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value = "") {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function escapeXml(value = "") {
  return escapeAttr(value).replace(/'/g, "&apos;");
}
