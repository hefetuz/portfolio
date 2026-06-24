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
    x: '<svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5 5 19"></path></svg>',
    behance: '<svg viewBox="0 0 24 24"><path d="M4.5 7.5h5.2a3 3 0 0 1 0 6H4.5v-6Zm0 6h5.8a3.2 3.2 0 0 1 0 6.4H4.5v-6.4ZM15 9.5h5M14.5 14.5h6a3.3 3.3 0 0 0-3.1-2.2 3.8 3.8 0 1 0 3.1 5.8"></path></svg>',
    dribbble: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5"></circle><path d="M6 7.7c3.7 1.7 6.3 5.2 7.4 11.3M5 13.3c5.3.1 9.7-1.2 13.2-4M10.6 4.8c2.2 3.2 3.8 7.2 4.6 12"></path></svg>',
    instagram: '<svg viewBox="0 0 24 24"><rect x="5.5" y="5.5" width="13" height="13" rx="4"></rect><circle cx="12" cy="12" r="3.2"></circle><path d="M15.9 8.1h.01"></path></svg>'
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
