// Mensagens de carregando, sucesso e erro.
const HIDE_AFTER = 3000;

let timer = null;

export function show(text, kind = "info") {
  const el = document.getElementById("toast");
  el.textContent = text;
  el.className = `toast show ${kind}`;
  clearTimeout(timer);
  if (kind !== "loading") timer = setTimeout(() => (el.className = "toast"), HIDE_AFTER);
}

// Executa uma tarefa exibindo o estado da chamada.
export async function run(task, { loading, done } = {}) {
  if (loading) show(loading, "loading");
  try {
    const result = await task();
    if (done) show(done, "ok");
    else if (loading) document.getElementById("toast").className = "toast";
    return result;
  } catch (err) {
    show(err.message, "error");
    return undefined;
  }
}
