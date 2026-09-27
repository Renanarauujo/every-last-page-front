// Estado compartilhado da estante e textos de status.
export const LISTS = [
  ["want", "Quero ler"],
  ["reading", "Lendo"],
  ["read", "Lido"],
  ["dropped", "Abandonado"],
];
export const LABEL = Object.fromEntries(LISTS);

export const GENRES = [
  ["fantasy", "Fantasia"],
  ["science_fiction", "Ficção científica"],
  ["fiction", "Romance e ficção"],
  ["mystery", "Suspense e mistério"],
  ["poetry", "Poesia"],
  ["education", "Estudo e formação"],
  ["religion", "Religião e espiritualidade"],
  ["philosophy", "Filosofia"],
  ["biography", "Biografia"],
  ["history", "História"],
  ["other", "Outros"],
];
export const GENRE = Object.fromEntries(GENRES);

export const state = { books: [] };

export function hasBook(olKey) {
  return state.books.some(b => b.ol_key === olKey);
}

export function shortDate(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

