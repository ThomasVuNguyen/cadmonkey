const promptInput = document.getElementById("clockworkPrompt");
const torqueRange = document.getElementById("torqueRange");
const polishRange = document.getElementById("polishRange");
const modeButtons = document.querySelectorAll(".cogs button");
const windBtn = document.getElementById("windBtn");
const namePlate = document.getElementById("clockworkName");
const specsPlate = document.getElementById("clockworkSpecs");
const codeOutput = document.getElementById("clockworkCode");
const canvas = document.getElementById("clockworkCanvas");
const ctx = canvas.getContext("2d");

let activeMode = "precision";
let frame = 0;
let drag = false;
let rotation = 0;

const materials = {
  precision: ["brass", "obsidian", "ivory", "silver"],
  spectacle: ["crystal", "opal", "sunstone", "amethyst"],
  utility: ["iron", "bronze", "oak", "graphite"]
};

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

function drawGears() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width;
  const h = canvas.height;
  ctx.save();
  ctx.translate(w / 2, h / 2);

  drawGear(140, 24, 0.8, rotation);
  drawGear(90, 16, -0.6, -rotation * 1.3);
  drawGear(60, 12, 1.2, rotation * 1.8);

  ctx.restore();
  frame += 1;
  if (!drag) rotation += 0.01 + Number(torqueRange.value) / 5000;
  requestAnimationFrame(drawGears);
}

function drawGear(radius, teeth, speed, angle) {
  ctx.save();
  ctx.rotate(angle);
  for (let i = 0; i < teeth; i += 1) {
    ctx.rotate((Math.PI * 2) / teeth);
    ctx.beginPath();
    ctx.moveTo(radius, -6);
    ctx.lineTo(radius + 12, 0);
    ctx.lineTo(radius, 6);
    ctx.fillStyle = "rgba(199, 154, 76, 0.8)";
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0, 0, radius - 6, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(247, 220, 158, 0.8)";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, radius / 4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 205, 134, 0.6)";
  ctx.fill();
  ctx.restore();
}

canvas.addEventListener("pointerdown", () => {
  drag = true;
  canvas.style.cursor = "grabbing";
});

canvas.addEventListener("pointerup", () => {
  drag = false;
  canvas.style.cursor = "grab";
});

canvas.addEventListener("pointermove", (event) => {
  if (!drag) return;
  rotation += event.movementX / 300;
});

window.addEventListener("keydown", (event) => {
  if (event.shiftKey && event.key.toLowerCase() === "w") {
    rotation = 0;
    buildCode();
  }
});

function updateMode(button) {
  activeMode = button.dataset.mode;
  modeButtons.forEach((btn) => btn.classList.toggle("active", btn === button));
  buildCode();
}

function buildCode() {
  const prompt = (promptInput.value.trim() || "steam-powered duck automaton").replace(/"/g, '\\"');
  const torque = (Number(torqueRange.value) / 100).toFixed(2);
  const polish = (Number(polishRange.value) / 100).toFixed(2);
  const material = materials[activeMode][Math.floor(Math.random() * materials[activeMode].length)];

  const nameParts = prompt.split(" ").filter(Boolean);
  const label = nameParts.slice(0, 2).map((word) => word[0].toUpperCase() + word.slice(1)).join(" ") || "Clockwork";
  const rpm = Math.floor(260 + Number(torqueRange.value) * 1.4);
  const balance = (0.6 + Number(polishRange.value) / 250).toFixed(2);

  namePlate.textContent = `${label}`;
  specsPlate.textContent = `rpm ${rpm} / balance ${balance}`;

  codeOutput.textContent = [
    "const studio = new ClockworkStudio();",
    `const build = studio.compose("${prompt}");`,
    `build.mode("${activeMode}");`,
    `build.material("${material}");`,
    `build.torque(${torque});`,
    `build.polish(${polish});`,
    "build.alignTeeth();",
    "build.wind();"
  ].join("\n");
}

promptInput.addEventListener("input", buildCode);
[torqueRange, polishRange].forEach((slider) => slider.addEventListener("input", buildCode));
modeButtons.forEach((button) => button.addEventListener("click", () => updateMode(button)));
windBtn.addEventListener("click", buildCode);

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
buildCode();
drawGears();
