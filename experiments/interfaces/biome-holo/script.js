const promptField = document.getElementById("biomePrompt");
const toggles = document.querySelectorAll('.toggle-group input[type="checkbox"]');
const pulseRange = document.getElementById("pulseRange");
const igniteBtn = document.getElementById("igniteBtn");
const biomeName = document.getElementById("biomeName");
const biomeVitals = document.getElementById("biomeVitals");
const biomeCode = document.getElementById("biomeCode");
const canvas = document.getElementById("biomeCanvas");
const ctx = canvas.getContext("2d");

let pulseFrame = 0;
let ignitionOffset = 0;

const labels = {
  flora: ["fern bloom", "mycelium halo", "vivid lichens"],
  fauna: ["moss glider", "lucent axolotl", "bloomtail fox"],
  terrain: ["floating terraces", "crystal wetlands", "mist ravine"],
  climate: ["aurora drafts", "dewfall cycles", "rain pulse"]
};

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * ratio;
  canvas.height = canvas.clientHeight * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawHologram() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const cx = w / 2;
  const cy = h / 2;

  const rings = 6;
  for (let i = 0; i < rings; i += 1) {
    const radius = 80 + i * 28 + Math.sin((pulseFrame + i * 20) * 0.05) * 12;
    ctx.beginPath();
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius);
    grad.addColorStop(0, `rgba(120, 247, 195, ${0.12 - i * 0.01})`);
    grad.addColorStop(1, "rgba(120, 247, 195, 0)");
    ctx.fillStyle = grad;
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const points = 24;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.sin(pulseFrame * 0.01 + ignitionOffset) * 0.1);
  for (let i = 0; i < points; i += 1) {
    const angle = (Math.PI * 2 / points) * i;
    const base = 120 + Math.sin(pulseFrame * 0.05 + i) * 18;
    const x = Math.cos(angle) * base;
    const y = Math.sin(angle) * base * 0.7;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(92, 192, 255, ${0.55 - i * 0.01})`;
    ctx.lineWidth = 2;
    ctx.moveTo(0, 0);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = `rgba(120, 247, 195, ${0.85 - i * 0.02})`;
    ctx.arc(x, y, 6 + Math.sin(pulseFrame * 0.05 + i) * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  pulseFrame += (Number(pulseRange.value) / 110) + 0.2;
  requestAnimationFrame(drawHologram);
}

function pickLabel(type) {
  const pool = labels[type];
  return pool[Math.floor(Math.random() * pool.length)];
}

function updateVitals() {
  const flux = Math.floor(30 + Math.random() * 60);
  const spores = Math.floor(Math.random() * 30);
  biomeVitals.textContent = `Vitals: flux ${flux} · spores ${spores}`;
}

function buildCode() {
  const prompt = (promptField.value.trim() || "bioluminescent canopy manta").replace(/"/g, '\\"');
  const layers = Array.from(toggles)
    .filter((toggle) => toggle.checked)
    .map((toggle) => toggle.value);

  const layerLines = layers.map((layer) => `  biome.${layer}("${pickLabel(layer)}");`);

  biomeCode.textContent = [
    "const dome = new EcoDome();",
    `const biome = dome.seed("${prompt}");`,
    layerLines.join("\n"),
    `biome.pulse(${(Number(pulseRange.value) / 100).toFixed(2)});`,
    "biome.render({ resolution: 'holo' });"
  ].join("\n");
}

function updateName() {
  const words = promptField.value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    biomeName.textContent = "Aurora Moss Glider";
    return;
  }
  const name = words.slice(0, 3).map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
  biomeName.textContent = name;
}

promptField.addEventListener("input", () => {
  updateName();
  buildCode();
});

toggles.forEach((toggle) => {
  toggle.addEventListener("change", buildCode);
});

pulseRange.addEventListener("input", buildCode);

igniteBtn.addEventListener("click", () => {
  ignitionOffset = Math.random() * Math.PI * 2;
  updateVitals();
  buildCode();
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
updateName();
updateVitals();
buildCode();
drawHologram();
