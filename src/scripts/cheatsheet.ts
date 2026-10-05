// Cheat sheet : bouton « Copier » sur chaque ligne, compteur par catégorie et filtre local.
import { iconSvg } from '../data/icons.mjs';

const prose = document.querySelector<HTMLElement>('.prose[data-type="cheatsheet"]');
const input = document.querySelector<HTMLInputElement>('[data-cheat-input]');
const count = document.querySelector<HTMLElement>('[data-cheat-count]');
const empty = document.querySelector<HTMLElement>('[data-cheat-empty]');

interface Category {
  heading: HTMLElement | null;
  table: HTMLTableElement;
  rows: HTMLTableRowElement[];
}

/** Titre de niveau 2 qui précède un tableau, s'il y en a un. */
function headingBefore(table: HTMLElement): HTMLElement | null {
  for (let el = table.previousElementSibling; el; el = el.previousElementSibling) {
    if (el.tagName === 'H2') return el as HTMLElement;
  }
  return null;
}

if (prose) {
  const categories: Category[] = [...prose.querySelectorAll<HTMLTableElement>('table')].map((table) => ({
    heading: headingBefore(table),
    table,
    rows: [...table.querySelectorAll<HTMLTableRowElement>('tbody tr')],
  }));
  const total = categories.reduce((n, c) => n + c.rows.length, 0);

  for (const { heading, rows } of categories) {
    for (const row of rows) {
      const cell = document.createElement('td');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'row-copy';
      button.dataset.action = 'copy-row';
      button.innerHTML = `${iconSvg('copy', 'sm')}Copier`;
      cell.append(button);
      row.append(cell);
    }
    if (heading && !heading.querySelector('.section-count')) {
      const badge = document.createElement('span');
      badge.className = 'section-count';
      heading.append(badge);
    }
  }

  const update = () => {
    const terms = (input?.value ?? '').toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    const perHeading = new Map<HTMLElement, number>();
    for (const { heading, table, rows } of categories) {
      let visible = 0;
      for (const row of rows) {
        const text = (row.textContent ?? '').toLowerCase();
        const match = terms.every((term) => text.includes(term));
        row.hidden = !match;
        if (match) visible++;
      }
      table.hidden = visible === 0;
      shown += visible;
      if (heading) perHeading.set(heading, (perHeading.get(heading) ?? 0) + visible);
    }
    for (const [heading, visible] of perHeading) {
      // Une catégorie sans ligne correspondante disparaît pendant le filtrage.
      heading.hidden = terms.length > 0 && visible === 0;
      const badge = heading.querySelector('.section-count');
      if (badge) badge.textContent = `${visible} ligne${visible > 1 ? 's' : ''}`;
    }
    if (count) count.textContent = `${shown} / ${total}`;
    if (empty) empty.hidden = shown > 0 || total === 0;
  };

  input?.addEventListener('input', update);
  update();
}
