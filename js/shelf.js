// Estante agrupada por status.
import { api } from "./api.js";
import { cover, el } from "./dom.js";
import { run } from "./toast.js";
import { loadPanel } from "./panel.js";
import { renderResults } from "./search.js";

const GROUPS = [
  ["reading", "Lendo"],
  ["want", "Quero ler"],
  ["read", "Lido"],
  ["dropped", "Abandonado"],
];
const LABELS = Object.fromEntries(GROUPS);
const RATING_MAX = 5;

let books = [];

export function hasBook(olKey) {
  return books.some(b => b.ol_key === olKey);
}

// Recarrega estante, painel e resultados da busca.
export async function refresh() {
  const list = await run(() => api.list());
  if (list) books = list;
  render();
  renderResults();
  await loadPanel();
}

function render() {
  const root = document.getElementById("shelf");
  if (!books.length) {
    root.replaceChildren(el("p", { class: "empty" }, "A estante está vazia. Busque um livro para começar."));
    return;
  }
  root.replaceChildren(
    ...GROUPS.map(([status, label]) => {
      const group = books.filter(b => b.status === status);
      return el(
        "section",
        { class: `group ${status}` },
        el("h2", {}, label, el("span", { class: "count" }, group.length)),
        group.length ? el("ul", {}, group.map(card)) : el("p", { class: "none" }, "Nenhum livro."),
      );
    }),
  );
}

function card(b) {
  return el(
    "li",
    { class: "card" },
    el("input", {
      type: "checkbox",
      class: "tick",
      checked: b.status === "read",
      title: "Marcar como lido",
      "aria-label": `Marcar ${b.title} como lido`,
      onchange: e => update(b, { status: e.target.checked ? "read" : "reading" }),
    }),
    cover(b.cover_id, "M"),
    el(
      "div",
      { class: "body" },
      el("strong", {}, b.title),
      el("span", { class: "meta" }, [b.author, b.pages && `${b.pages} páginas`].filter(Boolean).join(" · ")),
      el("span", { class: "meta" }, dates(b)),
      el("div", { class: "row" }, statusSelect(b), stars(b)),
      comment(b),
    ),
    el(
      "button",
      { type: "button", class: "remove", title: "Remover da estante", "aria-label": `Remover ${b.title}`, onclick: () => remove(b) },
      "×",
    ),
  );
}

function statusSelect(b) {
  return el(
    "select",
    { "aria-label": "Status", onchange: e => update(b, { status: e.target.value }) },
    GROUPS.map(([value, label]) => el("option", { value, selected: value === b.status }, label)),
  );
}

function stars(b) {
  return el(
    "div",
    { class: "stars", role: "group", "aria-label": "Nota" },
    Array.from({ length: RATING_MAX }, (_, i) => {
      const n = i + 1;
      return el(
        "button",
        {
          type: "button",
          class: b.rating >= n ? "on" : "",
          title: b.rating === n ? "Remover nota" : `Nota ${n}`,
          onclick: () => update(b, { rating: b.rating === n ? null : n }),
        },
        "★",
      );
    }),
  );
}

function comment(b) {
  return el("textarea", {
    rows: 2,
    maxlength: 500,
    placeholder: "Comentário",
    "aria-label": "Comentário",
    onchange: e => update(b, { comment: e.target.value.trim() || null }, "Comentário salvo."),
  }, b.comment || "");
}

function dates(b) {
  const f = iso => new Date(iso).toLocaleDateString("pt-BR");
  const parts = [`Adicionado em ${f(b.added_at)}`];
  if (b.started_at) parts.push(`início ${f(b.started_at)}`);
  if (b.finished_at) parts.push(`${b.status === "dropped" ? "abandono" : "conclusão"} ${f(b.finished_at)}`);
  return parts.join(" · ");
}

async function update(b, data, done) {
  const text = done || (data.status ? `Movido para ${LABELS[data.status]}.` : "Nota salva.");
  const res = await run(() => api.update(b.id, data), { loading: "Salvando...", done: text });
  await refresh();
  return res;
}

async function remove(b) {
  if (!confirm(`Remover "${b.title}" da estante?`)) return;
  await run(() => api.remove(b.id), { loading: "Removendo...", done: "Livro removido." });
  await refresh();
}
