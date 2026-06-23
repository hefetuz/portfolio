import { escapeHtml } from "../utils/dom.js";

function serviceTemplate(service) {
  return `
    <article class="service">
      <h3>${escapeHtml(service.title)}</h3>
      <ul>${service.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </article>
  `;
}

export function renderServices(services, target = document.getElementById("servicesList")) {
  target.innerHTML = services.map(serviceTemplate).join("");
}
