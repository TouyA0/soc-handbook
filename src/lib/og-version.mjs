// Version de l'image de partage : empreinte courte de public/og.png, ajoutée à son adresse (`og.png?v=…`).
// Elle change avec l'image, ce qui oblige LinkedIn, Discord ou Slack à la recharger au lieu de resservir
// l'ancienne de leur cache. Le build se lance à la racine du dépôt. L'image se régénère avec `npm run og`.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

/** @type {string} */
export const OG_VERSION = createHash('sha256').update(readFileSync('public/og.png')).digest('hex').slice(0, 8);
