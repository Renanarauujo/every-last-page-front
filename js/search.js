// Busca na Open Library e adicao a estante.
import { api } from "./api.js";
import { cover, el } from "./dom.js";
import { run, show } from "./toast.js";
import { hasBook, refresh } from "./shelf.js";

let hits = [];

export function initSearch() {
  const form = document.getElementById("search-form");
  const input = document.getElementById("search-q");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const q = input.value.trim();
    if (q.length < 2) return show("Digite ao menos 2 caracteres.", "error");
    const res = await run(() => api.search(q), { loading: "Buscando na Open Library..." });
    if (!res) return;
    hits = res;
    if (!hits.length) show("Nenhum livro encontrado.", "info");
    renderResults();
  });
}

export function renderResults() {
  const list = document.getElementById("results");
  list.replaceChildren(...hits.map(hit => item(hit)));
  if (hits.length) {
    list.append(el("li", { class: "close" }, el("button", { type: "button", class: "link", onclick: clear }, "Fechar resultados")));
  }
}

function clear() {
  hits = [];
  renderResults();
}

function item(hit) {
  const added = hasBook(hit.ol_key);
  return el(
    "li",
    { class: "hit" },
    cover(hit.cover_id, "S"),
    el(
      "div",
      { class: "info" },
      el("strong", {}, hit.title),
      el("span", {}, [hit.author, hit.pages && `${hit.pages} páginas`].filter(Boolean).join(" · ")),
    ),
    el(
      "button",
      { type: "button", disabled: added, onclick: () => add(hit) },
      added ? "Na estante" : "Adicionar",
    ),
  );
}

async function add(hit) {
  const book = await run(() => api.add(hit), { loading: "Adicionando...", done: "Livro adicionado." });
  if (book) await refresh();
}
