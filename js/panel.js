// Painel lateral com os numeros da estante.
import { api } from "./api.js";
import { el } from "./dom.js";
import { state } from "./state.js";

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

function renderProfile(p) {
  const root = $("profile");
  if (!p.books) {
    root.replaceChildren(el("p", { class: "muted" }, "Comece ou termine um livro para ver o seu perfil."));
    return;
  }
  root.replaceChildren(
    block("Gosta", "like",
      p.liked_authors.length
        ? el("ul", {}, p.liked_authors.map(a => el("li", {}, el("b", {}, a.author),
            el("span", {}, `${plural(a.books, "livro", "livros")} · ${num(a.avg_rating)}★`))))
        : el("p", { class: "muted" }, "Dê notas aos livros para descobrir seus autores preferidos."),
      p.liked_pages ? el("p", {}, `Suas melhores notas vão para livros de cerca de ${num(p.liked_pages)} páginas.`) : null),
    block("Evita", "avoid",
      p.disliked_authors.length
        ? el("ul", {}, p.disliked_authors.map(a => el("li", {}, el("b", {}, a.author), el("span", {}, avoidText(a)))))
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
