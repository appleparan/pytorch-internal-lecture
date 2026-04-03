/**
 * Build-time Mermaid diagram renderer.
 *
 * Extracts all <Mermaid> blocks from MDX files, renders each to SVG
 * in both light and dark themes via @mermaid-js/mermaid-cli (mmdc),
 * and writes a manifest so the Astro component can look up pre-rendered SVGs
 * by content hash at build time.
 *
 * Usage: bun run scripts/build-mermaid.ts
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const LECTURES_DIR = resolve('src/content/lectures');
const OUT_DIR = resolve('src/generated/mermaid');
const MANIFEST_PATH = join(OUT_DIR, 'manifest.json');
const PUPPETEER_CFG = resolve('puppeteer-config.json');

// ── helpers ──────────────────────────────────────────────────────────

function hash(text: string): string {
  return createHash('sha256').update(normalize(text)).digest('hex').slice(0, 12);
}

/** Normalize so minor formatting diffs don't break the hash.
 *  Must match the normalize function in Mermaid.astro.
 *  Astro's slot renderer strips leading whitespace from each line,
 *  so we do the same here for consistent hashing. */
function normalize(text: string): string {
  return text
    .trim()
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n');
}

interface Diagram {
  id: string;
  hash: string;
  source: string;
  scale: number;
  wide: boolean;
  file: string;
  index: number;
}

// ── extract ──────────────────────────────────────────────────────────

function extractDiagrams(): Diagram[] {
  const diagrams: Diagram[] = [];
  const files = readdirSync(LECTURES_DIR).filter((f) => f.endsWith('.mdx'));

  for (const file of files) {
    const content = readFileSync(join(LECTURES_DIR, file), 'utf-8');
    const slug = basename(file, '.mdx');

    // Match <Mermaid ...> ... </Mermaid>  (the content is wrapped in {`...`})
    const re = /<Mermaid(?<attrs>[^>]*)>\s*\{`(?<body>[\s\S]*?)`\}\s*<\/Mermaid>/g;
    let match: RegExpExecArray | null;
    let idx = 0;

    while ((match = re.exec(content)) !== null) {
      const attrs = match.groups!.attrs;
      const body = match.groups!.body;

      const scaleMatch = attrs.match(/scale=\{([\d.]+)\}/);
      const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;
      const wide = /\bwide\b/.test(attrs);

      // Astro evaluates the JS template literal, so escaped chars like \"
      // become ". Hash must match what Astro's slot renderer produces.
      const unescaped = body.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
      const h = hash(unescaped);
      diagrams.push({
        id: `${slug}-${idx}`,
        hash: h,
        source: body.trim(),
        scale,
        wide,
        file,
        index: idx,
      });
      idx++;
    }
  }

  return diagrams;
}

// ── render ───────────────────────────────────────────────────────────

function renderSvg(
  source: string,
  theme: 'default' | 'dark',
  outPath: string,
  uniqueId: string,
): void {
  const tmpIn = join(OUT_DIR, '_tmp_input.mmd');
  writeFileSync(tmpIn, source);

  const puppeteerArg = existsSync(PUPPETEER_CFG) ? ` -p "${PUPPETEER_CFG}"` : '';
  execSync(
    `bunx mmdc -i "${tmpIn}" -o "${outPath}" -t ${theme} --outputFormat svg -b transparent${puppeteerArg}`,
    { stdio: 'pipe', timeout: 30_000 },
  );

  // Post-process SVG
  if (existsSync(outPath)) {
    let svg = readFileSync(outPath, 'utf-8');
    // Remove width="..." and height="..." but keep viewBox
    svg = svg.replace(/\s+width="[^"]*"/, '');
    svg = svg.replace(/\s+height="[^"]*"/, '');
    svg = svg.replace(/style="[^"]*max-width:[^"]*"/, '');
    // Replace default id="my-svg" with a unique id to prevent CSS collisions
    // when both light and dark SVGs coexist on the same page.
    svg = svg.replace(/id="my-svg"/g, `id="${uniqueId}"`);
    svg = svg.replace(/#my-svg/g, `#${uniqueId}`);
    writeFileSync(outPath, svg);
  }
}

// ── main ─────────────────────────────────────────────────────────────

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log('Extracting Mermaid diagrams from MDX files...');
  const diagrams = extractDiagrams();
  console.log(`Found ${diagrams.length} diagrams.`);

  const manifest: Record<string, { id: string; light: string; dark: string }> = {};

  for (const d of diagrams) {
    const lightFile = `${d.hash}-light.svg`;
    const darkFile = `${d.hash}-dark.svg`;
    const lightPath = join(OUT_DIR, lightFile);
    const darkPath = join(OUT_DIR, darkFile);

    // Skip if already rendered (cache by hash)
    if (!existsSync(lightPath) || !existsSync(darkPath)) {
      console.log(`  Rendering ${d.id} (${d.hash})...`);
      renderSvg(d.source, 'default', lightPath, `mermaid-${d.hash}-light`);
      renderSvg(d.source, 'dark', darkPath, `mermaid-${d.hash}-dark`);
    } else {
      console.log(`  Cached    ${d.id} (${d.hash})`);
    }

    manifest[d.hash] = { id: d.id, light: lightFile, dark: darkFile };
  }

  // Clean up temp file
  const tmpIn = join(OUT_DIR, '_tmp_input.mmd');
  if (existsSync(tmpIn)) execSync(`rm "${tmpIn}"`);

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`Manifest written to ${MANIFEST_PATH}`);
  console.log('Done!');
}

main();
