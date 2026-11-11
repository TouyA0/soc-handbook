// Atelier de l'image de partage (public/og.png, 1200 × 630).
//
// L'image est dessinée par scripts/og/og.html dans un navigateur, qui charge les polices du site (woff2)
// et lit les couleurs de src/styles/tokens.css : aucune valeur de style n'est recopiée ici.
// Ce serveur local sert la page et enregistre le PNG qu'elle lui renvoie.
//
//   npm run og            puis ouvrir http://localhost:4399/ et cliquer « Enregistrer public/og.png »
//
// Aucune dépendance : Node.js seul. Rien dans le build ne dépend de ce dossier.

import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROFILE } from '../../src/data/profile.ts';
import { SITE } from '../../src/data/site.ts';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const OUT = join(ROOT, 'public', 'og.png');
const PORT = Number(process.env.PORT ?? 4399);

/** Seuls ces dossiers du dépôt sont servis. */
const ALLOWED = ['scripts/og', 'src/assets/fonts', 'src/styles'].map((d) => join(ROOT, d) + sep);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2',
};

/** PNG 1200 × 630 : signature, puis largeur et hauteur de l'en-tête IHDR. */
function isOgPng(buf) {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return (
    buf.length > 24 &&
    sig.every((b, i) => buf[i] === b) &&
    buf.readUInt32BE(16) === 1200 &&
    buf.readUInt32BE(20) === 630
  );
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(302, { location: '/scripts/og/og.html' }).end();
    return;
  }

  if (req.method === 'GET' && url.pathname === '/data.json') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ site: SITE.name, name: PROFILE.name }));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/save') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buf = Buffer.concat(chunks);
    if (!isOgPng(buf)) {
      res.writeHead(400).end('PNG 1200 × 630 attendu');
      return;
    }
    await writeFile(OUT, buf);
    console.log(`public/og.png enregistré (${(buf.length / 1024).toFixed(1)} Ko)`);
    res.writeHead(200).end('ok');
    return;
  }

  if (req.method === 'GET') {
    const file = normalize(join(ROOT, decodeURIComponent(url.pathname)));
    if (ALLOWED.some((dir) => file.startsWith(dir))) {
      try {
        const body = await readFile(file);
        res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
        res.end(body);
        return;
      } catch {
        // fichier absent : 404 ci-dessous
      }
    }
    res.writeHead(404).end(`Introuvable : ${relative(ROOT, file)}`);
    return;
  }

  res.writeHead(405).end();
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Atelier de l'image de partage : http://localhost:${PORT}/`);
});
