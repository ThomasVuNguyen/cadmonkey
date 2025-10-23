const canvas = document.getElementById("scribbleCanvas");
const ctx = canvas.getContext("2d");
const promptInput = document.getElementById("scribblePrompt");
const colorButtons = document.querySelectorAll(".spray-controls button");
const tempoKnob = document.getElementById("tempoKnob");
const noiseKnob = document.getElementById("noiseKnob");
const glitchKnob = document.getElementById("glitchKnob");
const riffBtn = document.getElementById("riffBtn");
const codeOutput = document.getElementById("scribbleCode");

let drawing = false;
let sprayColor = "#ff4f70";
let spraySize = 20;

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  ctx.fillStyle = "#090912";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function sprayPaint(x, y) {
  const density = 40;
  for (let i = 0; i < density; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * spraySize;
    const offsetX = Math.cos(angle) * radius;
    const offsetY = Math.sin(angle) * radius;
    ctx.fillStyle = sprayColor;
    ctx.globalAlpha = Math.random() * 0.75 + 0.25;
    ctx.fillRect(x + offsetX, y + offsetY, 2, 2);
  }
  ctx.globalAlpha = 1;
}

canvas.addEventListener("pointerdown", (event) => {
  drawing = true;
  sprayPaint(event.offsetX, event.offsetY);
});

canvas.addEventListener("pointermove", (event) => {
  if (!drawing) return;
  sprayPaint(event.offsetX, event.offsetY);
});

canvas.addEventListener("pointerup", () => {
  drawing = false;
});

canvas.addEventListener("pointerleave", () => {
  drawing = false;
});

canvas.addEventListener("dblclick", () => {
  ctx.fillStyle = "#090912";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
});

colorButtons.forEach((button) => {
  button.style.background = button.dataset.color;
  button.addEventListener("click", () => {
    colorButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    sprayColor = button.dataset.color;
  });
});

function buildCode() {
  const prompt = (promptInput.value.trim() || "neon koi hoverboard").replace(/"/g, '\\"');
  const tempo = tempoKnob.value;
  const noise = (Number(noiseKnob.value) / 100).toFixed(2);
  const glitch = (Number(glitchKnob.value) / 100).toFixed(2);

  codeOutput.textContent = [
    "const synth = new ScribbleSynth();",
    `synth.prompt("${prompt}");`,
    `synth.tempo(${tempo});`,
    `synth.noise(${noise});`,
    `synth.glitch(${glitch});`,
    `synth.spray("${sprayColor}");`,
    "synth.drop();"
  ].join("\n");
}

[promptInput, tempoKnob, noiseKnob, glitchKnob].forEach((input) => {
  input.addEventListener("input", buildCode);
});

riffBtn.addEventListener("click", buildCode);

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
buildCode();
