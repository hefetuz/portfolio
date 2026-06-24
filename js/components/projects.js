import { cardLayoutFlush, escapeAttr, escapeHtml } from "../utils/dom.js";
import { observeReveal } from "./reveal.js";

const resizeAnimations = new WeakMap();

function projectCardTemplate(project, visibleIndex, sourceIndex) {
  const scope = project.scope || project.summary || project.description;
  const date = project.date || project.meta;

  return `
    <article class="project-card t-resize bento-${(visibleIndex % 8) + 1}" tabindex="0" role="button" data-project-index="${sourceIndex}" style="--appear-delay:${80 + visibleIndex * 90}ms">
      <img src="${escapeAttr(project.image)}" alt="${escapeAttr(project.title)}">
      <div class="project-info">
        <div class="project-line">
          <h2 class="project-name text-card-title">${escapeHtml(project.title)}</h2>
          <small class="project-date text-ui text-muted">${escapeHtml(date)}</small>
        </div>
        <div class="project-line">
          <p class="project-scope text-body text-muted">${escapeHtml(scope)}</p>
        </div>
      </div>
    </article>
  `;
}

export function getProjectsByCategory(projects, category) {
  if (category === "all") {
    return projects.map((project, index) => ({ project, index }));
  }

  return projects
    .map((project, index) => ({ project, index }))
    .filter(({ project }) => {
      const categories = project.categories || [project.category];
      return categories.includes(category);
    });
}

export function renderProjects({ projects, filter, view, target = document.getElementById("work") }) {
  const filtered = getProjectsByCategory(projects, filter);
  target.className = `project-grid view-${view}`;
  target.innerHTML = filtered.map(({ project, index }, visibleIndex) => (
    projectCardTemplate(project, visibleIndex, index)
  )).join("");
  observeReveal(target.querySelectorAll(".project-card"));
}

export function animateProjectViewChange({ view, target = document.getElementById("work") }) {
  const cards = [...target.querySelectorAll(".project-card")];

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !cards.length) {
    target.className = `project-grid view-${view}`;
    return;
  }

  const previousRects = new Map(cards.map((card) => [card, card.getBoundingClientRect()]));
  cards.forEach((card) => resizeAnimations.get(card)?.cancel());

  target.className = `project-grid view-${view} is-flipping`;
  cardLayoutFlush(target);

  const nextRects = new Map(cards.map((card) => [card, card.getBoundingClientRect()]));

  cards.forEach((card) => {
    const previous = previousRects.get(card);
    const next = nextRects.get(card);
    if (!previous || !next) return;

    const deltaX = previous.left - next.left;
    const deltaY = previous.top - next.top;
    const scaleX = previous.width / Math.max(next.width, 1);
    const scaleY = previous.height / Math.max(next.height, 1);

    if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5 && Math.abs(scaleX - 1) < 0.005 && Math.abs(scaleY - 1) < 0.005) {
      return;
    }

    const animation = card.animate([
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

    resizeAnimations.set(card, animation);
    animation.addEventListener("finish", () => {
      if (resizeAnimations.get(card) === animation) {
        animation.cancel();
        resizeAnimations.delete(card);
      }
    });
  });

  window.setTimeout(() => {
    target.classList.remove("is-flipping");
  }, 440);
}

export function bindProjectGrid({ target = document.getElementById("work"), getProject, onOpen }) {
  target.addEventListener("click", (event) => {
    const card = event.target.closest(".project-card");
    if (!card) return;
    const projectIndex = Number(card.dataset.projectIndex);
    onOpen(getProject(projectIndex), projectIndex);
  });

  target.addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key)) return;
    const card = event.target.closest(".project-card");
    if (!card) return;
    event.preventDefault();
    const projectIndex = Number(card.dataset.projectIndex);
    onOpen(getProject(projectIndex), projectIndex);
  });
}
