// Painel lateral com os numeros da estante.
import { api } from "./api.js";
import { el } from "./dom.js";
import { GENRE, state } from "./state.js";

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const RATING_MAX = 5;
const $ = id => document.getElementById(id);

export async function loadPanel() {
  let d;
  try {
    d = await api.summary();
  } catch {
    return;
  }
  renderStats(d);
  renderMonths(d.by_month);
  renderRatings();
  try {
    renderProfile(await api.insights());
  } catch {}
}

function renderStats(d) {
  const rows = [
    ["Na estante", d.total],
    ["Lendo", d.reading],
    ["Quero ler", d.want],
    ["Lidos", d.read],
    ["Abandonados", d.dropped],
    ["Páginas lidas", d.pages_read.toLocaleString("pt-BR")],
    ["Nota média", d.avg_rating === null ? "-" : d.avg_rating.toLocaleString("pt-BR")],
  ];
  $("stats").replaceChildren(...rows.flatMap(([label, value]) => [el("dt", {}, label), el("dd", {}, value)]));
}

function renderMonths(months) {
  const max = Math.max(1, ...months.map(m => m.books));
  $("months").replaceChildren(...months.map(m => {
    const bar = el("i", { class: m.books ? "" : "zero" });
    bar.style.height = `${m.books ? (m.books / max) * 100 : 3}%`;
    const now = m === months[months.length - 1];
    return el("div", { class: `col${now ? " now" : ""}`, title: `${m.books} livro(s)` },
      el("span", { class: "value" }, m.books || ""), bar, el("span", { class: "month" }, MONTHS[Number(m.month.slice(5)) - 1]));
  }));
}

// Distribuicao das notas, calculada a partir da estante carregada.
function renderRatings() {
  const counts = Array.from({ length: RATING_MAX }, (_, i) => state.books.filter(b => b.rating === i + 1).length);
  const max = Math.max(1, ...counts);
  $("ratings").replaceChildren(...counts.map((n, i) => i).reverse().map(i => {
    const bar = el("i");
    bar.style.width = `${(counts[i] / max) * 100}%`;
    return el("div", { class: "rrow" }, el("span", {}, `${i + 1}★`), el("div", { class: "track" }, bar), el("b", {}, counts[i]));
  }));
}

// ── Perfil de leitura ──
const num = n => n.toLocaleString("pt-BR");
const plural = (n, one, many) => `${num(n)} ${n === 1 ? one : many}`;

const BY_KEY = "elp-profile-by";
let profile = null;
let by = loadBy();

function loadBy() {
  try {
    return localStorage.getItem(BY_KEY) === "author" ? "author" : "genre";
  } catch {
    return "genre";
  }
}

$("profile-by").addEventListener("click", e => {
  const button = e.target.closest("[data-by]");
  if (!button) return;
  by = button.dataset.by;
  try { localStorage.setItem(BY_KEY, by); } catch {}
  if (profile) renderProfile(profile);
});

function renderProfile(p) {
  profile = p;
  for (const button of $("profile-by").children) button.setAttribute("aria-pressed", String(button.dataset.by === by));
  const root = $("profile");
  if (!p.books) {
    root.replaceChildren(el("p", { class: "muted" }, "Comece ou termine um livro para ver o seu perfil."));
    return;
  }
  const liked = by === "genre" ? p.liked_genres : p.liked_authors;
  const disliked = by === "genre" ? p.disliked_genres : p.disliked_authors;
  const name = item => (by === "genre" ? GENRE[item.genre] : item.author);
  root.replaceChildren(
    block("Gosta", "like",
      liked.length
        ? rank(liked.map(a => [name(a), `${plural(a.books, "livro", "livros")} · ${num(a.avg_rating)}★`]))
        : el("p", { class: "muted" }, by === "genre" ? "Dê notas aos livros para descobrir seus tipos preferidos." : "Dê notas aos livros para descobrir seus autores preferidos."),
      p.liked_pages ? el("p", {}, `Suas melhores notas vão para livros de cerca de ${num(p.liked_pages)} páginas.`) : null),
    block("Evita", "avoid",
      disliked.length
        ? rank(disliked.map(a => [name(a), avoidText(a)]))
        : el("p", { class: "muted" }, "Nenhum livro abandonado ou mal avaliado."),
      p.dropped_pages ? el("p", {}, `Os abandonados têm cerca de ${num(p.dropped_pages)} páginas.`) : null),
    block("Ritmo", "rhythm",
      el("div", { class: "pace" },
        figure(p.completion_rate === null ? "-" : `${p.completion_rate}%`, "do que começa, termina"),
        figure(p.avg_days === null ? "-" : num(p.avg_days), "dias por livro"),
        figure(p.pages_per_day === null ? "-" : num(Math.round(p.pages_per_day)), "páginas por dia"))),
    p.favorite ? el("p", { class: "fav" }, el("span", {}, "Favorito"), el("b", {}, p.favorite.title),
      p.favorite.author ? ` · ${p.favorite.author}` : "") : null);
}

// Ranking numerado, com ate tres posicoes.
function rank(rows) {
  return el("ol", { class: "rank" }, rows.map(([label, detail], i) =>
    el("li", {}, el("span", { class: `pos p${i + 1}` }, `${i + 1}º`), el("b", {}, label), el("span", { class: "detail" }, detail))));
}

function block(title, kind, ...children) {
  return el("div", { class: `pblock ${kind}` }, el("h4", {}, title), ...children);
}

function figure(value, label) {
  return el("div", {}, el("b", {}, value), el("span", {}, label));
}

function avoidText(a) {
  const parts = [];
  if (a.dropped) parts.push(plural(a.dropped, "abandonado", "abandonados"));
  if (a.low_rated) parts.push(plural(a.low_rated, "nota baixa", "notas baixas"));
  return parts.join(" · ");
}
