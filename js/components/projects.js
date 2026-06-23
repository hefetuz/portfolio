import { cardLayoutFlush, escapeAttr, escapeHtml } from "../utils/dom.js";
import { observeReveal } from "./reveal.js";

function projectCardTemplate(project, visibleIndex, sourceIndex) {
  return `
    <article class="project-card t-resize bento-${(visibleIndex % 8) + 1}" tabindex="0" role="button" data-project-index="${sourceIndex}" style="--appear-delay:${80 + visibleIndex * 90}ms">
      <img src="${escapeAttr(project.image)}" alt="${escapeAttr(project.title)}">
      <div class="project-info">
        <div class="project-head">
          <h2>${escapeHtml(project.title)}</h2>
          <small>${escapeHtml(project.date || project.meta)}</small>
        </div>
        <p>${escapeHtml(project.summary || project.description)}</p>
        <p>${escapeHtml(project.goal || "")}</p>
      </div>
    </article>
  `;
}

export function getProjectsByCategory(projects, category) {
  return projects
    .map((project, index) => ({ project, index }))
    .filter(({ project }) => project.category === category);
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
  cards.forEach((card) => {
    const rect = previousRects.get(card);
    card.style.width = `${rect.width}px`;
    card.style.height = `${rect.height}px`;
  });

  target.className = `project-grid view-${view}`;

  requestAnimationFrame(() => {
    cards.forEach((card) => {
      card.style.width = "";
      card.style.height = "";
    });
    const nextRects = new Map(cards.map((card) => [card, card.getBoundingClientRect()]));

    cards.forEach((card) => {
      const previous = previousRects.get(card);
      card.style.width = `${previous.width}px`;
      card.style.height = `${previous.height}px`;
    });

    cardLayoutFlush(target);

    cards.forEach((card) => {
      const next = nextRects.get(card);
      card.style.width = `${next.width}px`;
      card.style.height = `${next.height}px`;
    });

    window.setTimeout(() => {
      cards.forEach((card) => {
        card.style.width = "";
        card.style.height = "";
      });
    }, 340);
  });
}

export function bindProjectGrid({ target = document.getElementById("work"), getProject, onOpen }) {
  target.addEventListener("click", (event) => {
    const card = event.target.closest(".project-card");
    if (!card) return;
    onOpen(getProject(Number(card.dataset.projectIndex)));
  });

  target.addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key)) return;
    const card = event.target.closest(".project-card");
    if (!card) return;
    event.preventDefault();
    onOpen(getProject(Number(card.dataset.projectIndex)));
  });
}
