const input = document.getElementById("objectInput");
const codeOutput = document.getElementById("codeOutput");
const presets = document.querySelectorAll(".presets button");
const styleRadios = document.querySelectorAll('input[name="style"]');
const canvas = document.getElementById("previewCanvas");

const ctx = canvas.getContext("2d");
const colors = ["#6cf7ef", "#92a5ff", "#ff8df2"];
let tick = 0;

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * ratio;
  canvas.height = canvas.clientHeight * ratio;
  ctx.scale(ratio, ratio);
}

function renderPulse() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  const centerX = w / 2;
  const centerY = h / 2;
  const maxRadius = Math.min(w, h) * 0.35;

  for (let i = 0; i < 4; i += 1) {
    const offset = (tick * 0.02 + i * 0.8) % (Math.PI * 2);
    const radius = maxRadius * (0.4 + 0.3 * Math.sin(offset));
    const color = colors[i % colors.length];
    ctx.beginPath();
    ctx.strokeStyle = `${color}${Math.floor(120 - i * 12).toString(16)}`;
    ctx.lineWidth = 4 - i;
    ctx.setLineDash([6 + i * 2, 16]);
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  tick += 1;
  requestAnimationFrame(renderPulse);
}

function buildCodeSnippet(prompt, style) {
  const preamble = `// Flux Lab generative pipeline
const scene = new FluxScene();
const generator = scene.materialize("${prompt}");`;

  const body = {
    parametric: [
      "generator.shape(",
      "  pulseWave({ frequency: 0.42, turbulence: 1.8 }),",
      "  loftCurves({ count: 18, eccentricity: 0.22 })",
      ");",
      "generator.material.chromaticDispersion(0.67);",
      "generator.export.stl({ quality: 'fusion' });"
    ],
    voxel: [
      "generator.voxelCloud({",
      "  resolution: 96,",
      "  emission: spectrumGradient('#66f','#0ff','#faf'),",
      "  densityField: noise.hyper({ scale: 0.18 })",
      "});",
      "generator.optimize.lattice({ iterations: 24 });",
      "generator.export.vox();"
    ],
    organic: [
      "generator.meshGrow({",
      "  seed: auralSeed(432),",
      "  tendrils: 12,",
      "  membraneGlow: true",
      "});",
      "generator.material.subsurface({ hue: 188, scatter: 0.34 });",
      "generator.export.obj({ triangulate: false });"
    ]
  };

  return `${preamble}\n${body[style].join("\n")}`;
}

function reflectCode() {
  const prompt = input.value.trim() || "an undefined marvel";
  const style = [...styleRadios].find((radio) => radio.checked)?.value ?? "parametric";
  codeOutput.textContent = buildCodeSnippet(prompt, style);
}

presets.forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.dataset.prompt;
    reflectCode();
  });
});

styleRadios.forEach((radio) => radio.addEventListener("change", reflectCode));
input.addEventListener("input", reflectCode);

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
reflectCode();
renderPulse();
