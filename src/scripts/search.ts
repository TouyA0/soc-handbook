// Palette de recherche : interroge l'index Pagefind généré au build.
import { STORAGE } from '../data/site';
import { RESULT_TYPES, type ResultType, type SearchRecord } from '../data/search';
import { highlightFilter } from '../plugins/markdown-blocks.mjs';

type Scope = 'all' | ResultType;

interface Hit {
  url: string;
  excerpt: string;
  meta: SearchRecord['meta'];
  type: ResultType;
}

interface PagefindResult {
  data(): Promise<{ url: string; excerpt: string; meta: SearchRecord['meta']; filters: { type?: string[] } }>;
}

interface Pagefind {
  init(): Promise<void>;
  /** Charge les filtres : sans cet appel, les recherches ne renvoient pas le décompte par type. */
  filters(): Promise<unknown>;
  options(options: Record<string, unknown>): Promise<void>;
  search(
    term: string | null,
    options: { filters?: Record<string, string | string[]> },
  ): Promise<{ results: PagefindResult[]; filters: { type?: Record<string, number> }; unfilteredResultCount: number }>;
}

const GROUP_LABELS: Record<ResultType, string> = {
  technique: 'Techniques',
  event: 'Event IDs',
  filter: 'Filtres',
  query: 'Requêtes',
  writeup: 'Write-ups',
  playbook: 'Playbooks',
  page: 'Fiches',
};

const TYPE_LABELS: Record<ResultType, string> = {
  technique: 'TECHNIQUE',
  event: 'EVENT ID',
  filter: 'FILTRE',
  query: 'REQUÊTE',
  writeup: 'WRITE-UP',
  playbook: 'PLAYBOOK',
  page: 'FICHE',
};

/** Préfixes de recherche : `id:4769` restreint aux Event IDs. */
const PREFIXES: Record<string, ResultType> = {
  t: 'technique',
  id: 'event',
  f: 'filter',
  q: 'query',
  wu: 'writeup',
  pb: 'playbook',
};

const MAX_LOADED = 40;
const MAX_PER_GROUP = 6;
const MAX_SEARCHES = 5;
const DEBOUNCE_MS = 120;

const dialog = document.querySelector<HTMLDialogElement>('dialog[data-dialog="search"]');

if (dialog) {
  const $ = <T extends HTMLElement>(selector: string) => dialog.querySelector<T>(selector)!;
  const input = $<HTMLInputElement>('[data-search-input]');
  const prefixBadge = $('[data-search-prefix]');
  const count = $('[data-search-count]');
  const groups = $('[data-search-groups]');
  const message = $('[data-search-message]');
  const recents = $('[data-search-recents]');
  const recentList = $('[data-search-recent-list]');
  const preview = $('[data-search-preview]');
  const tabs = [...dialog.querySelectorAll<HTMLElement>('[data-search-scope]')];
  const groupTemplate = $<HTMLTemplateElement>('[data-search-group-template]');
  const resultTemplate = $<HTMLTemplateElement>('[data-search-result-template]');
  const statusMode = document.querySelector<HTMLElement>('[data-status-mode]');
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');

  let pagefind: Pagefind | null | undefined;
  let scope: Scope = 'all';
  let hits: Hit[] = [];
  let selected = 0;
  let request = 0;
  let timer = 0;

  const toast = (text: string) => document.dispatchEvent(new CustomEvent('sockb:toast', { detail: text }));

  function readSearches(): string[] {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(STORAGE.searches) ?? '[]');
      return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
    } catch {
      return [];
    }
  }

  function rememberSearch(): void {
    const query = input.value.trim();
    if (!query) return;
    try {
      const searches = [query, ...readSearches().filter((s) => s !== query)].slice(0, MAX_SEARCHES);
      localStorage.setItem(STORAGE.searches, JSON.stringify(searches));
    } catch {
      // stockage indisponible : la recherche n'est simplement pas mémorisée
    }
  }

  async function loadPagefind(): Promise<Pagefind | null> {
    if (pagefind !== undefined) return pagefind;
    try {
      const module = (await import(/* @vite-ignore */ `${base}pagefind/pagefind.js`)) as Pagefind;
      await module.options({ excerptLength: 22 });
      await module.init();
      await module.filters();
      pagefind = module;
    } catch {
      pagefind = null;
    }
    return pagefind;
  }

  /** Sépare la saisie en préfixe de type, tags et termes. */
  function parse(raw: string): { type?: ResultType; prefix?: string; tags: string[]; term: string } {
    let text = raw.trim();
    let type: ResultType | undefined;
    let prefix: string | undefined;
    const match = /^([a-z]{1,2}):\s*(.*)$/i.exec(text);
    if (match && PREFIXES[match[1]!.toLowerCase()]) {
      prefix = match[1]!.toLowerCase();
      type = PREFIXES[prefix];
      text = match[2]!;
    }
    const tags: string[] = [];
    const term = text
      .replace(/#([\p{L}\p{N}_-]+)/gu, (_, tag: string) => {
        tags.push(tag.toLowerCase());
        return ' ';
      })
      .replace(/\s+/g, ' ')
      .trim();
    return { type, prefix, tags, term };
  }

  /** Titre du résultat, les mots recherchés étant surlignés. */
  function fillTitle(target: HTMLElement, title: string, term: string): void {
    const words = term.split(/\s+/).filter((w) => w.length > 1);
    if (words.length === 0) {
      target.textContent = title;
      return;
    }
    const pattern = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    target.replaceChildren(
      ...title.split(pattern).map((part, i) => {
        if (i % 2 === 0) return document.createTextNode(part);
        const mark = document.createElement('mark');
        mark.textContent = part;
        return mark;
      }),
    );
  }

  function renderPreview(): void {
    const hit = hits[selected];
    preview.hidden = !hit;
    if (!hit) return;
    const set = (name: string, value: string) => (preview.querySelector<HTMLElement>(`[data-pv="${name}"]`)!.textContent = value);
    set('type', TYPE_LABELS[hit.type]);
    set('mono', hit.meta.mono);
    set('title', hit.meta.title);
    set('path', hit.meta.path);
    set('desc', hit.meta.desc);
    set('tags', hit.meta.tags);
    set('lang', hit.meta.lang);
    // L'extrait vient de l'index Pagefind, qui échappe le contenu et n'ajoute que des balises <mark>.
    preview.querySelector<HTMLElement>('[data-pv="excerpt"]')!.innerHTML = hit.meta.snippet ? '' : hit.excerpt;
    const snippet = preview.querySelector<HTMLElement>('[data-pv-snippet]')!;
    snippet.hidden = !hit.meta.snippet;
    const code = preview.querySelector<HTMLElement>('[data-pv="code"]')!;
    if (hit.type === 'filter') code.innerHTML = highlightFilter(hit.meta.snippet);
    else code.textContent = hit.meta.snippet;
    const open = preview.querySelector<HTMLAnchorElement>('[data-pv-open]')!;
    open.href = hit.url;
    open.textContent = hit.type === 'writeup' ? 'Ouvrir le write-up ↵' : 'Ouvrir la fiche ↵';
  }

  function select(index: number, scroll = true): void {
    selected = Math.max(0, Math.min(index, hits.length - 1));
    groups.querySelectorAll<HTMLElement>('.result').forEach((el, i) => {
      el.setAttribute('aria-selected', String(i === selected));
      if (i === selected && scroll) el.scrollIntoView({ block: 'nearest' });
    });
    if (hits.length > 0) input.setAttribute('aria-activedescendant', `search-option-${selected}`);
    else input.removeAttribute('aria-activedescendant');
    renderPreview();
  }

  function renderResults(term: string): void {
    const ordered: Hit[] = [];
    groups.replaceChildren(
      ...RESULT_TYPES.flatMap((type) => {
        const items = hits.filter((h) => h.type === type).slice(0, scope === 'all' ? MAX_PER_GROUP : undefined);
        if (items.length === 0) return [];
        const group = groupTemplate.content.cloneNode(true) as DocumentFragment;
        group.querySelector('[data-group-label]')!.textContent = GROUP_LABELS[type];
        group.querySelector('[data-group-count]')!.textContent = String(items.length);
        const container = group.querySelector('.group')!;
        container.setAttribute('aria-label', GROUP_LABELS[type]);
        for (const hit of items) {
          const index = ordered.push(hit) - 1;
          const row = resultTemplate.content.cloneNode(true) as DocumentFragment;
          const link = row.querySelector<HTMLAnchorElement>('a')!;
          link.href = hit.url;
          link.dataset.index = String(index);
          link.id = `search-option-${index}`;
          fillTitle(row.querySelector('.result-title')!, hit.meta.title, term);
          row.querySelector('.result-path')!.textContent = hit.meta.path;
          row.querySelector('.result-mono')!.textContent = hit.meta.mono;
          container.append(row);
        }
        return [group];
      }),
    );
    hits = ordered;
    select(0, false);
  }

  function renderRecents(show: boolean): void {
    const searches = show ? readSearches() : [];
    recents.hidden = searches.length === 0;
    recentList.replaceChildren(
      ...searches.map((query) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = query;
        button.addEventListener('click', () => {
          input.value = query;
          void search();
          input.focus();
        });
        return button;
      }),
    );
  }

  function showMessage(html: string): void {
    message.hidden = !html;
    message.innerHTML = html;
  }

  async function search(): Promise<void> {
    const id = ++request;
    const { type, prefix, tags, term } = parse(input.value);
    prefixBadge.hidden = !prefix;
    prefixBadge.textContent = prefix ? `${prefix}:` : '';
    const activeType = type ?? (scope === 'all' ? undefined : scope);
    for (const tab of tabs) tab.setAttribute('aria-pressed', String(tab.dataset.searchScope === (activeType ?? 'all')));

    const engine = await loadPagefind();
    if (id !== request) return;
    if (!engine) {
      hits = [];
      groups.replaceChildren();
      preview.hidden = true;
      count.textContent = '';
      renderRecents(false);
      showMessage("L'index de recherche est généré au build.<br>Lancer <code>npm run build</code> puis <code>npm run preview</code>.");
      return;
    }

    const tagFilter: Record<string, string | string[]> = tags.length > 0 ? { tag: tags } : {};
    // Première requête sans filtre de type : elle donne le nombre de résultats par type, pour les onglets.
    const overall = await engine.search(term || null, { filters: tagFilter });
    const scoped = activeType ? await engine.search(term || null, { filters: { ...tagFilter, type: activeType } }) : overall;
    const loaded = await Promise.all(scoped.results.slice(0, MAX_LOADED).map((r) => r.data()));
    if (id !== request) return;

    const typeCounts = overall.filters.type ?? {};
    for (const tab of tabs) {
      const value = tab.dataset.searchScope as Scope;
      const n = value === 'all' ? overall.results.length : (typeCounts[value] ?? 0);
      tab.querySelector('[data-scope-count]')!.textContent = String(n);
    }

    hits = loaded.map((d) => ({ url: d.meta.href, excerpt: d.excerpt, meta: d.meta, type: (d.filters.type?.[0] ?? 'page') as ResultType }));
    const total = scoped.results.length;
    count.textContent = `${total} résultat${total > 1 ? 's' : ''}`;
    renderRecents(!term && !type && tags.length === 0);
    showMessage(
      total === 0
        ? 'Rien trouvé.<br>Essaie un préfixe (<code>id:</code>, <code>f:</code>, <code>q:</code>) ou un autre filtre.'
        : '',
    );
    renderResults(term);
  }

  function setScope(next: Scope): void {
    scope = next;
    // Un préfixe saisi impose son type : changer d'onglet le retire de la saisie.
    const { prefix } = parse(input.value);
    if (prefix) input.value = input.value.replace(/^\s*[a-z]{1,2}:\s*/i, '');
    void search();
  }

  function open(query = ''): void {
    if (!dialog!.open) dialog!.showModal();
    scope = 'all';
    input.value = query;
    input.focus();
    if (statusMode) statusMode.textContent = 'RECHERCHE';
    void search();
  }

  async function copySnippet(): Promise<void> {
    const hit = hits[selected];
    if (!hit?.meta.snippet) {
      toast("Pas d'extrait à copier pour ce résultat");
      return;
    }
    try {
      await navigator.clipboard.writeText(hit.meta.snippet);
      toast('Copié dans le presse-papiers');
    } catch {
      toast('Copie impossible dans ce navigateur');
    }
  }

  dialog.addEventListener('close', () => {
    if (statusMode) statusMode.textContent = 'LECTURE';
  });

  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void search(), DEBOUNCE_MS);
  });

  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      select(selected + (event.key === 'ArrowDown' ? 1 : -1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (event.shiftKey) {
        void copySnippet();
      } else if (hits[selected]) {
        rememberSearch();
        location.href = hits[selected]!.url;
        dialog.close();
      }
    } else if (event.key === 'Tab') {
      event.preventDefault();
      const order = tabs.map((t) => t.dataset.searchScope as Scope);
      const current = order.indexOf(parse(input.value).type ?? scope);
      setScope(order[(current + (event.shiftKey ? -1 : 1) + order.length) % order.length]!);
    }
  });

  dialog.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const tab = target.closest<HTMLElement>('[data-search-scope]');
    if (tab) {
      setScope(tab.dataset.searchScope as Scope);
      input.focus();
      return;
    }
    if (target.closest('[data-search-copy]')) {
      void copySnippet();
      return;
    }
    if (target.closest('.result, [data-pv-open]')) {
      rememberSearch();
      dialog.close();
    }
  });

  groups.addEventListener('mousemove', (event) => {
    const row = (event.target as HTMLElement).closest<HTMLElement>('.result');
    const index = Number(row?.dataset.index);
    if (row && index !== selected) select(index, false);
  });

  document.addEventListener('sockb:search', (event) => open((event as CustomEvent<string>).detail ?? ''));
}
