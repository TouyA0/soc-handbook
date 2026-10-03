// Enregistrements de l'index de recherche : une entrée par page, par Event ID, par ligne de cheat sheet
// et par requête. Ils sont écrits dans search-records.json au build, puis indexés par Pagefind.
import type { MarkdownHeading } from 'astro';
import { SECTIONS } from '../data/sections';
import type { ResultType, SearchRecord } from '../data/search';
import { PLATFORMS } from '../data/writeups';
import { docUrl, sectionOf, type Doc } from './content';
import { getStatusPath } from './nav';

const QUERY_LANGS: Record<string, string> = { spl: 'SPL', splunk: 'SPL', kql: 'KQL', kusto: 'KQL', sigma: 'SIGMA' };
const FILTER_LANGS: Record<string, string> = { wireshark: 'DISPLAY FILTER', bpf: 'BPF' };
const PLAYBOOK_DIR = SECTIONS.find((s) => s.num === '04')!.dir;

/** Cellules d'une ligne de tableau Markdown ; `\|` est une barre verticale, pas un séparateur. */
const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replace(/\\\|/g, '|'));

/** Texte lisible d'un fragment Markdown : sans balisage, sans syntaxe de lien ni de bloc. */
function plain(markdown: string): string {
  return markdown
    .replace(/^(```|~~~).*$/gm, '')
    .replace(/^:{2,3}.*$/gm, '')
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/:attack\[([^\]]*)\]/g, '$1')
    .replace(/[*_`#>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pageType(doc: Doc): ResultType {
  if (doc.data.type === 'technique' || doc.data.type === 'writeup') return doc.data.type;
  return doc.id.startsWith(`${PLAYBOOK_DIR}/`) ? 'playbook' : 'page';
}

function pageMono(doc: Doc): string {
  const { data } = doc;
  if (data.type === 'technique') return data.attack_id;
  if (data.type === 'writeup') return PLATFORMS[data.platform];
  if (data.type === 'cheatsheet') return 'cheat sheet';
  return sectionOf(doc)?.num ?? '';
}

/** Enregistrements d'une page : la page elle-même, puis ses Event IDs, lignes de cheat sheet et requêtes. */
export function buildRecords(doc: Doc, headings: MarkdownHeading[]): SearchRecord[] {
  const { data } = doc;
  const url = docUrl(doc.id);
  const tags = [...new Set(data.type === 'writeup' ? [...data.tags, ...data.skills] : data.tags)];
  const pagePath = getStatusPath(doc);
  const body = doc.body ?? '';
  const records: SearchRecord[] = [];

  const add = (
    type: ResultType,
    anchor: string,
    content: string,
    meta: Partial<Omit<SearchRecord['meta'], 'href'>> & { title: string },
  ) =>
    records.push({
      url: `${url}#~${records.length}`,
      content,
      meta: { href: anchor ? `${url}#${anchor}` : url, mono: '', path: pagePath, desc: '', snippet: '', lang: '', tags: tags.map((t) => `#${t}`).join(' '), ...meta },
      filters: { type: [type], tag: tags.map((t) => t.toLowerCase()) },
    });

  add(pageType(doc), '', `${data.title} ${data.description} ${plain(body)}`, {
    title: data.title,
    mono: pageMono(doc),
    desc: data.description,
  });

  // Parcours du corps : on suit le titre courant pour rattacher chaque élément à son ancre.
  const slugs = [...headings];
  let section: MarkdownHeading | undefined;
  const lines = body.split('\n');
  const sectionPath = () => (section ? `${data.title} › ${section.text}` : data.title);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    const heading = /^(#{2,3})\s+(.*)$/.exec(line);
    if (heading) {
      const index = slugs.findIndex((h) => h.depth === heading[1]!.length);
      if (index !== -1) section = slugs.splice(0, index + 1).pop();
      continue;
    }

    const fence = /^(```|~~~)\s*([\w-]*)(.*)$/.exec(line);
    if (fence) {
      const lang = fence[2]!.toLowerCase();
      const end = lines.findIndex((l, j) => j > i && l.startsWith(fence[1]!));
      const code = lines.slice(i + 1, end === -1 ? undefined : end).join('\n');
      const title = /title="([^"]*)"/.exec(fence[3]!)?.[1] ?? '';
      const label = QUERY_LANGS[lang] ?? FILTER_LANGS[lang];
      if (label && code.trim()) {
        add(lang in QUERY_LANGS ? 'query' : 'filter', section?.slug ?? '', `${title} ${code} ${data.title} ${section?.text ?? ''}`, {
          title: title || `${label} — ${data.title}`,
          mono: label,
          path: sectionPath(),
          desc: title ? `${label} · ${data.title}` : '',
          snippet: code,
          lang: label,
        });
      }
      i = end === -1 ? lines.length : end;
      continue;
    }

    // Tableau : ligne d'en-tête suivie de sa ligne de séparation.
    if (line.trim().startsWith('|') && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1] ?? '')) {
      const header = cells(line);
      const rows: string[][] = [];
      let j = i + 2;
      for (; j < lines.length && lines[j]!.trim().startsWith('|'); j++) rows.push(cells(lines[j]!));

      if (header[0]?.toLowerCase() === 'id') {
        for (const [id, detail = ''] of rows) {
          if (!id) continue;
          const label = /\*\*(.+?)\*\*/.exec(detail)?.[1] ?? '';
          add('event', section?.slug ?? '', `${id} ${plain(detail)} ${data.title}`, {
            title: label ? `${id} — ${label}` : id,
            mono: id,
            path: sectionPath(),
            desc: plain(detail),
          });
        }
      } else if (data.type === 'cheatsheet') {
        for (const [first = '', desc = ''] of rows) {
          const code = /`([^`]+)`/.exec(first)?.[1] ?? '';
          if (!code) continue;
          add('filter', section?.slug ?? '', `${code} ${plain(desc)} ${section?.text ?? ''} ${data.tool}`, {
            title: code,
            mono: data.tool,
            path: sectionPath(),
            desc: plain(desc),
            snippet: code,
            lang: data.tool,
          });
        }
      }
      i = j - 1;
    }
  }

  return records;
}
