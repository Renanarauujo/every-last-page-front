// Chamadas a API da estante.
import { API_URL } from "./config.js";

const SEARCH_LIMIT = 20;

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(API_URL + path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("A API não respondeu. Verifique se ela está em execução.");
  }
  if (res.status === 204) return null;
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(errorText(res.status, body));
  return body;
}

// Converte a resposta de erro em mensagem para o usuario.
function errorText(status, body) {
  if (body && typeof body.detail === "string") return body.detail;
  if (status === 422) return "Dados inválidos.";
  if (status === 429) return "Muitas buscas em pouco tempo. Tente de novo em instantes.";
  return `Erro ${status} na API.`;
}

const query = params => new URLSearchParams(params).toString();

export const api = {
  search: (q, filters = {}) => request(`/books/search?${query({ q, limit: SEARCH_LIMIT, ...filters })}`),
  list: (order = "recent") => request(`/shelf?${query({ order })}`),
  add: book => request("/shelf", { method: "POST", body: JSON.stringify(book) }),
  update: (id, data) => request(`/shelf/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: id => request(`/shelf/${id}`, { method: "DELETE" }),
  summary: () => request("/shelf/summary"),
};
