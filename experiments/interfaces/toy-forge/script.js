const promptBox = document.getElementById("toyPrompt");
const whimsyRange = document.getElementById("whimsyRange");
const techRange = document.getElementById("techRange");
const flavorButtons = document.querySelectorAll(".chips button");
const generateBtn = document.getElementById("generateBtn");
const codeContent = document.getElementById("codeContent");
const previewName = document.getElementById("previewName");
const previewMood = document.getElementById("previewMood");
const tabs = document.querySelectorAll(".tab");
const orbitCanvas = document.getElementById("orbitCanvas");
const ctx = orbitCanvas.getContext("2d");

let activeView = "script";
let phase = 0;
let wobble = 0;
let selectedFlavor = "Adventure";

const moods = ["curious", "zippy", "dreamy", "chaotic", "focused", "silly"];
const ingredientsBank = {
  Adventure: ["turbine fins", "glow beacons", "map projector", "thruster tail", "compass whiskers"],
  Comfort: ["fuzzy padding", "hug core", "lullaby speaker", "tea warmer", "marshmallow wheels"],
  Chaos: ["glitter cannon", "randomizer dice", "chaos lever", "confetti exhaust", "squawk siren"],
  Puzzle: ["logic nodes", "gear petals", "crystal sockets", "puzzle lock", "cipher emitter"]
};

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  orbitCanvas.width = orbitCanvas.clientWidth * ratio;
  orbitCanvas.height = orbitCanvas.clientHeight * ratio;
  ctx.scale(ratio, ratio);
}

function drawOrbit() {
  ctx.clearRect(0, 0, orbitCanvas.width, orbitCanvas.height);
  const w = orbitCanvas.clientWidth;
  const h = orbitCanvas.clientHeight;
  const centerX = w / 2;
  const centerY = h / 2 + Math.sin(phase * 0.8) * 12;

  const colors = ["#ff6f91", "#ffc75f", "#845ec2", "#f9f871"];

  for (let i = 0; i < 4; i += 1) {
    const radius = 50 + i * 24 + Math.sin(phase + i * 0.6) * 8;
    ctx.beginPath();
    ctx.strokeStyle = `${colors[i]}${(200 - i * 40).toString(16)}`;
    ctx.lineWidth = 3 - i * 0.4;
    ctx.setLineDash(i % 2 === 0 ? [12, 12] : []);
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let i = 0; i < 9; i += 1) {
    const angle = (phase * 0.8 + i * (Math.PI * 2 / 9)) + Math.sin(phase + i) * 0.2;
    const orbit = 66 + (i % 3) * 28;
    const x = centerX + Math.cos(angle) * orbit;
    const y = centerY + Math.sin(angle) * orbit * 0.8;

    ctx.beginPath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = 0.85;
    ctx.arc(x, y, 8 + ((i + wobble) % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  phase += 0.02;
  wobble += 0.04;
  requestAnimationFrame(drawOrbit);
}

function titleCase(text) {
  return text
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildScript(prompt) {
  const whimsy = Number(whimsyRange.value);
  const tech = Number(techRange.value);

  return [
    "const forge = new ToyForge();",
    `const project = forge.begin("${prompt.replace(/"/g, '\\"')}");`,
    "",
    `project.personality.setWhimsy(${whimsy / 100});`,
    `project.tech.infuse(${tech / 100});`,
    `project.theme("${selectedFlavor.toLowerCase()}");`,
    "",
    "project.anatomy.shell(",
    "  bubbleGeometry({",
    `    wobble: ${((whimsy / 100) * 0.8 + 0.2).toFixed(2)},`,
    `    sparkle: ${((tech / 100) * 0.6 + 0.3).toFixed(2)}`,
    "  })",
    ");",
    "project.motion.loop({ sway: 0.42, bounce: 0.18 });",
    "",
    "return project.release();"
  ].join("\n");
}

function buildIngredients() {
  const list = ingredientsBank[selectedFlavor];
  return list.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function updateCode() {
  const prompt = promptBox.value.trim() || "playful cosmic duck";
  if (activeView === "script") {
    codeContent.textContent = buildScript(prompt);
  } else {
    codeContent.textContent = buildIngredients();
  }
}

function updatePreview() {
  const prompt = promptBox.value.trim();
  if (!prompt) {
    previewName.textContent = "Cosmic Bubble Duck";
    previewMood.textContent = "mood: curious";
    return;
  }
  const words = prompt.split(" ").filter(Boolean);
  const candidateName = words.slice(0, 2).join(" ") || "Toy";
  previewName.textContent = titleCase(candidateName);
  previewMood.textContent = `mood: ${randomFrom(moods)}`;
}

promptBox.addEventListener("input", () => {
  updatePreview();
  updateCode();
});

[whimsyRange, techRange].forEach((slider) => {
  slider.addEventListener("input", updateCode);
});

flavorButtons.forEach((button) => {
  button.addEventListener("click", () => {
    flavorButtons.forEach((btn) => btn.classList.remove("is-active"));
    button.classList.add("is-active");
    selectedFlavor = button.dataset.flavor;
    updateCode();
  });
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((other) => other.classList.remove("active"));
    tab.classList.add("active");
    activeView = tab.dataset.view;
    updateCode();
  });
});

generateBtn.addEventListener("click", () => {
  wobble = 0;
  updatePreview();
  updateCode();
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
updatePreview();
updateCode();
drawOrbit();
