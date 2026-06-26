import { cardLayoutFlush, escapeAttr, escapeHtml } from "../utils/dom.js";
import { getMediaType, getProjectMedia, mediaElementTemplate, normalizeMediaItem } from "../utils/media.js";
import { observeReveal } from "./reveal.js";

const DETAIL_HASH_PREFIX = "#work/";
const visualAnimations = new WeakMap();

function slugify(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanGoal(goal = "") {
  return String(goal).replace(/^goal:\s*/i, "");
}

function getProjectCategories(project) {
  return project.categories || [project.category].filter(Boolean);
}

function projectSectionTemplate(title, body) {
  if (!body) return "";
  return `
    <section class="project-detail-section">
      <h2 class="text-ui">${escapeHtml(title)}</h2>
      <p class="text-body text-muted">${escapeHtml(body)}</p>
    </section>
  `;
}

function projectMetaTemplate(label, value) {
  if (!value) return "";
  return `
    <div>
      <dt class="text-ui text-muted">${escapeHtml(label)}</dt>
      <dd class="text-body">${escapeHtml(value)}</dd>
    </div>
  `;
}

function visualTemplate(media, index, project) {
  const item = normalizeMediaItem(media, project.title);
  const source = item.src;
  const alt = item.alt || project.title;

  return `
    <figure class="project-visual project-visual-${index + 1}" style="--appear-delay:${120 + index * 90}ms">
      <button class="project-visual-zoom" type="button" data-visual-zoom="${escapeAttr(source)}" data-visual-type="${escapeAttr(item.type)}" data-visual-alt="${escapeAttr(alt)}"${item.poster ? ` data-visual-poster="${escapeAttr(item.poster)}"` : ""} aria-label="Expand ${escapeAttr(alt)}">
        ${mediaElementTemplate(item)}
      </button>
    </figure>
  `;
}

function bindVisualZoomButtons(showcase) {
  showcase.querySelectorAll("[data-visual-zoom]").forEach((button) => {
    button.addEventListener("click", () => {
      openVisualLightbox({
        source: button.dataset.visualZoom,
        type: button.dataset.visualType,
        alt: button.dataset.visualAlt,
        poster: button.dataset.visualPoster
      });
    });
  });
}

function openVisualLightbox({ source, type = "image", alt = "", poster = "" }) {
  const lightbox = document.getElementById("visualLightbox");
  const image = document.getElementById("visualLightboxImage");
  const video = document.getElementById("visualLightboxVideo");
  if (!lightbox || !image || !video || !source) return;

  const mediaType = type || getMediaType(source);
  image.hidden = mediaType === "video";
  video.hidden = mediaType !== "video";

  if (mediaType === "video") {
    video.src = source;
    video.poster = poster || "";
    video.setAttribute("aria-label", alt || "");
    image.removeAttribute("src");
    image.alt = "";
  } else {
    image.src = source;
    image.alt = alt || "";
    video.pause();
    video.removeAttribute("src");
    video.removeAttribute("poster");
  }

  lightbox.hidden = false;
  lightbox.classList.add("is-open");
}

function closeVisualLightbox() {
  const lightbox = document.getElementById("visualLightbox");
  const image = document.getElementById("visualLightboxImage");
  const video = document.getElementById("visualLightboxVideo");
  if (!lightbox || lightbox.hidden) return;

  lightbox.classList.remove("is-open");
  lightbox.hidden = true;
  if (image) {
    image.removeAttribute("src");
    image.alt = "";
  }
  if (video) {
    video.pause();
    video.removeAttribute("src");
    video.removeAttribute("poster");
    video.hidden = true;
  }
}

export function getProjectSlug(project, index = 0) {
  return project.slug || slugify(project.title) || `project-${index + 1}`;
}

export function getProjectIndexFromHash(projects = []) {
  const hash = decodeURIComponent(window.location.hash || "");
  if (!hash.startsWith(DETAIL_HASH_PREFIX)) return -1;
  const activeSlug = hash.slice(DETAIL_HASH_PREFIX.length);
  return projects.findIndex((project, index) => getProjectSlug(project, index) === activeSlug);
}

export function setProjectRoute(project, index) {
  const nextHash = `${DETAIL_HASH_PREFIX}${encodeURIComponent(getProjectSlug(project, index))}`;
  if (window.location.hash === nextHash) return false;
  window.location.hash = nextHash;
  return true;
}

export function renderProjectDetail({
  project,
  projects,
  index,
  view = "single",
  panel = document.getElementById("projectDetailPanel"),
  showcase = document.getElementById("projectShowcase")
}) {
  const media = getProjectMedia(project, projects);
  const categories = getProjectCategories(project).join(", ");
  const role = project.role || project.meta;
  const year = project.date || project.meta;
  const summary = project.summary || "";
  const goal = cleanGoal(project.goal);

  panel.hidden = false;
  showcase.hidden = false;
  showcase.className = `project-showcase view-${view}`;

  panel.innerHTML = `
    <div class="project-detail-header">
      <a class="btn btn-small secondary project-back" href="#top" data-project-back aria-label="Back to work">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 6l-6 6 6 6"></path>
        </svg>
      </a>
      <div class="project-detail-copy">
        <h1>${escapeHtml(project.title)}</h1>
        <p class="text-heading">${escapeHtml(summary || project.description)}</p>
        <p class="project-detail-date text-ui text-muted">${escapeHtml(year)}</p>
      </div>
    </div>
    <dl class="project-detail-meta">
      ${projectMetaTemplate("Role", role)}
      ${projectMetaTemplate("Category", categories)}
      ${projectMetaTemplate("Scope", summary)}
    </dl>
    ${projectSectionTemplate("Overview", project.description)}
    ${projectSectionTemplate("Goal", goal)}
  `;

  showcase.innerHTML = `
    ${media.map((item, mediaIndex) => visualTemplate(item, mediaIndex, project)).join("")}
  `;

  observeReveal(showcase.querySelectorAll(".project-visual"));
  bindVisualZoomButtons(showcase);
}

export function animateProjectVisualViewChange({ view, target = document.getElementById("projectShowcase") }) {
  if (!target) return;
  const visuals = [...target.querySelectorAll(".project-visual")];

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !visuals.length) {
    target.className = `project-showcase view-${view}`;
    return;
  }

  const previousRects = new Map(visuals.map((visual) => [visual, visual.getBoundingClientRect()]));
  visuals.forEach((visual) => visualAnimations.get(visual)?.cancel());

  target.className = `project-showcase view-${view} is-flipping`;
  cardLayoutFlush(target);

  const nextRects = new Map(visuals.map((visual) => [visual, visual.getBoundingClientRect()]));

  visuals.forEach((visual) => {
    const previous = previousRects.get(visual);
    const next = nextRects.get(visual);
    if (!previous || !next) return;

    const deltaX = previous.left - next.left;
    const deltaY = previous.top - next.top;
    const scaleX = previous.width / Math.max(next.width, 1);
    const scaleY = previous.height / Math.max(next.height, 1);

    if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5 && Math.abs(scaleX - 1) < 0.005 && Math.abs(scaleY - 1) < 0.005) {
      return;
    }

    const animation = visual.animate([
      {
        transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`,
        filter: "blur(.2px)"
      },
      {
        transform: "translate3d(0, 0, 0) scale(1)",
        filter: "blur(0)"
      }
    ], {
      duration: 420,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "both"
    });

    visualAnimations.set(visual, animation);
    animation.addEventListener("finish", () => {
      if (visualAnimations.get(visual) === animation) {
        animation.cancel();
        visualAnimations.delete(visual);
      }
    });
  });

  window.setTimeout(() => {
    target.classList.remove("is-flipping");
  }, 440);
}

export function clearProjectDetail({
  panel = document.getElementById("projectDetailPanel"),
  showcase = document.getElementById("projectShowcase")
} = {}) {
  if (panel) {
    panel.hidden = true;
    panel.innerHTML = "";
  }

  if (showcase) {
    showcase.hidden = true;
    showcase.innerHTML = "";
  }
}

export function bindProjectDetail({ onBack }) {
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-project-back]");
    if (trigger) {
      event.preventDefault();
      onBack?.();
      return;
    }

    if (event.target.closest("[data-visual-lightbox-close]")) {
      closeVisualLightbox();
      return;
    }

    const lightbox = event.target.closest("#visualLightbox");
    if (lightbox && event.target === lightbox) {
      closeVisualLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeVisualLightbox();
    }
  });
}
