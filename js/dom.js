// Criacao de elementos sem innerHTML.
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

// Monta a URL da capa a partir do id numerico.
export function coverUrl(id, size = "M") {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? `https://covers.openlibrary.org/b/id/${n}-${size}.jpg` : null;
}

export function cover(id, size) {
  const src = coverUrl(id, size);
  if (!src) return placeholder();
  const img = el("img", { class: "cover", src, alt: "", loading: "lazy" });
  // Capa indisponivel na Open Library vira o quadro vazio.
  img.addEventListener("error", () => img.replaceWith(placeholder()), { once: true });
  return img;
}

function placeholder() {
  return el("div", { class: "cover none", "aria-hidden": "true" });
}
