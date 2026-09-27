// Busca na Open Library, com filtros, e adicao a estante.
import { api } from "./api.js";
import { cover, el } from "./dom.js";
import { hasBook } from "./state.js";
import { run, show } from "./toast.js";

const $ = id => document.getElementById(id);
let hits = [];
let onAdd = async () => {};

export function initSearch(afterAdd) {
  onAdd = afterAdd;
  $("search-form").addEventListener("submit", e => {
    e.preventDefault();
    search();
  });
  for (const id of ["search-field", "search-language", "search-sort"]) {
    $(id).addEventListener("change", () => $("search-q").value.trim().length >= 2 && search());
  }
}

async function search() {
  const q = $("search-q").value.trim();
  if (q.length < 2) return show("Digite ao menos 2 caracteres.", "error");
  const filters = { field: $("search-field").value, language: $("search-language").value, sort: $("search-sort").value };
  const res = await run(() => api.search(q, filters), { loading: "Buscando na Open Library..." });
  if (!res) return;
  hits = res;
  renderResults(true);
}

export function renderResults(searched = false) {
  $("results-info").textContent = hits.length ? `${hits.length} resultado(s)` : searched ? "Nenhum livro encontrado." : "";
  $("results").replaceChildren(...hits.map(h => {
    const added = hasBook(h.ol_key);
    return el("li", { class: "row" },
      cover(h.cover_id, "S"),
      el("div", {},
        el("strong", {}, h.title),
        el("small", {}, [h.author, h.pages && `${h.pages} p.`].filter(Boolean).join(" · ")),
        added ? el("span", { class: "in" }, "Na estante")
          : el("button", { type: "button", class: "add", onclick: () => add(h) }, "+ Adicionar")));
  }));
}

async function add(hit) {
  const book = await run(() => api.add(hit), { loading: "Adicionando...", done: "Livro adicionado em Quero ler." });
  if (book) await onAdd();
}
