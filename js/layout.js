// Largura ajustavel das tres colunas, com limites e memoria no navegador.
const KEY = "elp-columns";
const LIMITS = { side: [240, 440], panel: [220, 420] };
const DEFAULTS = { side: 280, panel: 260 };
const BOARD_MIN = 520;
const SPLITTERS = 12;
const STEP = 16;
const WIDE = "(min-width: 1201px)";

const root = document.documentElement;
let widths = load();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    return { ...DEFAULTS, ...saved };
  } catch {
    return { ...DEFAULTS };
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(widths));
  } catch {}
}

// Aplica as larguras respeitando os limites e o espaco minimo do quadro.
function apply() {
  const room = window.innerWidth - BOARD_MIN - SPLITTERS;
  for (const col of ["side", "panel"]) {
    const [min, max] = LIMITS[col];
    const other = col === "side" ? widths.panel : widths.side;
    widths[col] = Math.round(Math.min(max, Math.max(min, Math.min(widths[col], room - other))));
  }
  root.style.setProperty("--side-w", `${widths.side}px`);
  root.style.setProperty("--panel-w", `${widths.panel}px`);
  for (const handle of document.querySelectorAll(".splitter")) {
    const col = handle.dataset.col;
    handle.setAttribute("aria-valuenow", widths[col]);
    handle.setAttribute("aria-valuemin", LIMITS[col][0]);
    handle.setAttribute("aria-valuemax", LIMITS[col][1]);
  }
}

function set(col, value) {
  widths[col] = value;
  apply();
  save();
}

function bind(handle) {
  const col = handle.dataset.col;
  handle.addEventListener("pointerdown", e => {
    if (!window.matchMedia(WIDE).matches) return;
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    document.body.classList.add("resizing");
    const move = ev => set(col, col === "side" ? ev.clientX : window.innerWidth - ev.clientX);
    const stop = () => {
      handle.removeEventListener("pointermove", move);
      document.body.classList.remove("resizing");
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", stop, { once: true });
    handle.addEventListener("pointercancel", stop, { once: true });
  });
  handle.addEventListener("keydown", e => {
    const grow = col === "side" ? "ArrowRight" : "ArrowLeft";
    const shrink = col === "side" ? "ArrowLeft" : "ArrowRight";
    if (e.key === grow) set(col, widths[col] + STEP);
    else if (e.key === shrink) set(col, widths[col] - STEP);
    else return;
    e.preventDefault();
  });
  handle.addEventListener("dblclick", () => set(col, DEFAULTS[col]));
}

export function initLayout() {
  document.querySelectorAll(".splitter").forEach(bind);
  window.addEventListener("resize", apply);
  apply();
}
