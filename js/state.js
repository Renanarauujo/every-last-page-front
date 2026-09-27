// Estado compartilhado da estante e textos de status.
export const LISTS = [
  ["want", "Quero ler"],
  ["reading", "Lendo"],
  ["read", "Lido"],
  ["dropped", "Abandonado"],
];
export const LABEL = Object.fromEntries(LISTS);

export const state = { books: [] };

export function hasBook(olKey) {
  return state.books.some(b => b.ol_key === olKey);
}

export function shortDate(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}

export function fullDate(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}
