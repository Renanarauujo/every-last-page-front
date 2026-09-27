// Icones em SVG. Marcacao fixa, sem dado externo.
const PATHS = {
  search: '<circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10.4 10.4L14 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  trash: '<path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 7v4M9 7v4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
  plus: '<path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
};

export function icon(name) {
  const span = document.createElement("span");
  span.className = `ic ic-${name}`;
  span.setAttribute("aria-hidden", "true");
  span.innerHTML = `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">${PATHS[name]}</svg>`;
  return span;
}
