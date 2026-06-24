export function wireLinks(content) {
  document.getElementById("emailLink").href = `mailto:${content.site.email}`;
  document.getElementById("socialLink").href = content.site.dribbbleUrl || content.site.xUrl;
}

export function bindLanguageMenu() {
  const menu = document.querySelector("[data-language-menu]");
  if (!menu) return;

  const trigger = menu.querySelector(".language-trigger");
  const dropdown = menu.querySelector(".language-dropdown");
  const items = [...menu.querySelectorAll("[data-language]")];
  if (!trigger || !dropdown || !items.length) return;

  let closeTimer = 0;

  const openMenu = () => {
    window.clearTimeout(closeTimer);
    dropdown.classList.remove("is-closing");
    dropdown.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
  };

  const closeMenu = () => {
    if (!dropdown.classList.contains("is-open")) return;
    dropdown.classList.remove("is-open");
    dropdown.classList.add("is-closing");
    trigger.setAttribute("aria-expanded", "false");
    closeTimer = window.setTimeout(() => {
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
      trigger.textContent = language;
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
