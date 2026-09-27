// Quadro da estante: listas por status, cartoes e ficha do livro.
import { api } from "./api.js";
import { cover, el } from "./dom.js";
import { icon } from "./icons.js";
import { LABEL, LISTS, fullDate, shortDate, state } from "./state.js";
import { run } from "./toast.js";

const $ = id => document.getElementById(id);
const RATING_MAX = 5;
let refresh = async () => {};
let openId = null;

export function initBoard(reload) {
  refresh = reload;
  $("shelf-filter").addEventListener("input", renderBoard);
  $("shelf-order").addEventListener("change", reload);
  $("detail").addEventListener("close", () => { openId = null; });
  $("detail").addEventListener("click", e => { if (e.target === $("detail")) $("detail").close(); });
}

export function order() {
  return $("shelf-order").value;
}

// ── Listas ──
export function renderBoard() {
  const text = $("shelf-filter").value.trim().toLowerCase();
  const visible = state.books.filter(b => `${b.title} ${b.author || ""}`.toLowerCase().includes(text));
  $("board").replaceChildren(...LISTS.map(([status, label]) => list(status, label, visible.filter(b => b.status === status))));
  if (openId) renderDetail();
}

function list(status, label, books) {
  const cards = el("div", { class: "cards" }, books.map(card));
  const node = el("section", { class: `list ${status}`, "aria-label": label },
    el("h2", {}, label, el("span", { class: "count" }, books.length)),
    cards,
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

function card(b) {
  const node = el("article", { class: "card", draggable: "true", tabindex: "0", "aria-label": `${b.title}, ${LABEL[b.status]}` },
    b.cover_id ? cover(b.cover_id, "M") : null,
    el("div", { class: "card-body" },
      el("span", { class: `label ${b.status}`, title: LABEL[b.status] }),
      el("h3", {}, b.title),
      el("div", { class: "badges" }, badges(b))));
  node.addEventListener("click", () => openDetail(b.id));
  node.addEventListener("keydown", e => { if (e.key === "Enter") openDetail(b.id); });
  node.addEventListener("dragstart", e => { e.dataTransfer.setData("text/plain", String(b.id)); node.classList.add("drag"); });
  node.addEventListener("dragend", () => node.classList.remove("drag"));
  return node;
}

function badges(b) {
  const items = [];
  if (b.rating) items.push(el("span", { class: "badge rating", title: `Nota ${b.rating}` }, icon("star"), b.rating));
  if (b.comment) items.push(el("span", { class: "badge", title: "Tem comentário" }, icon("comment")));
  const date = b.finished_at || b.started_at;
  if (date) items.push(el("span", { class: `badge date ${b.status}`, title: b.status === "dropped" ? "Abandono" : b.finished_at ? "Conclusão" : "Início" }, icon("clock"), shortDate(date)));
  if (b.pages) items.push(el("span", { class: "badge", title: "Páginas" }, icon("pages"), b.pages));
  if (b.author) items.push(el("span", { class: "author" }, b.author));
  return items;
}

// ── Ficha do livro ──
function openDetail(id) {
  openId = id;
  renderDetail();
  if (!$("detail").open) $("detail").showModal();
}

function renderDetail() {
  const b = state.books.find(x => x.id === openId);
  const dialog = $("detail");
  if (!b) {
    if (dialog.open) dialog.close();
    return;
  }
  dialog.replaceChildren(
    el("button", { type: "button", class: "close", "aria-label": "Fechar", onclick: () => dialog.close() }, "×"),
    el("div", { class: "detail-grid" },
      cover(b.cover_id, "M"),
      el("div", {},
        el("h2", { id: "detail-title" }, b.title),
        el("p", { class: "meta" }, [b.author, b.pages && `${b.pages} páginas`].filter(Boolean).join(" · ")),
        el("label", { class: "field" }, "Status",
          el("select", { onchange: e => update(b, { status: e.target.value }) },
            LISTS.map(([v, l]) => el("option", { value: v, selected: v === b.status }, l)))),
        el("div", { class: "field" }, "Nota", stars(b)),
        el("label", { class: "field" }, "Comentário",
          el("textarea", { rows: 4, maxlength: 500, placeholder: "O que achou do livro?",
            onchange: e => update(b, { comment: e.target.value.trim() || null }, "Comentário salvo.") }, b.comment || "")),
        el("dl", { class: "dates" },
          el("dt", {}, "Adicionado"), el("dd", {}, fullDate(b.added_at)),
          b.started_at ? [el("dt", {}, "Início"), el("dd", {}, fullDate(b.started_at))] : null,
          b.finished_at ? [el("dt", {}, b.status === "dropped" ? "Abandono" : "Conclusão"), el("dd", {}, fullDate(b.finished_at))] : null),
        el("button", { type: "button", class: "remove", onclick: () => remove(b) }, "Remover da estante"))));
}

function stars(b) {
  return el("div", { class: "stars", role: "group", "aria-label": "Nota" },
    Array.from({ length: RATING_MAX }, (_, i) => {
      const n = i + 1;
      return el("button", { type: "button", class: b.rating >= n ? "on" : "", title: b.rating === n ? "Remover nota" : `Nota ${n}`,
        onclick: () => update(b, { rating: b.rating === n ? null : n }) }, icon("star"));
    }));
}

async function update(b, data, done) {
  const text = done || (data.status ? `Movido para ${LABEL[data.status]}.` : "Nota salva.");
  await run(() => api.update(b.id, data), { loading: "Salvando...", done: text });
  await refresh();
}

async function remove(b) {
  if (!confirm(`Remover "${b.title}" da estante?`)) return;
  await run(() => api.remove(b.id), { loading: "Removendo...", done: "Livro removido." });
  $("detail").close();
  await refresh();
}
