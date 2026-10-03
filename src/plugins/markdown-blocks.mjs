// Blocs de contenu écrits en Markdown :
// - encadrés et listes mises en forme, via des blocs `:::nom … :::` ;
// - blocs de code enveloppés d'un en-tête (langage, titre, bouton copier).

/** Encadrés : nom du bloc → titre affiché et couleur. */
export const CALLOUTS = {
  astuce: { label: 'Astuce', tone: 'accent' },
  piege: { label: 'Piège', tone: 'high' },
  'faux-positifs': { label: 'Faux positifs connus', tone: 'med' },
  'mon-erreur': { label: 'Mon erreur', tone: 'high' },
  'sans-spoiler': { label: 'Sans spoiler', tone: 'info' },
};

/** Blocs de mise en forme : nom du bloc → classe du conteneur. */
const WRAPPERS = {
  etapes: 'steps',
  timeline: 'timeline',
};

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

const escapeHtml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function directive(node, ctx) {
  const where = ctx.fileURL ? ` dans ${ctx.fileURL.pathname.split('/').slice(-2).join('/')}` : '';
  const callout = CALLOUTS[node.name];
  if (callout) {
    const title = {
      type: 'paragraph',
      data: { hName: 'div', hProperties: { class: 'callout-title' } },
      children: [{ type: 'text', value: callout.label }],
    };
    ctx.replaceNode(node, {
      ...node,
      data: { hName: 'aside', hProperties: { class: `callout callout-${callout.tone}`, 'data-callout': node.name } },
      children: [title, ...node.children],
    });
    return;
  }
  const wrapper = WRAPPERS[node.name];
  if (wrapper) {
    ctx.replaceNode(node, { ...node, data: { hName: 'div', hProperties: { class: wrapper } } });
    return;
  }
  const known = [...Object.keys(CALLOUTS), ...Object.keys(WRAPPERS)].join(', ');
  throw new Error(`Bloc « :::${node.name} » inconnu${where}. Blocs disponibles : ${known}.`);
}

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
    `<button type="button" class="code-copy" data-action="copy-code">Copier</button>` +
    `</figcaption>`;
  ctx.replaceNode(node, [
    { type: 'html', value: head },
    { ...node, data: { ...node.data, framed: true } },
    { type: 'html', value: '</figure>' },
  ]);
}

/**
 * Activer les blocs `:::` active aussi les formes en ligne `:nom` et `::nom`, qui avaleraient
 * des écritures courantes (« 09:12 », « id:4769 », « 88/tcp:… »). On les remet en texte tel quel.
 */
function literal(node, ctx) {
  const leaf = node.type === 'leafDirective';
  const label = node.children?.length ? [{ type: 'text', value: '[' }, ...node.children, { type: 'text', value: ']' }] : [];
  const inline = [{ type: 'text', value: `${leaf ? '::' : ':'}${node.name}` }, ...label];
  ctx.replaceNode(node, leaf ? { type: 'paragraph', children: inline } : inline);
}

/** Sans ligne vide entre un tableau et le `:::` qui ferme le bloc, le `:::` devient une ligne du tableau. */
function table(node, ctx) {
  const firstCellText = (row) => row.children?.[0]?.children?.[0]?.value ?? '';
  if (node.children?.some((row) => firstCellText(row).trim().startsWith(':::'))) {
    const where = ctx.fileURL ? ` dans ${ctx.fileURL.pathname.split('/').slice(-2).join('/')}` : '';
    throw new Error(`Bloc « ::: » mal fermé${where} : laisser une ligne vide entre le tableau et le « ::: » de fermeture.`);
  }
}

export function markdownBlocksPlugin() {
  return {
    name: 'soc-handbook-markdown-blocks',
    table,
    containerDirective: directive,
    textDirective: literal,
    leafDirective: literal,
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
