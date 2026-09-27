// Icones em SVG usados nos cartoes. Marcacao fixa, sem dado externo.
const PATHS = {
  star: '<path d="M8 1.5l1.9 4 4.4.5-3.3 3 .9 4.3L8 11.1l-3.9 2.2.9-4.3-3.3-3 4.4-.5z"/>',
  comment: '<path d="M2.5 3h11v7.5H7l-3.5 3v-3h-1z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>',
  clock: '<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 4.5V8l2.5 1.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  pages: '<path d="M4 2h6l3 3v9H4z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M6.5 8h4M6.5 10.5h4" stroke="currentColor" stroke-width="1.2"/>',
  plus: '<path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
};

export function icon(name) {
  const span = document.createElement("span");
  span.className = `ic ic-${name}`;
  span.setAttribute("aria-hidden", "true");
  span.innerHTML = `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">${PATHS[name]}</svg>`;
  return span;
}
