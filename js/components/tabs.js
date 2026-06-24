import { escapeAttr, escapeHtml } from "../utils/dom.js";

function categoryTabTemplate(category, isActive) {
  return `
    <button class="tab text-ui${isActive ? " active" : ""}" type="button" data-filter="${escapeAttr(category.id)}">
      <span class="tab-text">${escapeHtml(category.label)}</span>
    </button>
  `;
}

function viewTabTemplate(viewMode, isActive) {
  return `
    <button class="tab text-ui icon-tab${isActive ? " active" : ""}" type="button" data-view="${escapeAttr(viewMode.id)}" aria-label="${escapeAttr(viewMode.label)}" title="${escapeAttr(viewMode.label)}">
      <span class="view-icon view-icon-${escapeAttr(viewMode.icon || viewMode.id)}" aria-hidden="true"></span>
    </button>
  `;
}

export function renderCategoryTabs(categories, activeId, target = document.querySelector(".filter-tabs")) {
  const indicator = target.querySelector(".tab-indicator")?.outerHTML ?? '<span class="tab-indicator" aria-hidden="true"></span>';
  target.classList.remove("is-ready");
  target.classList.add("is-hydrating");
  target.innerHTML = `${indicator}${categories.map((category) => categoryTabTemplate(category, category.id === activeId)).join("")}`;
  requestAnimationFrame(() => {
    updateTabIndicator(target, { instant: true });
    target.classList.add("is-ready");
    target.classList.remove("is-hydrating");
  });
}

export function renderViewTabs(viewModes, activeId, target = document.querySelector(".view-tabs")) {
  const indicator = target.querySelector(".tab-indicator")?.outerHTML ?? '<span class="tab-indicator" aria-hidden="true"></span>';
  const activeIndex = Math.max(0, viewModes.findIndex((viewMode) => viewMode.id === activeId));
  target.classList.remove("is-ready");
  target.dataset.open = "false";
  target.style.setProperty("--view-active-offset", `${activeIndex * 28}px`);
  target.classList.add("is-hydrating");
  target.innerHTML = `${indicator}${viewModes.map((viewMode) => viewTabTemplate(viewMode, viewMode.id === activeId)).join("")}`;
  requestAnimationFrame(() => {
    updateTabIndicator(target, { instant: true });
    target.classList.add("is-ready");
    target.classList.remove("is-hydrating");
  });
}

export function updateTabIndicator(tabs = document.querySelector(".filter-tabs"), options = {}) {
  if (!tabs) return;
  const active = tabs.querySelector(".tab.active");
  const indicator = tabs.querySelector(".tab-indicator");
  if (!active || !indicator) return;

  const tabsBox = tabs.getBoundingClientRect();
  const activeBox = active.getBoundingClientRect();
  if (options.instant) {
    tabs.classList.add("is-hydrating");
  }
  indicator.style.width = `${activeBox.width}px`;
  indicator.style.height = `${activeBox.height}px`;
  indicator.style.transform = `translate3d(${activeBox.left - tabsBox.left}px, ${activeBox.top - tabsBox.top}px, 0)`;
  if (options.instant) {
    requestAnimationFrame(() => tabs.classList.remove("is-hydrating"));
  }
}

export function updateAllTabIndicators() {
  document.querySelectorAll(".tabs").forEach((tabs) => updateTabIndicator(tabs));
}

export function bindTabs(selector, callback) {
  const tabs = document.querySelector(selector);
  if (!tabs) return;

  if (tabs.classList.contains("view-tabs")) {
    tabs.addEventListener("pointerenter", () => {
      tabs.dataset.open = "true";
    });
    tabs.addEventListener("pointerleave", () => {
      tabs.dataset.open = "false";
    });
    tabs.addEventListener("focusin", () => {
      tabs.dataset.open = "true";
    });
    tabs.addEventListener("focusout", () => {
      if (!tabs.matches(":focus-within")) {
        tabs.dataset.open = "false";
      }
    });
  }

  tabs.addEventListener("click", (event) => {
    const button = event.target.closest(".tab");
    if (!button) return;

    tabs.querySelectorAll(".tab").forEach((tab) => {
      tab.classList.toggle("active", tab === button);
    });

    if (tabs.classList.contains("view-tabs")) {
      const index = [...tabs.querySelectorAll(".tab")].indexOf(button);
      tabs.style.setProperty("--view-active-offset", `${Math.max(0, index) * 28}px`);
    }

    callback(button);
    updateAllTabIndicators();
  });
}
