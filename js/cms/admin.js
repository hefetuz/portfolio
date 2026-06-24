import { escapeAttr, escapeHtml } from "../utils/dom.js";
import { getMediaType, normalizeMediaItem } from "../utils/media.js";

const CONTENT_URL = "cms/content.json";
const SAVE_URL = "/api/content";
const MEDIA_URL = "/api/media";
const MEDIA_ACCEPT = "image/*,video/*";

const state = {
  content: null,
  activeIndex: 0,
  dirty: false
};

const elements = {
  stats: document.getElementById("cmsStats"),
  list: document.getElementById("cmsProjectList"),
  form: document.getElementById("cmsProjectForm"),
  status: document.getElementById("cmsStatus"),
  save: document.getElementById("cmsSave"),
  export: document.getElementById("cmsExport"),
  add: document.getElementById("cmsAddProject")
};

const editableFields = [
  ["title", "Project Name", "text"],
  ["slug", "Slug", "text"],
  ["date", "Date", "text"],
  ["summary", "Scope", "text"],
  ["service", "Services", "text"],
  ["meta", "Role / Meta", "text"],
  ["goal", "Goal", "textarea"],
  ["description", "Overview", "textarea"]
];

function slugify(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getProjectCategories(project) {
  return project.categories?.length ? project.categories : [project.category].filter(Boolean);
}

function getProjectMedia(project) {
  return project.media?.length ? project.media : [];
}

function setStatus(message, tone = "muted") {
  elements.status.textContent = message;
  elements.status.dataset.tone = tone;
}

function markDirty() {
  state.dirty = true;
  setStatus("Unsaved changes", "warning");
}

function getContentCategories() {
  return state.content.projectCategories.filter((category) => category.id !== "all");
}

function normalizeProject(project) {
  const fallbackMedia = project.image
    ? [{ src: project.image, type: getMediaType(project.image), alt: project.title, caption: project.summary || "" }]
    : [];

  const sourceMedia = project.media?.length
    ? project.media
    : project.images?.length
      ? project.images
      : fallbackMedia;

  project.media = sourceMedia.map((item) => normalizeMediaItem(item, project.title));
  project.categories = getProjectCategories(project);
  project.category = project.category || project.categories[0] || "product";
  project.scope = project.scope || project.summary || "";

  if (!project.image && project.media[0]) {
    project.image = project.media[0].poster || project.media[0].src;
  }

  return project;
}

function normalizeContent(content) {
  content.projects = content.projects.map(normalizeProject);
  return content;
}

function renderStats() {
  const categories = state.content.projectCategories;
  elements.stats.innerHTML = categories.map((category) => {
    const count = category.id === "all"
      ? state.content.projects.length
      : state.content.projects.filter((project) => getProjectCategories(project).includes(category.id)).length;

    return `
      <div class="cms-stat">
        <span class="text-ui">${escapeHtml(category.label)}</span>
        <strong class="text-mono">${count}</strong>
      </div>
    `;
  }).join("");
}

function renderProjectList() {
  elements.list.innerHTML = state.content.projects.map((project, index) => {
    const categories = getProjectCategories(project)
      .map((category) => state.content.projectCategories.find((item) => item.id === category)?.label || category)
      .join(", ");

    return `
      <button class="cms-project-row${index === state.activeIndex ? " active" : ""}" type="button" data-project-index="${index}">
        <span>
          <strong class="text-ui">${escapeHtml(project.title)}</strong>
          <small class="text-ui text-muted">${escapeHtml(project.summary || "No scope")}</small>
        </span>
        <em class="text-ui text-muted">${escapeHtml(categories)}</em>
      </button>
    `;
  }).join("");
}

function fieldTemplate(project, [key, label, type]) {
  const value = project[key] || "";
  const control = type === "textarea"
    ? `<textarea name="${escapeAttr(key)}" rows="4">${escapeHtml(value)}</textarea>`
    : `<input name="${escapeAttr(key)}" type="${escapeAttr(type)}" value="${escapeAttr(value)}">`;

  return `
    <label class="cms-field">
      <span class="text-ui text-muted">${escapeHtml(label)}</span>
      ${control}
    </label>
  `;
}

function mediaPreviewTemplate(media, label = "Media preview") {
  const item = normalizeMediaItem(media);
  if (!item.src && !item.poster) {
    return `<div class="cms-media-empty text-ui text-muted">${escapeHtml(label)}</div>`;
  }

  if (item.type === "video") {
    return `
      <video src="${escapeAttr(item.src)}"${item.poster ? ` poster="${escapeAttr(item.poster)}"` : ""} muted playsinline preload="metadata" aria-label="${escapeAttr(item.alt || label)}"></video>
    `;
  }

  return `<img src="${escapeAttr(item.src || item.poster)}" alt="${escapeAttr(item.alt || label)}">`;
}

function renderCoverField(project) {
  const cover = {
    src: project.image || "",
    type: getMediaType(project.image || ""),
    alt: project.title
  };

  return `
    <section class="cms-cover-panel">
      <div class="cms-section-head">
        <div>
          <p class="text-ui text-muted">Card Cover</p>
          <h3 class="text-body">Homepage card media</h3>
        </div>
        <label class="btn secondary cms-file-button">
          <span>Upload Cover</span>
          <input class="cms-file-input" type="file" accept="${MEDIA_ACCEPT}" data-upload-target="cover">
        </label>
      </div>
      <div class="cms-cover-grid">
        <div class="cms-media-preview">
          ${mediaPreviewTemplate(cover, "Cover preview")}
        </div>
        <label class="cms-field">
          <span class="text-ui text-muted">Cover Path</span>
          <input name="image" type="text" value="${escapeAttr(project.image || "")}">
        </label>
      </div>
    </section>
  `;
}

function renderMediaManager(project) {
  const media = getProjectMedia(project);

  return `
    <section class="cms-media-manager" data-media-manager>
      <div class="cms-section-head">
        <div>
          <p class="text-ui text-muted">Project Media</p>
          <h3 class="text-body">Detail page visuals</h3>
        </div>
        <button class="btn secondary" type="button" data-add-media>Add Media</button>
      </div>
      <div class="cms-media-list">
        ${media.length ? media.map((item, index) => mediaItemTemplate(item, index)).join("") : `
          <div class="cms-media-empty text-ui text-muted">No media yet. Add an image or video for the project detail page.</div>
        `}
      </div>
    </section>
  `;
}

function mediaItemTemplate(media, index) {
  const item = normalizeMediaItem(media);

  return `
    <article class="cms-media-item" data-media-index="${index}">
      <div class="cms-media-preview">
        ${mediaPreviewTemplate(item, `Media ${index + 1}`)}
      </div>
      <div class="cms-media-fields">
        <label class="cms-field">
          <span class="text-ui text-muted">Type</span>
          <select data-media-field="type">
            <option value="image"${item.type === "image" ? " selected" : ""}>Image</option>
            <option value="video"${item.type === "video" ? " selected" : ""}>Video</option>
          </select>
        </label>
        <label class="cms-field">
          <span class="text-ui text-muted">Source</span>
          <input data-media-field="src" type="text" value="${escapeAttr(item.src || "")}">
        </label>
        <label class="cms-field">
          <span class="text-ui text-muted">Poster</span>
          <input data-media-field="poster" type="text" value="${escapeAttr(item.poster || "")}">
        </label>
        <label class="cms-field">
          <span class="text-ui text-muted">Alt</span>
          <input data-media-field="alt" type="text" value="${escapeAttr(item.alt || "")}">
        </label>
        <label class="cms-field cms-field-wide">
          <span class="text-ui text-muted">Caption</span>
          <input data-media-field="caption" type="text" value="${escapeAttr(item.caption || "")}">
        </label>
      </div>
      <div class="cms-media-actions">
        <label class="btn secondary cms-file-button">
          <span>Upload</span>
          <input class="cms-file-input" type="file" accept="${MEDIA_ACCEPT}" data-upload-target="media" data-media-index="${index}">
        </label>
        <button class="btn secondary" type="button" data-set-cover="${index}">Set Cover</button>
        <button class="btn secondary" type="button" data-move-media="${index}" data-direction="-1">Up</button>
        <button class="btn secondary" type="button" data-move-media="${index}" data-direction="1">Down</button>
        <button class="btn secondary" type="button" data-delete-media="${index}">Delete</button>
      </div>
    </article>
  `;
}

function renderCategoryFields(project) {
  const activeCategories = new Set(getProjectCategories(project));

  return `
    <fieldset class="cms-fieldset">
      <legend class="text-ui text-muted">Categories</legend>
      <div class="cms-category-grid">
        ${getContentCategories().map((category) => `
          <label class="cms-check">
            <input type="checkbox" name="categories" value="${escapeAttr(category.id)}"${activeCategories.has(category.id) ? " checked" : ""}>
            <span>${escapeHtml(category.label)}</span>
          </label>
        `).join("")}
      </div>
    </fieldset>
  `;
}

function renderPrimaryCategory(project) {
  const categoryIds = getProjectCategories(project);

  return `
    <label class="cms-field">
      <span class="text-ui text-muted">Primary Category</span>
      <select name="category">
        ${getContentCategories().map((category) => `
          <option value="${escapeAttr(category.id)}"${(project.category || categoryIds[0]) === category.id ? " selected" : ""}>
            ${escapeHtml(category.label)}
          </option>
        `).join("")}
      </select>
    </label>
  `;
}

function renderEditor() {
  const project = state.content.projects[state.activeIndex];
  if (!project) {
    elements.form.innerHTML = `<p class="text-body text-muted">No project selected.</p>`;
    return;
  }

  elements.form.innerHTML = `
    <div class="cms-editor-head">
      <div>
        <p class="text-ui text-muted">Editing</p>
        <h2 class="text-heading">${escapeHtml(project.title)}</h2>
      </div>
      <button class="btn secondary" type="button" data-delete-project>Delete</button>
    </div>
    ${editableFields.map((field) => fieldTemplate(project, field)).join("")}
    ${renderPrimaryCategory(project)}
    ${renderCategoryFields(project)}
    ${renderCoverField(project)}
    ${renderMediaManager(project)}
  `;
}

function render() {
  renderStats();
  renderProjectList();
  renderEditor();
}

function updateMediaField(input) {
  const project = state.content.projects[state.activeIndex];
  const row = input.closest("[data-media-index]");
  if (!project || !row) return;

  const index = Number(row.dataset.mediaIndex);
  const field = input.dataset.mediaField;
  project.media[index][field] = input.value;

  if (field === "src" && !project.media[index].type) {
    project.media[index].type = getMediaType(input.value);
  }

  markDirty();
}

function updateProjectFromInput(input) {
  const project = state.content.projects[state.activeIndex];
  if (!project) return;

  if (input.dataset.mediaField) {
    updateMediaField(input);
    return;
  }

  if (input.name === "categories") {
    const selected = [...elements.form.querySelectorAll('input[name="categories"]:checked')].map((item) => item.value);
    project.categories = selected.length ? selected : [project.category || "product"];
    if (!project.categories.includes(project.category)) {
      project.category = project.categories[0];
    }
  } else if (input.name === "category") {
    project.category = input.value;
    project.categories = Array.from(new Set([input.value, ...getProjectCategories(project)]));
  } else {
    project[input.name] = input.value;
    if (input.name === "summary") project.scope = input.value;
    if (input.name === "title" && !project.slug) {
      project.slug = slugify(input.value);
    }
  }

  markDirty();
  renderStats();
  renderProjectList();
}

function addProject() {
  const nextNumber = state.content.projects.length + 1;
  const project = normalizeProject({
    title: `New Project ${nextNumber}`,
    slug: `new-project-${nextNumber}`,
    category: "product",
    categories: ["product"],
    meta: "Role / Date",
    date: "2026",
    summary: "Project Scope",
    scope: "Project Scope",
    service: "Service",
    goal: "Goal: Define the outcome.",
    description: "Project overview.",
    image: "assets/project-1-hant-ai.webp"
  });

  state.content.projects.push(project);
  state.activeIndex = state.content.projects.length - 1;
  markDirty();
  render();
}

function deleteProject() {
  if (state.content.projects.length <= 1) {
    setStatus("At least one project is required.", "error");
    return;
  }

  state.content.projects.splice(state.activeIndex, 1);
  state.activeIndex = Math.max(0, state.activeIndex - 1);
  markDirty();
  render();
}

function addMedia() {
  const project = state.content.projects[state.activeIndex];
  if (!project) return;

  project.media.push({
    type: "image",
    src: project.image || "",
    poster: "",
    alt: project.title,
    caption: project.summary || ""
  });
  markDirty();
  renderEditor();
}

function deleteMedia(index) {
  const project = state.content.projects[state.activeIndex];
  if (!project) return;

  project.media.splice(index, 1);
  markDirty();
  renderEditor();
}

function moveMedia(index, direction) {
  const project = state.content.projects[state.activeIndex];
  const nextIndex = index + direction;
  if (!project || nextIndex < 0 || nextIndex >= project.media.length) return;

  const [item] = project.media.splice(index, 1);
  project.media.splice(nextIndex, 0, item);
  markDirty();
  renderEditor();
}

function setCoverFromMedia(index) {
  const project = state.content.projects[state.activeIndex];
  const item = project?.media[index];
  if (!item) return;

  project.image = item.poster || item.src;
  markDirty();
  renderProjectList();
  renderEditor();
}

async function uploadMediaFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(MEDIA_URL, {
    method: "POST",
    body: formData
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "Upload failed");
  }

  return payload;
}

async function handleUpload(input) {
  const project = state.content.projects[state.activeIndex];
  const file = input.files?.[0];
  if (!project || !file) return;

  try {
    setStatus("Uploading media...", "warning");
    const payload = await uploadMediaFile(file);

    if (input.dataset.uploadTarget === "cover") {
      project.image = payload.src;
      if (!project.media.length) {
        project.media.push({
          type: payload.type,
          src: payload.src,
          alt: project.title,
          caption: project.summary || ""
        });
      }
    } else {
      const index = Number(input.dataset.mediaIndex);
      project.media[index] = {
        ...project.media[index],
        type: payload.type,
        src: payload.src,
        alt: project.media[index]?.alt || project.title,
        caption: project.media[index]?.caption || project.summary || ""
      };
    }

    markDirty();
    setStatus("Media uploaded. Save content to persist JSON.", "success");
    renderProjectList();
    renderEditor();
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    input.value = "";
  }
}

function downloadContent() {
  const blob = new Blob([`${JSON.stringify(state.content, null, 2)}\n`], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "content.json";
  link.click();
  URL.revokeObjectURL(link.href);
  setStatus("Exported content.json", "success");
}

async function saveContent() {
  try {
    const response = await fetch(SAVE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state.content)
    });

    if (!response.ok) throw new Error("Local save endpoint unavailable");

    state.dirty = false;
    setStatus("Saved to cms/content.json", "success");
  } catch (error) {
    setStatus("Save failed. Use Export JSON on static hosting.", "error");
  }
}

async function load() {
  const response = await fetch(CONTENT_URL);
  if (!response.ok) throw new Error(`Could not load ${CONTENT_URL}`);
  state.content = normalizeContent(await response.json());
  state.activeIndex = 0;
  state.dirty = false;
  setStatus("Ready", "success");
  render();
}

elements.list.addEventListener("click", (event) => {
  const row = event.target.closest("[data-project-index]");
  if (!row) return;
  state.activeIndex = Number(row.dataset.projectIndex);
  render();
});

elements.form.addEventListener("input", (event) => {
  if (!event.target.matches("input, textarea, select")) return;
  if (event.target.type === "file") return;
  updateProjectFromInput(event.target);
});

elements.form.addEventListener("change", (event) => {
  if (event.target.matches('input[type="file"][data-upload-target]')) {
    handleUpload(event.target);
    return;
  }

  if (!event.target.matches("input, textarea, select")) return;
  updateProjectFromInput(event.target);
});

elements.form.addEventListener("click", (event) => {
  if (event.target.closest("[data-delete-project]")) {
    deleteProject();
    return;
  }

  if (event.target.closest("[data-add-media]")) {
    addMedia();
    return;
  }

  const deleteButton = event.target.closest("[data-delete-media]");
  if (deleteButton) {
    deleteMedia(Number(deleteButton.dataset.deleteMedia));
    return;
  }

  const moveButton = event.target.closest("[data-move-media]");
  if (moveButton) {
    moveMedia(Number(moveButton.dataset.moveMedia), Number(moveButton.dataset.direction));
    return;
  }

  const coverButton = event.target.closest("[data-set-cover]");
  if (coverButton) {
    setCoverFromMedia(Number(coverButton.dataset.setCover));
  }
});

elements.add.addEventListener("click", addProject);
elements.export.addEventListener("click", downloadContent);
elements.save.addEventListener("click", saveContent);

window.addEventListener("beforeunload", (event) => {
  if (!state.dirty) return;
  event.preventDefault();
  event.returnValue = "";
});

load().catch((error) => {
  setStatus(error.message, "error");
});
