const scribbleArea = document.getElementById("scribbleArea");
const codeMargin = document.getElementById("codeMargin");
const templateButtons = document.querySelectorAll(".margin button");
const glitchToggle = document.getElementById("glitchToggle");
const overlay = document.getElementById("doodleOverlay");

const verbs = ["extrude", "loft", "fillet", "mirrorscape", "weld", "inflate"];
const modifiers = ["dreamy", "kinetic", "zero-g", "modular", "elastic", "quantum"];
const outputs = ["mesh", "voxel cloud", "parametric frame", "spline rig", "polyfoam shell"];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildCodeSketch(prompt) {
  const lines = [
    `// margin codex`,
    `const idea = scribble("${prompt.replace(/"/g, '\\"')}");`,
    `idea.${randomItem(verbs)}.${randomItem(modifiers)}();`,
    `idea.shape("${randomItem(outputs)}");`,
    "idea.annotate({",
    `  doodles: ${Math.floor(prompt.length / 6)},`,
    `  glitch: ${glitchToggle.checked}`,
    "});",
    "return idea.spin();"
  ];
  codeMargin.textContent = lines.join("\n");
}

scribbleArea.addEventListener("input", () => {
  const text = scribbleArea.value.trim() || "silent prototype";
  buildCodeSketch(text);
});

scribbleArea.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.ctrlKey) {
    overlay.classList.add("scribble-pop");
    setTimeout(() => overlay.classList.remove("scribble-pop"), 500);
  }
});

templateButtons.forEach((button) => {
  button.addEventListener("click", () => {
    scribbleArea.value = button.dataset.template;
    buildCodeSketch(button.dataset.template);
  });
});

glitchToggle.addEventListener("change", () => {
  overlay.classList.toggle("is-glitch", glitchToggle.checked);
  buildCodeSketch(scribbleArea.value.trim() || "silent prototype");
});

buildCodeSketch("silent prototype");
