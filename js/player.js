// Player do YouTube pelo dominio youtube-nocookie.
import { el } from "./dom.js";
import { show } from "./toast.js";

const KEY = "elp-video";
const ID_RE = /^[A-Za-z0-9_-]{11}$/;

// Extrai o id de 11 caracteres de um link ou de um id informado.
export function videoId(input) {
  const text = input.trim();
  if (ID_RE.test(text)) return text;
  let url;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  let id = null;
  if (host === "youtu.be") id = url.pathname.slice(1);
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id = url.searchParams.get("v") || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1];
  }
  return id && ID_RE.test(id) ? id : null;
}

function mount(id) {
  const box = document.getElementById("player");
  box.replaceChildren(
    el("iframe", {
      src: `https://www.youtube-nocookie.com/embed/${id}`,
      title: "Vídeo do YouTube",
      allow: "autoplay; encrypted-media; picture-in-picture",
      referrerpolicy: "strict-origin-when-cross-origin",
      allowfullscreen: true,
    }),
  );
}

export function initPlayer() {
  const form = document.getElementById("video-form");
  const input = document.getElementById("video-url");
  form.addEventListener("submit", e => {
    e.preventDefault();
    const id = videoId(input.value);
    if (!id) return show("Link do YouTube inválido.", "error");
    mount(id);
    input.value = "";
    try { localStorage.setItem(KEY, id); } catch {}
  });
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && ID_RE.test(saved)) mount(saved);
  } catch {}
}
