const panels = [
  {
    id: "flux-lab",
    title: "Flux Lab",
    description: "Neon laboratory where prompts crystallize into code and pulse visuals.",
    path: "../flux-lab/index.html"
  },
  {
    id: "retro-terminal",
    title: "Retro Synthesis Console",
    description: "CRT terminal spitting out voxel scripts and execution traces.",
    path: "../retro-terminal/index.html"
  },
  {
    id: "toy-forge",
    title: "Toy Forge Studio",
    description: "Playful workshop with sliders, flavor chips, and orbiting blobs.",
    path: "../toy-forge/index.html"
  },
  {
    id: "biome-holo",
    title: "Biome Holo Forge",
    description: "Holographic biodome with eco-script code and living pulse visuals.",
    path: "../biome-holo/index.html"
  },
  {
    id: "cyber-notebook",
    title: "Cyber Notebook Lab",
    description: "Scribble pad where doodles become margin spells and glitch ink.",
    path: "../cyber-notebook/index.html"
  },
  {
    id: "space-bridge",
    title: "Space Bridge Builder",
    description: "Starship command console sequencing orbit-tier fabrication.",
    path: "../space-bridge/index.html"
  },
  {
    id: "pixel-factory",
    title: "Pixel Factory",
    description: "Retro pixel workshop that bakes voxel recipes and palettes.",
    path: "../pixel-factory/index.html"
  },
  {
    id: "zen-garden",
    title: "Zen Garden Modeler",
    description: "Calm sand garden translating haiku prompts into garden scripts.",
    path: "../zen-garden/index.html"
  },
  {
    id: "hyper-scribble",
    title: "Hyper Scribble Synth",
    description: "Graffiti synth that sprays ideas into glitchy code riffs.",
    path: "../hyper-scribble/index.html"
  },
  {
    id: "clockwork-studio",
    title: "Clockwork Studio",
    description: "Steampunk atelier spinning gears and brass assembly code.",
    path: "../clockwork-studio/index.html"
  },
  {
    id: "lumen-minimal",
    title: "Lumen Minimal Studio",
    description: "Minimal monochrome layout with gentle motion and concise script output.",
    path: "../lumen-minimal/index.html"
  }
];

const panelList = document.getElementById("panelList");
const frame = document.getElementById("previewFrame");
const panelTitle = document.getElementById("panelTitle");
const panelBlurb = document.getElementById("panelBlurb");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let currentIndex = 0;

function renderPanelList() {
  panels.forEach((panel, index) => {
    const button = document.createElement("button");
    button.className = "panel-button";
    button.dataset.index = index;
    button.innerHTML = `<span>${panel.title}</span><span>${panel.description}</span>`;
    button.addEventListener("click", () => loadPanel(index));
    panelList.appendChild(button);
  });
}

function updateActiveButton() {
  document.querySelectorAll(".panel-button").forEach((button, index) => {
    button.classList.toggle("active", index === currentIndex);
  });
}

function loadPanel(index) {
  currentIndex = (index + panels.length) % panels.length;
  const panel = panels[currentIndex];
  frame.src = panel.path;
  panelTitle.textContent = panel.title;
  panelBlurb.textContent = panel.description;
  updateActiveButton();
}

function nextPanel(delta) {
  loadPanel(currentIndex + delta);
}

prevBtn.addEventListener("click", () => nextPanel(-1));
nextBtn.addEventListener("click", () => nextPanel(1));

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    nextPanel(1);
  } else if (event.key === "ArrowLeft") {
    nextPanel(-1);
  }
});

renderPanelList();
loadPanel(0);
