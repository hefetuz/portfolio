import { loadContent } from "./cms/content.js";
import { bindAvatar } from "./components/avatar.js";
import {
  animateProjectVisualViewChange,
  bindProjectDetail,
  clearProjectDetail,
  getProjectIndexFromHash,
  renderProjectDetail,
  setProjectRoute
} from "./components/project-detail.js";
import { animateProjectViewChange, bindProjectGrid, renderProjects } from "./components/projects.js";
import { startAppearAnimations } from "./components/reveal.js";
import { renderServices } from "./components/services.js";
import { bindLanguageMenu, updateClock, wireLinks } from "./components/site-shell.js";
import { bindAdaptiveTooltips, bindTabs, renderCategoryTabs, renderViewTabs, updateAllTabIndicators } from "./components/tabs.js";
import { setTextBindings, splitIntroWords, syncButtonLabels } from "./components/text-bindings.js";
import { escapeHtml } from "./utils/dom.js";

const state = {
  content: null,
  filter: "product",
  view: "bento",
  detailView: "single",
  activeProjectIndex: -1
};

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

function renderCurrentProjects() {
  renderProjects({
    projects: state.content.projects,
    filter: state.filter,
    view: state.view
  });
}

function setViewMode(view) {
  if (state.view === view) return;
  state.view = view;
  animateProjectViewChange({ view: state.view });
}

function renderActiveProjectDetail() {
  const project = state.content?.projects?.[state.activeProjectIndex];
  if (!project) return;

  renderProjectDetail({
    project,
    projects: state.content.projects,
    index: state.activeProjectIndex,
    view: state.detailView
  });
}

function setDetailViewMode(view) {
  if (state.detailView === view) return;
  state.detailView = view;
  animateProjectVisualViewChange({ view: state.detailView });
}

function setProjectDetail(index) {
  const project = state.content?.projects?.[index];
  if (!project) return;

  state.activeProjectIndex = index;
  document.querySelector(".app-shell")?.classList.add("is-project-detail");
  document.getElementById("projectVisualToolbar").hidden = false;
  renderActiveProjectDetail();
  document.title = `${project.title} | ${state.content.site.brandName}`;
  requestAnimationFrame(updateAllTabIndicators);
  window.scrollTo({ top: 0, behavior: "auto" });
}

function clearProjectRoute() {
  if (window.location.hash === "#top") {
    handleRoute();
    return;
  }
  window.location.hash = "top";
}

function clearProjectView() {
  state.activeProjectIndex = -1;
  document.querySelector(".app-shell")?.classList.remove("is-project-detail");
  const visualToolbar = document.getElementById("projectVisualToolbar");
  if (visualToolbar) {
    visualToolbar.hidden = true;
  }
  clearProjectDetail();

  if (state.content) {
    document.title = state.content.site.title;
  }

  window.scrollTo({ top: 0, behavior: "auto" });
  requestAnimationFrame(updateAllTabIndicators);
}

function handleRoute() {
  if (!state.content) return;

  const projectIndex = getProjectIndexFromHash(state.content.projects);
  if (projectIndex >= 0) {
    setProjectDetail(projectIndex);
    return;
  }

  clearProjectView();
}

function bindInteractions() {
  bindAdaptiveTooltips();

  bindTabs(".filter-tabs", (button) => {
    state.filter = button.dataset.filter;
    renderCurrentProjects();
  });

  bindTabs(".view-tabs", (button) => {
    setViewMode(button.dataset.view);
  });

  bindTabs(".detail-view-tabs", (button) => {
    setDetailViewMode(button.dataset.view);
  });

  bindProjectGrid({
    getProject: (index) => state.content.projects[index],
    onOpen: (project, index) => {
      if (!project) return;
      if (!setProjectRoute(project, index)) {
        handleRoute();
      }
    }
  });

  bindProjectDetail({
    onBack: clearProjectRoute
  });
  bindLanguageMenu();
  window.addEventListener("hashchange", handleRoute);
  window.addEventListener("resize", updateAllTabIndicators);
  window.addEventListener("load", updateAllTabIndicators);
}

function revealWorkToolbar() {
  const toolbar = document.querySelector(".work-toolbar");
  if (!toolbar) return;

  updateAllTabIndicators();
  requestAnimationFrame(() => {
    toolbar.classList.add("is-ready");
  });
}

function hydrateSite(content) {
  state.content = content;
  state.filter = content.projectCategories?.[0]?.id ?? state.filter;
  state.view = content.projectViewModes?.[0]?.id ?? state.view;
  state.detailView = state.view;
  document.title = content.site.title;
  document.querySelector("meta[name='description']").content = content.site.description;

  setTextBindings(content);
  splitIntroWords(content);
  renderCategoryTabs(content.projectCategories, state.filter);
  renderViewTabs(content.projectViewModes, state.view);
  renderViewTabs(content.projectViewModes, state.detailView, document.querySelector(".detail-view-tabs"));
  renderServices(content.services);
  renderCurrentProjects();
  wireLinks(content);
  bindAvatar(content.site.avatar);
  syncButtonLabels();

  updateAllTabIndicators();
  (document.fonts?.ready ?? Promise.resolve()).then(revealWorkToolbar);
  startAppearAnimations();
  handleRoute();
  updateClock();
  window.setInterval(updateClock, 1000);
}

bindInteractions();

loadContent()
  .then(hydrateSite)
  .catch((error) => {
    document.body.insertAdjacentHTML("afterbegin", `<p style="padding:24px;color:#ff8d8d">${escapeHtml(error.message)}</p>`);
  });
