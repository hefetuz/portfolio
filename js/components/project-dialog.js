export function openProjectDialog(project) {
  const dialog = document.getElementById("projectDialog");
  document.getElementById("dialogImage").src = project.image;
  document.getElementById("dialogImage").alt = project.title;
  document.getElementById("dialogMeta").textContent = project.meta;
  document.getElementById("dialogTitle").textContent = project.title;
  document.getElementById("dialogDescription").textContent = project.description;
  dialog.showModal();
}

export function bindProjectDialog() {
  document.querySelector(".dialog-close")?.addEventListener("click", () => {
    document.getElementById("projectDialog").close();
  });
}
