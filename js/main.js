// Inicializacao da pagina.
import { api } from "./api.js";
import { initBoard, order, renderBoard } from "./board.js";
import { initLayout } from "./layout.js";
import { loadPanel } from "./panel.js";
import { initSearch, renderResults } from "./search.js";
import { state } from "./state.js";
import { run } from "./toast.js";

// Recarrega a estante e redesenha quadro, busca e painel.
async function refresh() {
  const list = await run(() => api.list(order()));
  if (list) state.books = list;
  renderBoard();
  renderResults();
  await loadPanel();
}

initLayout();
initSearch(refresh);
initBoard(refresh);
refresh();
