export function wireLinks(content) {
  document.getElementById("emailLink").href = `mailto:${content.site.email}`;
  document.getElementById("socialLink").href = content.site.dribbbleUrl || content.site.xUrl;
}

export function updateClock() {
  const clock = document.getElementById("clock");
  clock.textContent = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date());
}
