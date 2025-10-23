const promptInput = document.getElementById("zenPrompt");
const rakeRange = document.getElementById("rakeRange");
const windButtons = document.querySelectorAll(".wind-select button");
const meditateBtn = document.getElementById("meditateBtn");
const codeOutput = document.getElementById("zenCode");
const poemBox = document.getElementById("zenPoem");
const canvas = document.getElementById("zenCanvas");
const ctx = canvas.getContext("2d");

let windDirection = "north";
let rippleOffset = 0;

const seasonalWords = ["breeze", "moss", "moonlight", "ripple", "ember", "echo"];

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * ratio;
  canvas.height = canvas.clientHeight * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawGarden() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  ctx.fillStyle = "#f5ebd3";
  ctx.fillRect(0, 0, w, h);

  const spacing = 16 - (Number(rakeRange.value) / 12);
  ctx.strokeStyle = "#d3c2a0";
  ctx.lineWidth = 2;
  const angle = {
    north: 0,
    east: Math.PI / 2,
    south: 0,
    west: Math.PI / 2
  }[windDirection];

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(angle);

  for (let y = -h; y < h; y += spacing) {
    ctx.beginPath();
    for (let x = -w; x < w; x += 12) {
      const offset = Math.sin((x + rippleOffset) * 0.05 + y * 0.03) * 4;
      ctx.lineTo(x, y + offset);
    }
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = "#c5b08c";
  drawStone(w * 0.3, h * 0.5, 80, 50);
  drawStone(w * 0.65, h * 0.35, 60, 38);
  drawStone(w * 0.55, h * 0.7, 50, 32);

  rippleOffset += 1;
  requestAnimationFrame(drawGarden);
}

function drawStone(x, y, width, height) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, 0.7);
  ctx.beginPath();
  ctx.fillStyle = "#c0ac88";
  ctx.shadowColor = "rgba(0,0,0,0.15)";
  ctx.shadowBlur = 16;
  ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function buildCode() {
  const prompt = (promptInput.value.trim() || "stone turtle above ripples").replace(/"/g, '\\"');
  codeOutput.textContent = [
    "const garden = new ZenGarden();",
    `garden.describe("${prompt}");`,
    `garden.rake(${(Number(rakeRange.value) / 100).toFixed(2)});`,
    `garden.wind("${windDirection}");`,
    "garden.placeStone({ count: 3, calm: true });",
    "garden.renderRipples();"
  ].join("\n");
}

function buildPoem() {
  const promptWords = promptInput.value.trim().split(/\s+/).filter(Boolean);
  const word = promptWords[0] || "stone";
  const lines = [
    `${word} remembers`,
    `${seasonalWords[Math.floor(Math.random() * seasonalWords.length)]} patterns`,
    "sand breath listening"
  ];
  poemBox.textContent = lines.join("\n");
}

promptInput.addEventListener("input", () => {
  buildCode();
  buildPoem();
});

rakeRange.addEventListener("input", buildCode);

windButtons.forEach((button) => {
  button.addEventListener("click", () => {
    windButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    windDirection = button.dataset.wind;
    buildCode();
  });
});

meditateBtn.addEventListener("click", () => {
  buildPoem();
  buildCode();
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
buildCode();
buildPoem();
drawGarden();
