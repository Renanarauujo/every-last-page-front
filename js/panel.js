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
    return el("div", { class: "col", title: `${m.books} livro(s)` },
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
