// Ficha do livro em janela: status, nota, datas, comentario e remocao.
import { api } from "./api.js";
import { cover, el } from "./dom.js";
import { icon } from "./icons.js";
import { LABEL, LISTS, state } from "./state.js";
import { run } from "./toast.js";

const $ = id => document.getElementById(id);
const RATING_MAX = 5;
let refresh = async () => {};
let openId = null;

export function initSheet(reload) {
  refresh = reload;
  const sheet = $("sheet");
  sheet.addEventListener("close", () => { openId = null; });
  sheet.addEventListener("click", e => { if (e.target === sheet) sheet.close(); });
}

export function openSheet(id, focus) {
  openId = id;
  renderSheet();
  const sheet = $("sheet");
  if (!sheet.open) sheet.showModal();
  if (focus) sheet.querySelector(focus)?.focus();
}

export function renderSheet() {
  const sheet = $("sheet");
  const b = state.books.find(x => x.id === openId);
  if (!b) {
    if (sheet.open) sheet.close();
    return;
  }
  sheet.replaceChildren(
    el("header", { class: "sheet-head" },
      cover(b.cover_id, "M"),
      el("div", {},
        el("h2", { id: "sheet-title" }, b.title),
        el("p", {}, [b.author, b.pages && `${b.pages} páginas`].filter(Boolean).join(" · ")),
        el("p", {}, `Adicionado em ${toDay(b.added_at).split("-").reverse().join("/")}`)),
      el("button", { type: "button", class: "close", "aria-label": "Fechar", onclick: () => sheet.close() }, "×")),
    section("Status", el("div", { class: "seg", role: "group", "aria-label": "Status" }, LISTS.map(([v, l]) =>
      el("button", { type: "button", "aria-pressed": String(v === b.status), onclick: () => v !== b.status && update(b, { status: v }) }, l)))),
    section("Nota", stars(b)),
    section("Datas da leitura", dates(b)),
    section("Comentário", comment(b)),
    el("footer", { class: "sheet-foot" },
      el("button", { type: "button", class: "remove", onclick: () => remove(b) }, icon("trash"), "Remover da estante")));
}

function section(title, body) {
  return el("section", { class: "sheet-sec" }, el("h3", {}, title), body);
}

function stars(b) {
  return el("div", { class: "sheet-stars", role: "group", "aria-label": "Nota" },
    Array.from({ length: RATING_MAX }, (_, i) => {
      const n = i + 1;
      return el("button", { type: "button", class: b.rating >= n ? "on" : "", title: b.rating === n ? "Remover nota" : `Nota ${n}`,
        onclick: () => update(b, { rating: b.rating === n ? null : n }) }, "★");
    }));
}

// Campos de data liberados conforme o status do livro.
function dates(b) {
  const today = toDay(new Date().toISOString());
  const endLabel = b.status === "dropped" ? "Abandono" : "Conclusão";
  const field = (label, key, enabled) => el("label", { class: "date" }, label,
    el("input", { type: "date", value: b[key] ? toDay(b[key]) : "", max: today, disabled: !enabled,
      onchange: e => update(b, { [key]: e.target.value || null }, "Data salva.") }));
  const hint = { want: "Mova o livro para Lendo para registrar o início.", reading: "A conclusão é registrada ao mover para Lido ou Abandonado." }[b.status];
  return el("div", {},
    el("div", { class: "dates" },
      field("Início", "started_at", b.status !== "want"),
      field(endLabel, "finished_at", b.status === "read" || b.status === "dropped")),
    hint ? el("p", { class: "hint" }, hint) : null);
}

function comment(b) {
  const area = el("textarea", { id: "sheet-comment", rows: 5, maxlength: 500, placeholder: "O que achou do livro?", "aria-label": "Comentário" }, b.comment || "");
  const count = el("span", { class: "hint" }, `${area.value.length}/500`);
  area.addEventListener("input", () => { count.textContent = `${area.value.length}/500`; });
  return el("div", { class: "comment" }, area,
    el("div", { class: "comment-foot" }, count,
      el("button", { type: "button", class: "save", onclick: () => update(b, { comment: area.value.trim() || null }, "Comentário salvo.") }, "Salvar comentário")));
}

// Data local no formato AAAA-MM-DD.
function toDay(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function update(b, data, done) {
  const text = done || (data.status ? `Movido para ${LABEL[data.status]}.` : "Nota salva.");
  await run(() => api.update(b.id, data), { loading: "Salvando...", done: text });
  await refresh();
}

async function remove(b) {
  if (!confirm(`Remover "${b.title}" da estante?`)) return;
  await run(() => api.remove(b.id), { loading: "Removendo...", done: "Livro removido." });
  $("sheet").close();
  await refresh();
}
