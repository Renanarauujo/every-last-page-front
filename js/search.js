// Busca na Open Library, com filtros, e adicao a estante.
import { api } from "./api.js";
import { cover, el } from "./dom.js";
import { icon } from "./icons.js";
import { hasBook } from "./state.js";
import { run, show } from "./toast.js";

const $ = id => document.getElementById(id);
const MIN_LENGTH = 2;
const CACHE_SIZE = 50;

let hits = [];
let onAdd = async () => {};
let controller = null;
let lastKey = "";
const cache = new Map();

export function initSearch(afterAdd) {
  onAdd = afterAdd;
  $("search-btn").replaceChildren(icon("search"), "Pesquisar");
  $("search-form").addEventListener("submit", e => {
    e.preventDefault();
    search(true);
  });
  // Troca de filtro refaz a busca apenas se ja houver uma feita.
  for (const id of ["search-field", "search-language", "search-sort"]) {
    $(id).addEventListener("change", () => lastKey && search(true));
  }
}

// Busca pelo botao ou Enter, cancelando a busca anterior ainda em andamento.
async function search(force = false) {
  const q = $("search-q").value.trim();
  if (q.length < MIN_LENGTH) return show("Digite ao menos 2 caracteres.", "error");
  const filters = { field: $("search-field").value, language: $("search-language").value, sort: $("search-sort").value };
  const key = JSON.stringify([q.toLowerCase(), filters]);
  if (key === lastKey && !force) return;
  lastKey = key;
  if (cache.has(key)) {
    hits = cache.get(key);
    renderResults(true);
    return;
  }
  controller?.abort();
  const current = (controller = new AbortController());
  $("results-info").textContent = "Buscando...";
  try {
    const res = await api.search(q, filters, current.signal);
    if (current !== controller) return;
    remember(key, res);
    hits = res;
    renderResults(true);
  } catch (err) {
    if (err.name === "AbortError" || current !== controller) return;
    lastKey = "";
    $("results-info").textContent = err.message;
    show(err.message, "error");
  }
}

function remember(key, value) {
  cache.set(key, value);
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value);
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
