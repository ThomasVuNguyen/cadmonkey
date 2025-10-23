const promptInput = document.getElementById("lumenPrompt");
const detailRange = document.getElementById("detailRange");
const weightRange = document.getElementById("weightRange");
const draftButton = document.getElementById("lumenDraft");
const nameLabel = document.getElementById("lumenName");
const statsLabel = document.getElementById("lumenStats");
const codeOutput = document.getElementById("lumenCode");
const canvas = document.getElementById("lumenCanvas");
const ctx = canvas.getContext("2d");

let frame = 0;

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * ratio;
  canvas.height = canvas.clientHeight * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawMinimalOrb() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const cx = w / 2;
  const cy = h / 2;

  ctx.fillStyle = "#eeeeea";
  ctx.fillRect(0, 0, w, h);

  const detail = Number(detailRange.value) / 100;
  const weight = Number(weightRange.value) / 100;

  ctx.save();
  ctx.translate(cx, cy);

  const layers = 6;
  for (let i = 0; i < layers; i += 1) {
    const radius = 80 + i * 22 + Math.sin(frame * 0.01 + i) * 6 * detail;
    ctx.beginPath();
    ctx.fillStyle = `rgba(30, 30, 27, ${0.06 + i * 0.04})`;
    ctx.globalAlpha = 0.4 - i * 0.05 + detail * 0.2;
    ctx.arc(Math.sin(frame * 0.004 + i) * 12 * weight, Math.cos(frame * 0.003 + i) * 8 * detail, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.fillStyle = "#ffffff";
  ctx.arc(0, 0, 90, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(30, 30, 27, 0.12)";
  ctx.stroke();
  ctx.restore();

  frame += 1;
  requestAnimationFrame(drawMinimalOrb);
}

function formatName(text) {
  return text
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .slice(0, 3)
    .join(" ") || "Porcelain Duck";
}

function buildCode() {
  const prompt = (promptInput.value.trim() || "porcelain duck with copper inlay").replace(/"/g, '\\"');
  const detail = (Number(detailRange.value) / 100).toFixed(2);
  const weight = (Number(weightRange.value) / 100).toFixed(2);
  statsLabel.textContent = `detail ${detail} · weight ${weight}`;
  nameLabel.textContent = formatName(promptInput.value);

  codeOutput.textContent = [
    "const lumen = new LumenForge();",
    `const sketch = lumen.describe("${prompt}");`,
    `sketch.detail(${detail});`,
    `sketch.weight(${weight});`,
    "sketch.traceSpline({ steps: 5 });",
    "return sketch.commit();"
  ].join("\n");
}

[promptInput, detailRange, weightRange].forEach((input) => {
  input.addEventListener("input", buildCode);
});

draftButton.addEventListener("click", buildCode);

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
buildCode();
drawMinimalOrb();
