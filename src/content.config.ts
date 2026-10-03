import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { SEVERITIES, TACTIC_SLUGS } from './data/attack';
import { DIFFICULTIES, PLATFORMS } from './data/writeups';

const keys = <T extends Record<string, unknown>>(o: T) =>
  Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];

/** Frontmatter commun à toutes les pages. */
const common = {
  title: z.string().min(1),
  description: z.string().min(1),
  tags: z.array(z.string()).default([]),
  updated: z.coerce.date(),
  draft: z.boolean().default(false),
};

/** Page générique : index de section, méthodologie, fondamentaux, playbook, lab, ressources. */
const page = z.object({
  ...common,
  type: z.literal('page'),
});

const technique = z.object({
  ...common,
  type: z.literal('technique'),
  attack_id: z.string().regex(/^T\d{4}(\.\d{3})?$/, 'Identifiant ATT&CK attendu, ex. T1558.003'),
  tactic: z.enum(TACTIC_SLUGS),
  severity: z.enum(keys(SEVERITIES)),
  platforms: z.array(z.string()).default([]),
  data_sources: z.array(z.string()).default([]),
  /** Fiabilité de la détection, en texte libre (ex. « Moyenne — à corréler »). */
  detection_confidence: z.string().optional(),
  /** Write-ups où la technique a été pratiquée. */
  writeups: z.array(reference('docs')).default([]),
  /** Techniques liées, affichées en badges en fin de page. */
  related: z.array(reference('docs')).default([]),
});

const writeup = z.object({
  ...common,
  type: z.literal('writeup'),
  platform: z.enum(keys(PLATFORMS)),
  difficulty: z.enum(keys(DIFFICULTIES)),
  date: z.coerce.date(),
  /** Durée de l'exercice, en minutes. */
  duration: z.number().int().positive().optional(),
  skills: z.array(z.string()).default([]),
  /** Fiches complétées grâce au write-up (cheat sheets, techniques, playbooks). */
  enriched: z.array(reference('docs')).default([]),
});

const cheatsheet = z.object({
  ...common,
  type: z.literal('cheatsheet'),
  tool: z.string().min(1),
  /** Version de l'outil sur laquelle la fiche a été vérifiée (ex. « 4.4 »). */
  tested_version: z.string().optional(),
});

const docs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  // `type` absent du frontmatter = page générique.
  schema: z.preprocess(
    (data) => (data && typeof data === 'object' && !('type' in data) ? { ...data, type: 'page' } : data),
    z.discriminatedUnion('type', [page, technique, writeup, cheatsheet]),
  ),
});

export const collections = { docs };
