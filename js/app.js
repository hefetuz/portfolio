const CONTENT_URL = "cms/content.json";

const state = {
  content: null,
  filter: "product",
  view: "bento"
};

function getPath(source, path) {
  return path.split(".").reduce((value, key) => value?.[key], source);
}

function setTextBindings(content) {
  document.querySelectorAll("[data-text]").forEach((node) => {
    node.textContent = getPath(content, node.dataset.text) ?? "";
  });
}

function splitIntroWords() {
  const headline = document.querySelector(".intro h1");
  const words = headline.textContent.trim().split(/\s+/);
  headline.innerHTML = words.map((word, index) => (
    `<span class="intro-word" style="--word-delay:${index * 45}ms">${escapeHtml(word)}</span>`
  )).join(" ");
}

function syncButtonLabels() {
  document.querySelectorAll(".btn").forEach((button) => {
    button.dataset.label = button.textContent.trim();
  });
}

function renderServices(services) {
  document.getElementById("servicesList").innerHTML = services.map((service) => `
    <article class="service">
      <h3>${escapeHtml(service.title)}</h3>
      <ul>${service.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </article>
  `).join("");
}

function renderProjects(projects) {
  const filtered = projects.filter((project) => project.category === state.filter);
  const work = document.getElementById("work");

  work.className = `project-grid view-${state.view}`;
  work.innerHTML = filtered.map((project, index) => `
    <article class="project-card t-resize bento-${(index % 8) + 1}" tabindex="0" role="button" data-index="${projects.indexOf(project)}" style="--appear-delay:${80 + index * 90}ms">
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
  `).join("");
  observeReveal(document.querySelectorAll(".project-card"));
}

function updateTabIndicator(tabs = document.querySelector(".filter-tabs")) {
  if (!tabs) return;
  const active = tabs.querySelector(".tab.active");
  const indicator = tabs.querySelector(".tab-indicator");
  if (!active || !indicator) return;

  const tabsBox = tabs.getBoundingClientRect();
  const activeBox = active.getBoundingClientRect();
  indicator.style.width = `${activeBox.width}px`;
  indicator.style.height = `${activeBox.height}px`;
  indicator.style.transform = `translate3d(${activeBox.left - tabsBox.left}px, ${activeBox.top - tabsBox.top}px, 0)`;
}

function updateAllTabIndicators() {
  document.querySelectorAll(".tabs").forEach((tabs) => updateTabIndicator(tabs));
}

function setViewMode(view) {
  if (state.view === view) return;
  state.view = view;
  const work = document.getElementById("work");
  const cards = [...work.querySelectorAll(".project-card")];

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !cards.length) {
    work.className = `project-grid view-${state.view}`;
    return;
  }

  const previousRects = new Map(cards.map((card) => [card, card.getBoundingClientRect()]));
  cards.forEach((card) => {
    const rect = previousRects.get(card);
    card.style.width = `${rect.width}px`;
    card.style.height = `${rect.height}px`;
  });

  work.className = `project-grid view-${state.view}`;

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

    cardLayoutFlush(work);

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

function cardLayoutFlush(node) {
  return node.offsetHeight;
}

function wireLinks(content) {
  document.getElementById("avatar").src = content.site.avatar;
  document.getElementById("emailLink").href = `mailto:${content.site.email}`;
  document.getElementById("socialLink").href = content.site.dribbbleUrl || content.site.xUrl;
}

function openProject(project) {
  const dialog = document.getElementById("projectDialog");
  document.getElementById("dialogImage").src = project.image;
  document.getElementById("dialogImage").alt = project.title;
  document.getElementById("dialogMeta").textContent = project.meta;
  document.getElementById("dialogTitle").textContent = project.title;
  document.getElementById("dialogDescription").textContent = project.description;
  dialog.showModal();
}

function updateClock() {
  const clock = document.getElementById("clock");
  clock.textContent = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date());
}

function observeReveal(nodes) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    nodes.forEach((node) => node.classList.add("framer-reveal"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("framer-reveal");
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.18,
    rootMargin: "0px 0px -8% 0px"
  });

  nodes.forEach((node) => observer.observe(node));
}

function startAppearAnimations() {
  const blocks = [
    [document.querySelector(".profile"), 0],
    [document.querySelector(".services"), 600],
    [document.querySelector(".footer"), 800],
    [document.querySelector(".work-toolbar"), 100]
  ];

  blocks.forEach(([node, delay]) => {
    if (!node) return;
    node.style.setProperty("--appear-delay", `${delay}ms`);
    node.classList.add("framer-reveal");
  });

  observeReveal(document.querySelectorAll(".project-card"));
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

function escapeAttr(value = "") {
  return escapeHtml(value);
}

async function loadContent() {
  const response = await fetch(CONTENT_URL);
  if (!response.ok) throw new Error(`Could not load ${CONTENT_URL}`);
  return response.json();
}

document.querySelector(".filter-tabs").addEventListener("click", (event) => {
  const button = event.target.closest(".tab");
  if (!button) return;
  state.filter = button.dataset.filter;
  document.querySelectorAll(".filter-tabs .tab").forEach((tab) => tab.classList.toggle("active", tab === button));
  updateAllTabIndicators();
  renderProjects(state.content.projects);
});

document.querySelector(".view-tabs").addEventListener("click", (event) => {
  const button = event.target.closest(".tab");
  if (!button) return;
  document.querySelectorAll(".view-tabs .tab").forEach((tab) => tab.classList.toggle("active", tab === button));
  setViewMode(button.dataset.view);
  updateAllTabIndicators();
});

window.addEventListener("resize", updateAllTabIndicators);
window.addEventListener("load", updateAllTabIndicators);

document.getElementById("work").addEventListener("click", (event) => {
  const card = event.target.closest(".project-card");
  if (!card) return;
  openProject(state.content.projects[Number(card.dataset.index)]);
});

document.getElementById("work").addEventListener("keydown", (event) => {
  if (!["Enter", " "].includes(event.key)) return;
  const card = event.target.closest(".project-card");
  if (!card) return;
  event.preventDefault();
  openProject(state.content.projects[Number(card.dataset.index)]);
});

document.querySelector(".dialog-close").addEventListener("click", () => {
  document.getElementById("projectDialog").close();
});

loadContent().then((content) => {
  state.content = content;
  document.title = content.site.title;
  document.querySelector("meta[name='description']").content = content.site.description;
  setTextBindings(content);
  splitIntroWords();
  renderServices(content.services);
  renderProjects(content.projects);
  wireLinks(content);
  syncButtonLabels();
  updateAllTabIndicators();
  document.fonts?.ready.then(updateAllTabIndicators);
  startAppearAnimations();
  updateClock();
  window.setInterval(updateClock, 1000);
}).catch((error) => {
  document.body.insertAdjacentHTML("afterbegin", `<p style="padding:24px;color:#ff8d8d">${escapeHtml(error.message)}</p>`);
});
