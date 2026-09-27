// Busca na Open Library, com filtros, e adicao a estante.
import { api } from "./api.js";
import { cover, el } from "./dom.js";
import { run, show } from "./toast.js";
import { hasBook, refresh } from "./shelf.js";

let hits = [];

export function initSearch() {
  const form = document.getElementById("search-form");
  form.addEventListener("submit", e => {
    e.preventDefault();
    search();
  });
  for (const id of ["search-field", "search-language", "search-sort"]) {
    document.getElementById(id).addEventListener("change", () => {
      if (document.getElementById("search-q").value.trim().length >= 2) search();
    });
  }
  renderResults();
}

async function search() {
  const q = document.getElementById("search-q").value.trim();
  if (q.length < 2) return show("Digite ao menos 2 caracteres.", "error");
  const filters = {
    field: document.getElementById("search-field").value,
    language: document.getElementById("search-language").value,
    sort: document.getElementById("search-sort").value,
  };
  const res = await run(() => api.search(q, filters), { loading: "Buscando na Open Library..." });
  if (!res) return;
  hits = res;
  renderResults(true);
}

export function renderResults(searched = false) {
  const info = document.getElementById("results-info");
  const list = document.getElementById("results");
  if (searched || hits.length) {
    info.textContent = hits.length ? `${hits.length} resultado(s)` : "Nenhum livro encontrado.";
  } else {
    info.textContent = "Busque um livro para adicionar à estante.";
  }
  list.replaceChildren(...hits.map(item));
}

function item(hit) {
  const added = hasBook(hit.ol_key);
  return el(
    "li",
    { class: "hit" },
    cover(hit.cover_id, "M"),
    el(
      "div",
      { class: "info" },
      el("strong", {}, hit.title),
      el("span", {}, hit.author || "Autor desconhecido"),
      hit.pages ? el("span", {}, `${hit.pages} páginas`) : null,
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
