import { loadContent } from "./cms/content.js";
import { bindAvatar } from "./components/avatar.js";
import { bindProjectDialog, openProjectDialog } from "./components/project-dialog.js";
import { animateProjectViewChange, bindProjectGrid, renderProjects } from "./components/projects.js";
import { startAppearAnimations } from "./components/reveal.js";
import { renderServices } from "./components/services.js";
import { bindLanguageMenu, updateClock, wireLinks } from "./components/site-shell.js";
import { bindTabs, renderCategoryTabs, renderViewTabs, updateAllTabIndicators } from "./components/tabs.js";
import { setTextBindings, splitIntroWords, syncButtonLabels } from "./components/text-bindings.js";
import { escapeHtml } from "./utils/dom.js";

const state = {
  content: null,
  filter: "product",
  view: "bento"
};

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

function bindInteractions() {
  bindTabs(".filter-tabs", (button) => {
    state.filter = button.dataset.filter;
    renderCurrentProjects();
  });

  bindTabs(".view-tabs", (button) => {
    setViewMode(button.dataset.view);
  });

  bindProjectGrid({
    getProject: (index) => state.content.projects[index],
    onOpen: openProjectDialog
  });

  bindProjectDialog();
  bindLanguageMenu();
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
  document.title = content.site.title;
  document.querySelector("meta[name='description']").content = content.site.description;

  setTextBindings(content);
  splitIntroWords(content);
  renderCategoryTabs(content.projectCategories, state.filter);
  renderViewTabs(content.projectViewModes, state.view);
  renderServices(content.services);
  renderCurrentProjects();
  wireLinks(content);
  bindAvatar(content.site.avatar);
  syncButtonLabels();

  updateAllTabIndicators();
  (document.fonts?.ready ?? Promise.resolve()).then(revealWorkToolbar);
  startAppearAnimations();
  updateClock();
  window.setInterval(updateClock, 1000);
}

bindInteractions();

loadContent()
  .then(hydrateSite)
  .catch((error) => {
    document.body.insertAdjacentHTML("afterbegin", `<p style="padding:24px;color:#ff8d8d">${escapeHtml(error.message)}</p>`);
  });
