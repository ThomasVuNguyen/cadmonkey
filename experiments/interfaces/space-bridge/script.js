const promptInput = document.getElementById("bridgePrompt");
const tierLabel = document.getElementById("tierLabel");
const shiftButtons = document.querySelectorAll(".dials button");
const modeButtons = document.querySelectorAll(".chips button");
const launchBtn = document.getElementById("launchBtn");
const statusLabel = document.getElementById("bridgeStatus");
const vectorLabel = document.getElementById("bridgeVector");
const nameLabel = document.getElementById("bridgeName");
const telemetryLabel = document.getElementById("bridgeTelemetry");
const codeOutput = document.getElementById("bridgeCode");
const canvas = document.getElementById("bridgeCanvas");
const ctx = canvas.getContext("2d");

const tiers = ["L1", "L2", "M1", "M2", "G1", "G2"];
let tierIndex = 1;
let activeMode = "prototype";
let frame = 0;

const modeConfigs = {
  prototype: ["scan", "loft", "spline", "shell"],
  combat: ["armor", "arm", "shield", "deploy"],
  cargo: ["segment", "load", "balance", "compress"],
  science: ["calibrate", "sample", "map", "simulate"]
};

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * ratio;
  canvas.height = canvas.clientHeight * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawBridge() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const cx = w / 2;
  const cy = h / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.sin(frame * 0.01) * 0.08);

  for (let ring = 0; ring < 5; ring += 1) {
    const radius = 70 + ring * 30;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(106, 215, 255, ${0.5 - ring * 0.08})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 12]);
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  const nodes = 12;
  for (let i = 0; i < nodes; i += 1) {
    const angle = (Math.PI * 2 / nodes) * i + frame * 0.02;
    const radius = 120 + Math.sin(frame * 0.03 + i) * 20;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    ctx.fillStyle = `rgba(106, 215, 255, ${0.6 + Math.sin(frame * 0.03 + i) * 0.2})`;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = "rgba(106, 215, 255, 0.2)";
    ctx.moveTo(0, 0);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  ctx.restore();

  frame += 1;
  requestAnimationFrame(drawBridge);
}

function updateTier(delta) {
  tierIndex = (tierIndex + delta + tiers.length) % tiers.length;
  tierLabel.textContent = tiers[tierIndex];
  buildCode();
}

function updateMode(newMode, element) {
  activeMode = newMode;
  modeButtons.forEach((btn) => btn.classList.toggle("active", btn === element));
  buildCode();
}

function buildCode() {
  const prompt = (promptInput.value.trim() || "nebula scout").replace(/"/g, '\\"');
  const tier = tiers[tierIndex];
  const operations = modeConfigs[activeMode]
    .map((op, index) => `  craft.${op}(${(Math.random() * 3 + index).toFixed(2)});`)
    .join("\n");

  codeOutput.textContent = [
    "const bridge = new SpaceBridge();",
    `const craft = bridge.order("${prompt}");`,
    `craft.orbit("${tier}");`,
    `craft.mode("${activeMode}");`,
    operations,
    "craft.launch();"
  ].join("\n");

  nameLabel.textContent = prompt.split(" ").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
  telemetryLabel.textContent = `${activeMode} channel ready`;
}

function randomVector() {
  const a = Math.floor(Math.random() * 360).toString().padStart(3, "0");
  const b = Math.floor(Math.random() * 360).toString().padStart(3, "0");
  const c = Math.floor(Math.random() * 360).toString().padStart(3, "0");
  return `${a} · ${b} · ${c}`;
}

promptInput.addEventListener("input", buildCode);
shiftButtons.forEach((button) => {
  button.addEventListener("click", () => updateTier(Number(button.dataset.shift)));
});
modeButtons.forEach((button) => {
  button.addEventListener("click", () => updateMode(button.dataset.mode, button));
});

launchBtn.addEventListener("click", () => {
  statusLabel.textContent = "Status: launching";
  telemetryLabel.textContent = "telemetry boost";
  vectorLabel.textContent = `Vector: ${randomVector()}`;
  setTimeout(() => {
    statusLabel.textContent = "Status: standby";
    telemetryLabel.textContent = `${activeMode} channel ready`;
  }, 1200);
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
buildCode();
drawBridge();
