const promptField = document.getElementById("pixelPrompt");
const canvas = document.getElementById("pixelCanvas");
const ctx = canvas.getContext("2d");
const paletteContainer = document.getElementById("swatches");
const bakeButton = document.getElementById("pixelBake");
const codeOutput = document.getElementById("pixelCode");
const spriteName = document.getElementById("spriteName");
const spriteMood = document.getElementById("spriteMood");

const palettes = [
  ["#ff48c4", "#ffe448", "#2bd1fc", "#ff3f3f", "#9c1aff", "#3b1f63"],
  ["#ff759a", "#ffb86f", "#fff58e", "#a8ffda", "#7bd3f7", "#43346d"],
  ["#ff6b6b", "#ffb8b8", "#f0ffa6", "#baf8a3", "#36c9c6", "#2f2b40"]
];

const moods = ["heroic", "grumpy", "curious", "stealthy", "legendary", "sparkly"];
let paletteIndex = 0;

function drawPixelArt() {
  ctx.fillStyle = "#140525";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const palette = palettes[paletteIndex];
  const size = 12;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (Math.random() < 0.45) continue;
      const color = palette[(x + y) % palette.length];
      ctx.fillStyle = color;
      ctx.fillRect(x * 20, y * 20, 20, 20);
    }
  }
}

function renderPalette() {
  paletteContainer.innerHTML = "";
  palettes[paletteIndex].forEach((color, index) => {
    const button = document.createElement("button");
    button.style.background = color;
    button.addEventListener("click", () => {
      paletteIndex = (paletteIndex + 1) % palettes.length;
      renderPalette();
      drawPixelArt();
      updateCode();
    });
    if (index === 0) button.classList.add("is-active");
    paletteContainer.appendChild(button);
  });
}

function updateCode() {
  const prompt = (promptField.value.trim() || "galactic rubber duck").replace(/"/g, '\\"');
  const palette = palettes[paletteIndex];

  codeOutput.textContent = [
    "const factory = new PixelFactory({",
    `  prompt: "${prompt}",`,
    `  palette: [${palette.map((color) => `"${color}"`).join(", ")}]`,
    "});",
    "factory.build({",
    `  resolution: 12,`,
    `  jitter: ${(Math.random() * 0.5).toFixed(2)},`,
    `  mood: "${spriteMood.textContent.split(": ")[1]}"`,
    "});",
    "factory.exportVoxel();"
  ].join("\n");
}

function updateSpriteInfo() {
  const prompt = promptField.value.trim();
  const nameBase = prompt ? prompt.split(" ")[0] : "Duck";
  const suffix = Math.floor(Math.random() * 90).toString().padStart(2, "0");
  spriteName.textContent = `${nameBase.charAt(0).toUpperCase() + nameBase.slice(1)}-${suffix}`;
  spriteMood.textContent = `mood: ${moods[Math.floor(Math.random() * moods.length)]}`;
}

promptField.addEventListener("input", () => {
  updateSpriteInfo();
  updateCode();
});

bakeButton.addEventListener("click", () => {
  drawPixelArt();
  updateSpriteInfo();
  updateCode();
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    paletteIndex = (paletteIndex + 1) % palettes.length;
    renderPalette();
    drawPixelArt();
    updateCode();
  }
});

renderPalette();
drawPixelArt();
updateSpriteInfo();
updateCode();
