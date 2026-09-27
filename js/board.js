// Quadro da estante: uma lista por status, com cartoes que abrem a ficha lateral.
import { api } from "./api.js";
import { cover, el } from "./dom.js";
import { icon } from "./icons.js";
import { openSheet } from "./sheet.js";
import { LABEL, LISTS, shortDate, state } from "./state.js";
import { run } from "./toast.js";

const $ = id => document.getElementById(id);
const RATING_MAX = 5;
let refresh = async () => {};

export function initBoard(reload) {
  refresh = reload;
  $("shelf-filter").addEventListener("input", renderBoard);
  $("shelf-order").addEventListener("change", reload);
}

export function order() {
  return $("shelf-order").value;
}

// ── Listas ──
export function renderBoard() {
  const text = $("shelf-filter").value.trim().toLowerCase();
  const visible = state.books.filter(b => `${b.title} ${b.author || ""}`.toLowerCase().includes(text));
  $("board").replaceChildren(...LISTS.map(([status, label]) => list(status, label, visible.filter(b => b.status === status))));
}

function list(status, label, books) {
  const node = el("section", { class: `list ${status}`, "aria-label": label },
    el("h2", {}, label, el("span", { class: "count" }, books.length)),
    el("div", { class: "cards" }, books.length ? books.map(card) : el("p", { class: "empty" }, "Arraste um livro para cá")),
    status === "want" ? el("button", { type: "button", class: "add-card", onclick: () => $("search-q").focus() }, icon("plus"), "Adicionar livro") : null);
  node.addEventListener("dragover", e => { e.preventDefault(); node.classList.add("over"); });
  node.addEventListener("dragleave", e => { if (!node.contains(e.relatedTarget)) node.classList.remove("over"); });
  node.addEventListener("drop", e => {
    e.preventDefault();
    node.classList.remove("over");
    const b = state.books.find(x => String(x.id) === e.dataTransfer.getData("text/plain"));
    if (b && b.status !== status) update(b, { status });
  });
  return node;
}

// ── Cartao ──
function card(b) {
  const i = LISTS.findIndex(([s]) => s === b.status);
  const node = el("article", { class: "card", draggable: "true", tabindex: "0", "aria-label": `${b.title}. Abrir ficha` },
    cover(b.cover_id, "S"),
    el("div", { class: "card-body" },
      el("h3", {}, b.title),
      el("small", {}, b.author || ""),
      stars(b)),
    el("button", { type: "button", class: "x", title: "Remover da estante", "aria-label": `Remover ${b.title}`, onclick: () => remove(b) }, "×"),
    el("div", { class: "mv" },
      el("button", { type: "button", disabled: i === 0, title: i > 0 ? `Mover para ${LISTS[i - 1][1]}` : "", "aria-label": "Mover para a lista anterior",
        onclick: () => update(b, { status: LISTS[i - 1][0] }) }, "←"),
      el("button", { type: "button", class: "cm", onclick: () => openSheet(b.id, "#sheet-comment") }, b.comment ? "Comentário" : "Comentar"),
      el("span", { title: dateTitle(b) }, shortDate(b.finished_at || b.started_at || b.added_at)),
      el("button", { type: "button", disabled: i === LISTS.length - 1, title: i < LISTS.length - 1 ? `Mover para ${LISTS[i + 1][1]}` : "", "aria-label": "Mover para a próxima lista",
        onclick: () => update(b, { status: LISTS[i + 1][0] }) }, "→")));
  // Clique fora dos controles abre a ficha lateral.
  node.addEventListener("click", e => { if (!e.target.closest("button")) openSheet(b.id); });
  node.addEventListener("keydown", e => { if (e.key === "Enter" && e.target === node) openSheet(b.id); });
  node.addEventListener("dragstart", e => { e.dataTransfer.setData("text/plain", String(b.id)); node.classList.add("drag"); });
  node.addEventListener("dragend", () => node.classList.remove("drag"));
  return node;
}

function stars(b) {
  return el("div", { class: "stars", role: "group", "aria-label": "Nota" },
    Array.from({ length: RATING_MAX }, (_, i) => {
      const n = i + 1;
      return el("button", { type: "button", class: b.rating >= n ? "on" : "", title: b.rating === n ? "Remover nota" : `Nota ${n}`,
        onclick: () => update(b, { rating: b.rating === n ? null : n }) }, "★");
    }));
}

function dateTitle(b) {
  if (b.finished_at) return b.status === "dropped" ? "Data do abandono" : "Data da conclusão";
  return b.started_at ? "Data de início" : "Data em que foi adicionado";
}

async function update(b, data, done) {
  const text = done || (data.status ? `Movido para ${LABEL[data.status]}.` : "Nota salva.");
  await run(() => api.update(b.id, data), { loading: "Salvando...", done: text });
  await refresh();
}

async function remove(b) {
  if (!confirm(`Remover "${b.title}" da estante?`)) return;
  await run(() => api.remove(b.id), { loading: "Removendo...", done: "Livro removido." });
  await refresh();
}
