// Comportements de l'ossature : thème, barre latérale, épingles, vus récemment, raccourcis, panneaux, notification.
import { STORAGE } from '../data/site';

interface SavedPage {
  id: string;
  title: string;
  meta: string;
  url: string;
}

const root = document.documentElement;
const mobile = window.matchMedia('(max-width: 859px)');
const MAX_RECENTS = 5;
const SHOWN_RECENTS = 3;
const TOAST_MS = 1700;
const G_WINDOW_MS = 1200;
/** Un titre est « courant » dès qu'il passe au-dessus de cette hauteur dans la fenêtre. */
const SPY_OFFSET = 160;

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector);
const $$ = <T extends HTMLElement>(selector: string) => [...document.querySelectorAll<T>(selector)];

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // stockage indisponible (navigation privée, quota) : l'état reste valable pour la page en cours
  }
}

function readPages(key: string): SavedPage[] {
  try {
    const value: unknown = JSON.parse(readRaw(key) ?? '[]');
    return Array.isArray(value) ? value.filter((p): p is SavedPage => typeof p?.id === 'string' && typeof p?.url === 'string') : [];
  } catch {
    return [];
  }
}

/* Notification */

let toastTimer = 0;

export function toast(message: string): void {
  const box = $('[data-toast]');
  const text = $('[data-toast-text]');
  if (!box || !text) return;
  text.textContent = message;
  box.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (box.hidden = true), TOAST_MS);
}

/* Thème */

function applyTheme(theme: string): void {
  root.dataset.theme = theme;
  for (const button of $$('[data-action="set-theme"]')) {
    button.setAttribute('aria-pressed', String(button.dataset.themeValue === theme));
  }
}

function setTheme(theme: string): void {
  applyTheme(theme);
  writeRaw(STORAGE.theme, theme);
}

/* Barre latérale et tiroir mobile */

function syncSidebarToggle(): void {
  const open = mobile.matches ? root.dataset.drawer === 'open' : root.dataset.sidebar !== 'closed';
  for (const button of $$('[data-action="toggle-sidebar"]')) button.setAttribute('aria-expanded', String(open));
}

function setDrawer(open: boolean): void {
  if (open) root.dataset.drawer = 'open';
  else delete root.dataset.drawer;
  syncSidebarToggle();
  if (open) $('#navigation')?.focus();
}

function setSidebar(open: boolean): void {
  if (open) delete root.dataset.sidebar;
  else root.dataset.sidebar = 'closed';
  writeRaw(STORAGE.sidebar, open ? 'open' : 'closed');
  syncSidebarToggle();
}

function toggleSidebar(): void {
  if (mobile.matches) setDrawer(root.dataset.drawer !== 'open');
  else setSidebar(root.dataset.sidebar === 'closed');
}

function setSectionOpen(button: HTMLElement, open: boolean): void {
  button.setAttribute('aria-expanded', String(open));
  const list = document.getElementById(button.getAttribute('aria-controls') ?? '');
  if (list) list.hidden = !open;
}

function openSection(num: string): void {
  if (mobile.matches) setDrawer(true);
  else setSidebar(true);
  const link = $(`[data-section-link="${num}"]`);
  const caret = link?.parentElement?.querySelector<HTMLElement>('[data-action="toggle-section"]');
  if (caret) setSectionOpen(caret, true);
  link?.focus();
}

/* Épingles et vus récemment */

const layout = $('[data-page-id]');
const page: SavedPage | null = layout?.dataset.pageId
  ? {
      id: layout.dataset.pageId,
      title: layout.dataset.pageTitle ?? '',
      meta: layout.dataset.pageMeta ?? '',
      url: location.pathname,
    }
  : null;

function renderList(name: 'pins' | 'recents', pages: SavedPage[]): void {
  const group = $(`[data-nav-group="${name}"]`);
  const list = $(`[data-nav-list="${name}"]`);
  const template = $<HTMLTemplateElement>('[data-nav-template]');
  if (!group || !list || !template) return;
  list.replaceChildren(
    ...pages.map((p) => {
      const item = template.content.cloneNode(true) as DocumentFragment;
      const link = item.querySelector('a')!;
      link.href = p.url;
      if (p.id === page?.id) link.setAttribute('aria-current', 'page');
      item.querySelector('.entry-label')!.textContent = p.title;
      item.querySelector('.entry-meta')!.textContent = p.meta;
      return item;
    }),
  );
  group.hidden = pages.length === 0;
}

function renderSaved(): void {
  const pins = readPages(STORAGE.pins);
  const pinned = new Set(pins.map((p) => p.id));
  renderList('pins', pins);
  renderList(
    'recents',
    readPages(STORAGE.recents)
      .filter((p) => !pinned.has(p.id))
      .slice(0, SHOWN_RECENTS),
  );
  const isPinned = page ? pinned.has(page.id) : false;
  for (const button of $$('[data-action="pin"]')) button.setAttribute('aria-pressed', String(isPinned));
}

function togglePin(): void {
  if (!page) return;
  const pins = readPages(STORAGE.pins);
  const has = pins.some((p) => p.id === page.id);
  writeRaw(STORAGE.pins, JSON.stringify(has ? pins.filter((p) => p.id !== page.id) : [page, ...pins]));
  renderSaved();
  toast(has ? 'Retiré des épinglés' : 'Épinglé — retrouvable dans la barre latérale');
}

function recordVisit(): void {
  if (!page) return;
  const recents = [page, ...readPages(STORAGE.recents).filter((p) => p.id !== page.id)].slice(0, MAX_RECENTS);
  writeRaw(STORAGE.recents, JSON.stringify(recents));
  // Le titre d'une page épinglée peut avoir changé depuis l'épinglage.
  const pins = readPages(STORAGE.pins);
  if (pins.some((p) => p.id === page.id)) {
    writeRaw(STORAGE.pins, JSON.stringify(pins.map((p) => (p.id === page.id ? page : p))));
  }
}

/* Panneaux */

function openDialog(name: string): void {
  const dialog = $<HTMLDialogElement>(`dialog[data-dialog="${name}"]`);
  if (dialog && !dialog.open) dialog.showModal();
}

function closeDialogs(): void {
  for (const dialog of $$<HTMLDialogElement>('dialog[open]')) dialog.close();
}

/* Sommaire : repère la section en cours de lecture */

function initScrollSpy(): void {
  const links = $$<HTMLAnchorElement>('[data-toc] a');
  if (links.length === 0) return;
  const ids = [...new Set(links.map((a) => decodeURIComponent(a.hash.slice(1))))];
  let frame = 0;
  const update = () => {
    frame = 0;
    let current = ids[0];
    for (const id of ids) {
      const heading = document.getElementById(id);
      if (heading && heading.getBoundingClientRect().top < SPY_OFFSET) current = id;
    }
    for (const link of links) {
      const active = decodeURIComponent(link.hash.slice(1)) === current;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  };
  window.addEventListener('scroll', () => (frame ||= requestAnimationFrame(update)), { passive: true });
  update();
}

/* Actions déclenchées par `data-action` */

async function copyText(text: string, message: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast(message);
  } catch {
    toast('Copie impossible dans ce navigateur');
  }
}

function scrollToTop(): void {
  window.scrollTo({ top: 0 });
}

function openSearch(): void {
  // La palette de recherche arrive avec Pagefind.
  toast('Recherche bientôt disponible');
}

const actions: Record<string, (el: HTMLElement) => void> = {
  'toggle-sidebar': toggleSidebar,
  'close-drawer': () => setDrawer(false),
  'toggle-section': (el) => setSectionOpen(el, el.getAttribute('aria-expanded') !== 'true'),
  'open-section': (el) => openSection(el.dataset.section ?? ''),
  'set-theme': (el) => setTheme(el.dataset.themeValue ?? 'dark'),
  'open-search': openSearch,
  'open-help': () => openDialog('help'),
  'open-toc': () => {
    setDrawer(false);
    openDialog('toc');
  },
  'close-dialog': closeDialogs,
  pin: togglePin,
  'copy-code': (el) => void copyText(el.closest('.code')?.querySelector('pre')?.textContent ?? '', 'Copié dans le presse-papiers'),
  'copy-link': () => void copyText(location.href.split('#')[0]!, 'Lien copié'),
  top: scrollToTop,
};

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  // Clic sur le voile d'un panneau modal : la cible est le <dialog> lui-même.
  if (target instanceof HTMLDialogElement) {
    target.close();
    return;
  }
  const el = target.closest<HTMLElement>('[data-action]');
  if (el) actions[el.dataset.action ?? '']?.(el);
});

/* Raccourcis clavier */

let gPending = false;
let gTimer = 0;

document.addEventListener('keydown', (event) => {
  const key = event.key;
  if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === 'k') {
    event.preventDefault();
    openSearch();
    return;
  }
  if (key === 'Escape') {
    setDrawer(false);
    return;
  }
  const active = document.activeElement as HTMLElement | null;
  const typing = active ? /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName) || active.isContentEditable : false;
  if (typing || event.ctrlKey || event.metaKey || event.altKey || $('dialog[open]')) return;

  if (gPending) {
    gPending = false;
    const href = /^[0-8]$/.test(key)
      ? $<HTMLAnchorElement>(`[data-section-link="0${key}"]`)?.href
      : key === 'h'
        ? $<HTMLAnchorElement>('[data-home-link]')?.href
        : undefined;
    if (href) {
      event.preventDefault();
      location.href = href;
    }
    return;
  }

  switch (key) {
    case '/':
      event.preventDefault();
      openSearch();
      break;
    case 'g':
      gPending = true;
      window.clearTimeout(gTimer);
      gTimer = window.setTimeout(() => (gPending = false), G_WINDOW_MS);
      break;
    case '?':
      openDialog('help');
      break;
    case 't':
      setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
      break;
    case 'p':
      togglePin();
      break;
    case '[':
      toggleSidebar();
      break;
  }
});

/* Initialisation */

applyTheme(root.dataset.theme ?? 'dark');
syncSidebarToggle();
mobile.addEventListener('change', () => {
  setDrawer(false);
});
recordVisit();
renderSaved();
initScrollSpy();
