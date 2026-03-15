#!/usr/bin/env node
/**
 * Convert slide-format MDX files to prose (article) format.
 *
 * Removes:
 *   - import Slide / import Reveal lines
 *   - <Slide ...> / </Slide> tags
 *   - <Reveal ...> / </Reveal> tags
 *
 * Inserts `---` (horizontal rule) between former slide sections for readability.
 * Keeps Mermaid imports and all other content intact.
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const lecturesDir = join(import.meta.dirname, '..', 'src', 'content', 'lectures');

const files = readdirSync(lecturesDir).filter(f => f.endsWith('.mdx')).sort();

for (const file of files) {
  const filePath = join(lecturesDir, file);
  const original = readFileSync(filePath, 'utf8');

  let lines = original.split('\n');
  const result = [];
  let inFrontmatter = false;
  let frontmatterCount = 0;
  let prevWasSlideClose = false;
  let isFirstSlide = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track frontmatter
    if (trimmed === '---') {
      frontmatterCount++;
      if (frontmatterCount === 1) inFrontmatter = true;
      if (frontmatterCount === 2) inFrontmatter = false;
      result.push(line);
      continue;
    }

    if (inFrontmatter) {
      result.push(line);
      continue;
    }

    // Remove import lines for Slide and Reveal
    if (/^import\s+Slide\s+from\s+/.test(trimmed)) continue;
    if (/^import\s+Reveal\s+from\s+/.test(trimmed)) continue;

    // Remove <Slide ...> opening tags
    if (/^<Slide[\s>]/.test(trimmed) || trimmed === '<Slide>') {
      // Insert separator between slides (not before the first one)
      if (!isFirstSlide) {
        // Add --- separator, but avoid double blank lines
        result.push('');
        result.push('---');
        result.push('');
      }
      isFirstSlide = false;
      prevWasSlideClose = false;
      continue;
    }

    // Remove </Slide> closing tags
    if (trimmed === '</Slide>') {
      prevWasSlideClose = true;
      continue;
    }

    // Remove <Reveal ...> and </Reveal> tags
    // Handle single-line: <Reveal items={false}><content></Reveal>
    if (/^<Reveal[^>]*>.*<\/Reveal>\s*$/.test(trimmed)) {
      // Extract content between tags
      const content = trimmed
        .replace(/^<Reveal[^>]*>/, '')
        .replace(/<\/Reveal>\s*$/, '');
      if (content.trim()) {
        result.push(line.replace(trimmed, content));
      }
      continue;
    }

    if (/^<Reveal[\s>]/.test(trimmed) || trimmed === '<Reveal>') continue;
    if (trimmed === '</Reveal>') continue;

    result.push(line);
  }

  // Clean up: remove excessive blank lines (3+ consecutive → 2)
  let output = result.join('\n');
  output = output.replace(/\n{4,}/g, '\n\n\n');
  // Remove trailing whitespace on lines
  output = output.replace(/[ \t]+$/gm, '');
  // Ensure file ends with single newline
  output = output.trimEnd() + '\n';

  writeFileSync(filePath, output, 'utf8');
  console.log(`Converted: ${file}`);
}

console.log('\nDone! All lecture files converted to prose format.');
