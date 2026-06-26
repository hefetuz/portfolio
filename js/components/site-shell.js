import { escapeAttr, escapeHtml } from "../utils/dom.js";

export function wireLinks(content) {
  document.getElementById("emailLink").href = `mailto:${content.site.email}`;
  renderSocialLinks(content);
}

function renderSocialLinks(content) {
  const socialLinks = document.getElementById("socialLinks");
  if (!socialLinks) return;

  const links = [
    ["X", "x", content.site.xUrl],
    ["Behance", "behance", content.site.behanceUrl || content.site.dribbbleUrl],
    ["Dribbble", "dribbble", content.site.dribbbleUrl],
    ["Instagram", "instagram", content.site.instagramUrl]
  ].filter(([, , url]) => Boolean(url));

  socialLinks.style.setProperty("--social-tab-count", links.length);
  socialLinks.innerHTML = `
    <span class="social-label text-ui" aria-hidden="true">Social</span>
    ${links.map(([label, icon, url]) => `
    <a class="social-tab t-tt-wrap" href="${escapeAttr(url)}" target="_blank" rel="noreferrer" aria-label="${escapeAttr(label)}" aria-describedby="tt-social-${escapeAttr(icon)}">
      <span class="social-icon social-icon-${escapeAttr(icon)}" aria-hidden="true">
        ${socialIcon(icon)}
      </span>
      <span class="t-tt text-ui" id="tt-social-${escapeAttr(icon)}" role="tooltip">${escapeHtml(label)}</span>
    </a>
  `).join("")}
  `;
}

function socialIcon(icon) {
  const icons = {
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 3H21l-6.94 7.93L22 21h-6.2l-4.86-6.35L5.38 21H3.27l7.42-8.48L3 3h6.36l4.39 5.79L18.9 3Zm-1.08 16.2h1.16L8.73 4.74H7.49L17.82 19.2Z"/></svg>',
    behance: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.64 10.27c1.64 0 2.67-.93 2.67-2.42C12.31 5.97 11 5 9.05 5H3v14h6.3c2.78 0 4.34-1.32 4.34-3.72 0-1.91-1.2-3.1-3.35-3.34v-.07Zm-3.58-3h2.36c1.08 0 1.73.5 1.73 1.38 0 .93-.72 1.47-1.94 1.47H6.06V7.27Zm2.6 9.46H6.06v-3.36h2.68c1.45 0 2.24.57 2.24 1.64 0 1.1-.8 1.72-2.32 1.72ZM20.74 7.08H15.3v1.35h5.44V7.08Zm-2.67 2.37c-2.76 0-4.72 1.95-4.72 4.86 0 2.88 1.91 4.79 4.79 4.79 2.33 0 4.03-1.16 4.48-3.05h-2.26c-.33.69-1.13 1.11-2.13 1.11-1.42 0-2.39-.89-2.46-2.31H23v-.79c0-2.82-1.82-4.61-4.93-4.61Zm-2.24 3.78c.14-1.3 1-2.08 2.2-2.08 1.23 0 2 .74 2.06 2.08h-4.26Z"/></svg>',
    dribbble: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5A9.5 9.5 0 1 0 21.5 12 9.5 9.5 0 0 0 12 2.5Zm6.25 4.38a8 8 0 0 1 1.57 4.54 17.4 17.4 0 0 0-5.02-.08 25.6 25.6 0 0 0-1.14-2.28 11.9 11.9 0 0 0 4.59-2.18ZM12 4.18a8 8 0 0 1 4.95 1.72 10.5 10.5 0 0 1-4.08 1.87 33.5 33.5 0 0 0-2.6-3.35A8.1 8.1 0 0 1 12 4.18ZM8.4 5.02a31.5 31.5 0 0 1 2.68 3.4 33 33 0 0 1-6.63.84A8.03 8.03 0 0 1 8.4 5.02Zm-4.08 6.66h.18a34.7 34.7 0 0 0 7.48-1 22.7 22.7 0 0 1 .96 1.94l-.46.13c-4.05 1.23-6.2 4.6-6.56 5.18a8 8 0 0 1-1.6-6.25Zm2.82 7.35c.8-1.33 2.72-3.63 5.9-4.72.11-.04.23-.08.35-.11a20.4 20.4 0 0 1 1.09 4.8A8 8 0 0 1 7.14 19.03Zm9.02-.86a22.2 22.2 0 0 0-.99-4.33 15.7 15.7 0 0 1 4.63.13 8.03 8.03 0 0 1-3.64 4.2Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm8.37 1.73H7.88a4.15 4.15 0 0 0-4.15 4.15v8.24a4.15 4.15 0 0 0 4.15 4.15h8.24a4.15 4.15 0 0 0 4.15-4.15V7.88a4.15 4.15 0 0 0-4.15-4.15ZM12 7.85A4.15 4.15 0 1 1 7.85 12 4.16 4.16 0 0 1 12 7.85Zm0 1.63A2.52 2.52 0 1 0 14.52 12 2.52 2.52 0 0 0 12 9.48Zm4.67-2.9a1 1 0 1 1-1 1 1 1 0 0 1 1-1Z"/></svg>'
  };
  return icons[icon] ?? icons.x;
}

export function bindLanguageMenu() {
  const menu = document.querySelector("[data-language-menu]");
  if (!menu) return;

  const trigger = menu.querySelector(".language-trigger");
  const dropdown = menu.querySelector(".language-dropdown");
  const items = [...menu.querySelectorAll("[data-language]")];
  if (!trigger || !dropdown || !items.length) return;

  let closeTimer = 0;
  const triggerLabel = trigger.querySelector("[data-language-current]");

  const setTriggerLanguage = (language) => {
    if (triggerLabel) {
      triggerLabel.textContent = language;
    }
  };

  const openMenu = () => {
    window.clearTimeout(closeTimer);
    menu.classList.remove("is-closing");
    menu.classList.add("is-open");
    dropdown.classList.remove("is-closing");
    dropdown.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
  };

  const closeMenu = () => {
    if (!dropdown.classList.contains("is-open")) return;
    menu.classList.remove("is-open");
    menu.classList.add("is-closing");
    dropdown.classList.remove("is-open");
    dropdown.classList.add("is-closing");
    trigger.setAttribute("aria-expanded", "false");
    closeTimer = window.setTimeout(() => {
      menu.classList.remove("is-closing");
      dropdown.classList.remove("is-closing");
    }, 150);
  };

  trigger.addEventListener("click", () => {
    if (dropdown.classList.contains("is-open")) {
      closeMenu();
      return;
    }
    openMenu();
  });

  items.forEach((item) => {
    item.addEventListener("click", () => {
      const language = item.dataset.language;
      setTriggerLanguage(language);
      items.forEach((option) => {
        option.setAttribute("aria-checked", String(option === item));
      });
      closeMenu();
    });
  });

  document.addEventListener("pointerdown", (event) => {
    if (!menu.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      trigger.focus();
    }
  });
}

export function updateClock() {
  const clock = document.getElementById("clock");
  if (!clock) return;

  const now = new Date();
  clock.textContent = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(now);
  clock.dateTime = now.toISOString();
}
