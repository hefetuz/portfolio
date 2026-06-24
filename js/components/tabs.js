import { escapeAttr, escapeHtml } from "../utils/dom.js";

const VIEW_TAB_SLOT = 28;

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
  const collapsedOffset = Math.max(0, viewModes.length - 1 - activeIndex) * VIEW_TAB_SLOT;
  target.classList.remove("is-ready");
  target.dataset.open = "false";
  target.style.setProperty("--view-tab-count", viewModes.length);
  target.style.setProperty("--view-active-offset", `${collapsedOffset}px`);
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

  const segmentPadding = Number.parseFloat(getComputedStyle(tabs).getPropertyValue("--segment-padding")) || 2;
  const isViewTabs = tabs.classList.contains("view-tabs");
  const isCollapsedView = isViewTabs && tabs.dataset.open !== "true";
  const activeBox = active.getBoundingClientRect();
  let indicatorWidth = activeBox.width;
  let indicatorHeight = activeBox.height;
  let offsetX;
  let offsetY;

  if (isViewTabs) {
    const activeIndex = [...tabs.querySelectorAll(".tab")].indexOf(active);
    const slot = Number.parseFloat(getComputedStyle(tabs).getPropertyValue("--view-tab-slot")) || VIEW_TAB_SLOT;
    indicatorWidth = slot;
    indicatorHeight = Number.parseFloat(getComputedStyle(tabs).getPropertyValue("--segment-tab-height")) || activeBox.height;
    offsetX = isCollapsedView ? segmentPadding : segmentPadding + Math.max(0, activeIndex) * slot;
    offsetY = segmentPadding;
  } else {
    const tabsBox = tabs.getBoundingClientRect();
    offsetX = activeBox.left - tabsBox.left;
    offsetY = activeBox.top - tabsBox.top;
  }

  if (options.instant) {
    tabs.classList.add("is-hydrating");
  }
  indicator.style.width = `${indicatorWidth}px`;
  indicator.style.height = `${indicatorHeight}px`;
  indicator.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
  if (options.instant) {
    requestAnimationFrame(() => tabs.classList.remove("is-hydrating"));
  }
}

export function updateAllTabIndicators() {
  document.querySelectorAll(".segmented-control").forEach((tabs) => updateTabIndicator(tabs));
}

export function bindTabs(selector, callback) {
  const tabs = document.querySelector(selector);
  if (!tabs) return;

  if (tabs.classList.contains("view-tabs")) {
    tabs.addEventListener("pointerenter", () => {
      tabs.dataset.open = "true";
      updateTabIndicator(tabs);
    });
    tabs.addEventListener("pointerleave", () => {
      tabs.dataset.open = "false";
      updateTabIndicator(tabs);
    });
    tabs.addEventListener("focusin", () => {
      tabs.dataset.open = "true";
      updateTabIndicator(tabs);
    });
    tabs.addEventListener("focusout", () => {
      if (!tabs.matches(":focus-within")) {
        tabs.dataset.open = "false";
        updateTabIndicator(tabs);
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
      const buttons = [...tabs.querySelectorAll(".tab")];
      const index = buttons.indexOf(button);
      const collapsedOffset = Math.max(0, buttons.length - 1 - index) * VIEW_TAB_SLOT;
      tabs.style.setProperty("--view-active-offset", `${collapsedOffset}px`);
    }

    callback(button);
    updateAllTabIndicators();
  });
}
