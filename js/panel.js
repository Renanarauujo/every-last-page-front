// Painel com os numeros da estante.
import { api } from "./api.js";
import { el } from "./dom.js";

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export async function loadPanel() {
  let data;
  try {
    data = await api.summary();
  } catch {
    return;
  }
  renderStats(data);
  renderChart(data.by_month);
}

function renderStats(d) {
  const tiles = [
    ["Lendo", d.reading],
    ["Quero ler", d.want],
    ["Lidos", d.read],
    ["Abandonados", d.dropped],
    ["Páginas lidas", d.pages_read.toLocaleString("pt-BR")],
    ["Nota média", d.avg_rating === null ? "-" : d.avg_rating.toLocaleString("pt-BR")],
  ];
  document.getElementById("stats").replaceChildren(
    ...tiles.map(([label, value]) => el("div", { class: "stat" }, el("b", {}, value), el("span", {}, label))),
  );
}

function renderChart(months) {
  const max = Math.max(1, ...months.map(m => m.books));
  document.getElementById("chart").replaceChildren(
    ...months.map(m => {
      const [year, month] = m.month.split("-");
      const label = MONTHS[Number(month) - 1];
      const bar = el("div", { class: "bar" });
      bar.style.height = `${(m.books / max) * 100}%`;
      return el(
        "div",
        { class: "col", title: `${label}/${year}: ${m.books} livro(s)` },
        el("span", { class: "value" }, m.books || ""),
        bar,
        el("span", { class: "month" }, label),
      );
    }),
  );
}
