// Liens internes : écrits en relatif vers le fichier Markdown cible (`../02-outils/wireshark.md#dns`),
// réécrits vers l'URL du site et vérifiés au build.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;
const MARKDOWN = /\.mdx?$/i;

/** Identifiant d'une entrée (= chemin d'URL) à partir de son fichier ; `null` hors du dossier de contenu. */
export function fileToId(file, contentDir) {
  const rel = path.relative(contentDir, file).split(path.sep).join('/');
  if (rel.startsWith('..')) return null;
  return rel.replace(MARKDOWN, '').replace(/(^|\/)index$/, '').replace(/\/$/, '');
}

/**
 * Résout un lien trouvé dans `fromFile`.
 * Renvoie `null` pour un lien externe ou une ancre, `{ id, hash }` pour un lien interne valide,
 * et lève une erreur si le lien interne est mal formé ou pointe vers un fichier absent.
 */
export function resolveInternalLink(url, fromFile, contentDir) {
  if (EXTERNAL.test(url)) return null;
  const [target, hash = ''] = url.split('#');
  const where = path.relative(process.cwd(), fromFile);
  if (target.startsWith('/') || !MARKDOWN.test(target)) {
    throw new Error(
      `Lien interne invalide « ${url} » dans ${where} : utiliser un chemin relatif vers le fichier .md ou .mdx cible.`,
    );
  }
  const file = path.resolve(path.dirname(fromFile), decodeURI(target));
  const id = fileToId(file, contentDir);
  if (id === null || !fs.existsSync(file)) {
    throw new Error(`Lien interne cassé « ${url} » dans ${where} : fichier introuvable.`);
  }
  return { id, hash: hash ? `#${hash}` : '' };
}

/**
 * Identifiants des pages vers lesquelles pointe le corps Markdown d'une page.
 * Lève une erreur au premier lien interne invalide ou cassé : le moteur Markdown ne fait
 * que journaliser les erreurs de rendu, c'est donc cet appel qui fait échouer le build.
 * Les blocs et extraits de code sont ignorés.
 * @param {string} filePath chemin du fichier source
 * @param {string} body corps Markdown
 * @param {string} contentDir dossier des pages
 * @returns {string[]}
 */
export function bodyLinkIds(filePath, body, contentDir) {
  const fromFile = path.resolve(filePath);
  const root = path.resolve(contentDir);
  const prose = body.replace(/^(```|~~~)[\s\S]*?^\1[^\n]*$/gm, '').replace(/`[^`\n]*`/g, '');
  const ids = new Set();
  for (const match of prose.matchAll(/\]\(\s*<?([^)\s>]+)/g)) {
    const resolved = resolveInternalLink(match[1], fromFile, root);
    if (resolved) ids.add(resolved.id);
  }
  return [...ids];
}

/**
 * Plugin mdast pour Sätteri, le moteur Markdown d'Astro.
 * Options : `base` (préfixe d'URL du site) et `contentDir` (dossier des pages).
 */
export function internalLinksPlugin({ base = '', contentDir }) {
  const root = path.resolve(contentDir);
  const prefix = base.replace(/\/$/, '');
  const rewrite = (node, ctx) => {
    const fromFile = ctx.fileURL?.protocol === 'file:' ? fileURLToPath(ctx.fileURL) : undefined;
    if (!fromFile || fileToId(fromFile, root) === null) return;
    const resolved = resolveInternalLink(node.url, fromFile, root);
    if (resolved) ctx.setProperty(node, 'url', `${prefix}/${resolved.id}${resolved.id ? '/' : ''}${resolved.hash}`);
  };
  return { name: 'soc-handbook-internal-links', link: rewrite, definition: rewrite };
}

/** Intégration Astro : ajoute le plugin au moteur Markdown configuré. */
export function internalLinks(options) {
  return {
    name: 'soc-handbook-internal-links',
    hooks: {
      'astro:config:setup': ({ config }) => {
        const processor = config.markdown?.processor;
        if (processor?.name !== 'satteri' || !Array.isArray(processor.options?.mdastPlugins)) {
          throw new Error('Vérification des liens internes : moteur Markdown Sätteri attendu.');
        }
        processor.options.mdastPlugins.push(() => internalLinksPlugin(options));
      },
    },
  };
}
