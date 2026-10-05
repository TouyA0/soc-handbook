// Blocs de contenu écrits en Markdown :
// - encadrés, étapes, timeline, question / démarche / constat, via des blocs `:::nom … :::` ;
// - badge ATT&CK en ligne, via `:attack[T1059.001]` ;
// - blocs de code enveloppés d'un en-tête (langage, titre, bouton copier) ;
// - coloration des filtres et commandes : blocs `wireshark` / `bpf` et code de la première colonne des tableaux.
// La syntaxe est documentée dans docs/redaction.md.

import { iconSvg } from '../data/icons.mjs';

/** Encadrés : nom du bloc → titre affiché, couleur et pictogramme. */
export const CALLOUTS = {
  astuce: { label: 'Astuce', tone: 'accent', icon: 'bulb' },
  piege: { label: 'Piège', tone: 'high', icon: 'alert' },
  'faux-positifs': { label: 'Faux positifs connus', tone: 'med', icon: 'filter' },
  'mon-erreur': { label: 'Mon erreur', tone: 'high', icon: 'undo' },
  'sans-spoiler': { label: 'Sans spoiler', tone: 'info', icon: 'eye-off' },
};

/** Blocs de mise en forme : nom du bloc → classe du conteneur. */
const WRAPPERS = {
  etapes: 'steps',
  timeline: 'timeline',
  points: 'points',
};

/** Blocs à libellé des étapes de write-up : nom du bloc → libellé et classe. */
const LABELLED = {
  question: { label: 'Question', className: 'qa qa-question' },
  demarche: { label: 'Démarche', className: 'qa' },
  constat: { label: 'Constat', className: 'finding' },
};

/** Langages colorés ici plutôt que par Shiki, qui n'a pas de grammaire pour eux. */
const FILTER_LANGS = new Set(['wireshark', 'bpf']);

/** Libellé affiché pour un langage de bloc de code ; par défaut, son nom en capitales. */
const LANG_LABELS = {
  wireshark: 'DISPLAY FILTER',
  kusto: 'KQL',
  splunk: 'SPL',
  yml: 'YAML',
  sh: 'BASH',
  shell: 'BASH',
  ps1: 'POWERSHELL',
  text: '',
  txt: '',
  plaintext: '',
};

const ATTACK_ID = /^T\d{4}(\.\d{3})?$/;

const escapeHtml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const location = (ctx) => (ctx.fileURL ? ` dans ${ctx.fileURL.pathname.split('/').slice(-2).join('/')}` : '');

const labelNode = (label, className, icon) => ({
  type: 'paragraph',
  data: { hName: 'div', hProperties: { class: className } },
  children: [...(icon ? [{ type: 'html', value: iconSvg(icon, 'sm') }] : []), { type: 'text', value: label }],
});

/* Coloration d'un filtre ou d'une commande : chaînes, nombres, opérateurs, champs pointés. */

const TOKENS = [
  ['str', /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/y],
  // Chemin ou nom de fichier : laissé sans couleur, sinon « local.rules » serait pris pour un champ pointé.
  ['', /(?:\/[\w.-]+)+\/?|\b[\w-]+\.(?:pcap|pcapng|rules|lua|conf|log|txt|json|yml|yaml|eml)\b/y],
  ['num', /\b0x[0-9a-fA-F]+\b|\b\d+(?:[.:/]\d+)*\b/y],
  ['kw', /==|!=|>=|<=|->|&&|\|\||[=<>!]|\b(?:and|or|not|contains|matches|in|host|port|net|src|dst)\b/y],
  ['field', /\b[A-Za-z_][\w-]*(?:\.[\w-]+)+\b/y],
];

export function highlightFilter(text) {
  let html = '';
  let plain = '';
  const flush = () => {
    html += escapeHtml(plain);
    plain = '';
  };
  for (let i = 0; i < text.length; ) {
    let matched = false;
    for (const [name, pattern] of TOKENS) {
      pattern.lastIndex = i;
      const match = pattern.exec(text);
      if (match) {
        flush();
        html += name ? `<span class="tok-${name}">${escapeHtml(match[0])}</span>` : escapeHtml(match[0]);
        i += match[0].length;
        matched = true;
        break;
      }
    }
    if (!matched) plain += text[i++];
  }
  flush();
  return html;
}

/* Blocs `:::` */

function directive(node, ctx) {
  const callout = CALLOUTS[node.name];
  if (callout) {
    ctx.replaceNode(node, {
      ...node,
      data: { hName: 'aside', hProperties: { class: `callout callout-${callout.tone}`, 'data-callout': node.name } },
      children: [labelNode(callout.label, 'callout-title', callout.icon), ...node.children],
    });
    return;
  }
  const labelled = LABELLED[node.name];
  if (labelled) {
    ctx.replaceNode(node, {
      ...node,
      data: { hName: 'div', hProperties: { class: labelled.className } },
      children: [labelNode(labelled.label, 'block-label'), ...node.children],
    });
    return;
  }
  const wrapper = WRAPPERS[node.name];
  if (wrapper) {
    ctx.replaceNode(node, { ...node, data: { hName: 'div', hProperties: { class: wrapper } } });
    return;
  }
  const known = [...Object.keys(CALLOUTS), ...Object.keys(LABELLED), ...Object.keys(WRAPPERS)].join(', ');
  throw new Error(`Bloc « :::${node.name} » inconnu${location(ctx)}. Blocs disponibles : ${known}.`);
}

/**
 * Activer les blocs `:::` active aussi les formes en ligne `:nom` et `::nom`, qui avaleraient
 * des écritures courantes (« 09:12 », « id:4769 »). On les remet en texte tel quel,
 * sauf `:attack[T1059.001]`, rendu en badge ATT&CK.
 */
function inlineDirective(node, ctx) {
  const leaf = node.type === 'leafDirective';
  if (node.name === 'attack') {
    const id = node.children?.[0]?.value ?? '';
    if (!ATTACK_ID.test(id)) {
      throw new Error(`Badge « :attack[${id}] » invalide${location(ctx)} : identifiant ATT&CK attendu, ex. T1059.001.`);
    }
    const badge = { type: 'html', value: `<span class="attack-inline">${id}</span>` };
    ctx.replaceNode(node, leaf ? { type: 'paragraph', data: { hProperties: { class: 'attack-line' } }, children: [badge] } : badge);
    return;
  }
  const label = node.children?.length ? [{ type: 'text', value: '[' }, ...node.children, { type: 'text', value: ']' }] : [];
  const inline = [{ type: 'text', value: `${leaf ? '::' : ':'}${node.name}` }, ...label];
  ctx.replaceNode(node, leaf ? { type: 'paragraph', children: inline } : inline);
}

/* Blocs de code */

/** Titre d'un bloc de code, lu dans ses métadonnées : ```spl title="…" */
function codeTitle(meta) {
  return /title="([^"]*)"/.exec(meta ?? '')?.[1] ?? '';
}

function code(node, ctx) {
  // Un bloc déjà enveloppé est revisité après remplacement : on le reconnaît à sa marque.
  if (node.data?.framed) return;
  const lang = (node.lang ?? '').toLowerCase();
  const label = lang in LANG_LABELS ? LANG_LABELS[lang] : lang.toUpperCase();
  const title = codeTitle(node.meta);
  const head =
    `<figure class="code">` +
    `<figcaption>` +
    `<span class="code-info">` +
    (label ? `<span class="code-lang">${escapeHtml(label)}</span>` : '') +
    (title ? `<span class="code-title">${escapeHtml(title)}</span>` : '') +
    `</span>` +
    `<button type="button" class="code-copy" data-action="copy-code">${iconSvg('copy', 'sm')}Copier</button>` +
    `</figcaption>`;
  if (FILTER_LANGS.has(lang)) {
    const body = `<pre tabindex="0" data-language="${lang}"><code>${highlightFilter(node.value)}</code></pre>`;
    ctx.replaceNode(node, { type: 'html', value: `${head}${body}</figure>` });
    return;
  }
  ctx.replaceNode(node, [
    { type: 'html', value: head },
    { ...node, data: { ...node.data, framed: true } },
    { type: 'html', value: '</figure>' },
  ]);
}

/* Tableaux */

function table(node, ctx) {
  const rows = node.children ?? [];
  const firstCell = (row) => row.children?.[0];
  // Sans ligne vide entre un tableau et le `:::` qui ferme le bloc, le `:::` devient une ligne du tableau.
  if (rows.some((row) => (firstCell(row)?.children?.[0]?.value ?? '').trim().startsWith(':::'))) {
    throw new Error(
      `Bloc « ::: » mal fermé${location(ctx)} : laisser une ligne vide entre le tableau et le « ::: » de fermeture.`,
    );
  }
  // Première colonne : le code (filtre, commande) est coloré.
  for (const row of rows.slice(1)) {
    for (const child of firstCell(row)?.children ?? []) {
      if (child.type === 'inlineCode') {
        ctx.replaceNode(child, { type: 'html', value: `<code class="hl">${highlightFilter(child.value)}</code>` });
      }
    }
  }
}

export function markdownBlocksPlugin() {
  return {
    name: 'soc-handbook-markdown-blocks',
    table,
    containerDirective: directive,
    textDirective: inlineDirective,
    leafDirective: inlineDirective,
    code,
  };
}

/** Intégration Astro : active les blocs `:::` et ajoute le plugin au moteur Markdown. */
export function markdownBlocks() {
  return {
    name: 'soc-handbook-markdown-blocks',
    hooks: {
      'astro:config:setup': ({ config }) => {
        const processor = config.markdown?.processor;
        if (processor?.name !== 'satteri' || !Array.isArray(processor.options?.mdastPlugins)) {
          throw new Error('Blocs Markdown : moteur Markdown Sätteri attendu.');
        }
        processor.options.features = { ...processor.options.features, directive: true };
        processor.options.mdastPlugins.push(markdownBlocksPlugin);
      },
    },
  };
}
