// Icones em SVG. Marcacao fixa, sem dado externo.
const PATHS = {
  plus: '<path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
};

export function icon(name) {
  const span = document.createElement("span");
  span.className = `ic ic-${name}`;
  span.setAttribute("aria-hidden", "true");
  span.innerHTML = `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">${PATHS[name]}</svg>`;
  return span;
}
