const promptInput = document.getElementById("objectPrompt");
const logOutput = document.getElementById("logOutput");
const canvas = document.getElementById("waveCanvas");
const ctx = canvas.getContext("2d");
let frame = 0;
let altMode = false;

const operators = [
  "extrude",
  "voxelize",
  "loft",
  "fillet",
  "tesselate",
  "isolate",
  "smoothstep",
  "splineProject"
];

const altOperators = [
  "ritualize",
  "phaseShift",
  "synthwave",
  "hyperClone",
  "echoPaint",
  "rayGhost",
  "cyberBloom",
  "pulseWeld"
];

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * ratio;
  canvas.height = canvas.clientHeight * ratio;
  ctx.scale(ratio, ratio);
}

function renderWaves() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const lines = 26;

  for (let i = 0; i < lines; i += 1) {
    const y = (height / lines) * i;
    ctx.beginPath();
    for (let x = 0; x < width; x += 4) {
      const noise = Math.sin((x + frame * (altMode ? 3 : 2)) * 0.05 + i * 0.3);
      const offset = noise * (altMode ? 18 : 9);
      if (x === 0) {
        ctx.moveTo(x, y + offset);
      } else {
        ctx.lineTo(x, y + offset);
      }
    }
    ctx.strokeStyle = `rgba(120, 255, 126, ${0.22 + (i / lines) * 0.6})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  frame += 1;
  requestAnimationFrame(renderWaves);
}

function randomOperation() {
  const bank = altMode ? altOperators : operators;
  return bank[Math.floor(Math.random() * bank.length)];
}

function renderLog(prompt) {
  const timestamp = new Date().toISOString().split("T")[1].slice(0, 8);
  const opStack = Array.from({ length: 6 }, (_, index) => {
    const op = randomOperation();
    const parameter = (Math.random() * (altMode ? 8 : 3)).toFixed(2);
    const indent = " ".repeat(index * 2);
    return `${indent}${index === 0 ? "└──" : "├──"} ${op}(${parameter})`;
  }).join("\n");

  const script = [
    `[${timestamp}] compiling "${prompt}"`,
    "fn fabricate(prompt) {",
    `  let mesh = seed("${prompt.replace(/"/g, '\\"')}");`,
    `  mesh.${randomOperation()}(${(Math.random() * 3).toFixed(2)});`,
    "  mesh.sampleNoise(perlin(0.42));",
    "  mesh.retopo(katana(12));",
    "  return mesh;",
    "}",
    "",
    "execution trace:",
    opStack
  ];

  logOutput.textContent = script.join("\n");
}

promptInput.addEventListener("input", () => {
  const prompt = promptInput.value.trim() || "mystery artifact";
  renderLog(prompt);
});

promptInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.shiftKey) {
    renderLog(promptInput.value.trim() || "mystery artifact");
  }
});

window.addEventListener("keydown", (event) => {
  if (event.altKey) altMode = true;
});

window.addEventListener("keyup", (event) => {
  if (!event.altKey) altMode = false;
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
renderLog("duck");
renderWaves();
