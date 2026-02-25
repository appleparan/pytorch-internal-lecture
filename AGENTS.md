# AGENTS.md - PyTorch Internal Lecture Presentation Guide

## Project Overview

This project is a presentation system for a Korean-language lecture series on PyTorch internals, built with **Astro + MDX**. The lectures are from "모두의 연구소 PyTorch + NPU랩" and cover PyTorch internals from fundamentals to advanced hardware topics.

- **Framework**: Astro 5.x with MDX, Tailwind CSS v4
- **Language**: Korean (한국어) with English technical terms preserved as-is
- **Source material**: 7 PPTX lecture files in `lecture_files/` (git-ignored)
- **Target**: One `.mdx` file per lecture in `src/content/lectures/`, served as interactive slide decks

## Lecture Series Structure

### Part 1: PyTorch Internal 기초 (Fundamentals, Weeks 1-4)

| Week | File | Title | Slides |
|------|------|-------|--------|
| 1 | `01-technical-background.mdx` | Pytorch의 기술적인 배경 | 24 |
| 2 | `02-eager-mode.mdx` | Pytorch Eager Mode | 76 |
| 3 | `03-graph-mode.mdx` | Pytorch Graph Mode | 31 |
| 4 | `04-automatic-differentiation.mdx` | Automatic Differentiation in Pytorch | 36 |

### Part 2: PyTorch Internal 심화 (Advanced, Weeks 5-8)

| Week | File | Title | Slides |
|------|------|-------|--------|
| 5 | `05-distributed-programming.mdx` | Distributed Programming in Pytorch | 38 |
| 6 | `06-beyond-pytorch.mdx` | Beyond Pytorch: Custom Kernel과 vLLM | 48 |
| 7 | `07-cpu-gpu-npu.mdx` | CPU / GPU / NPU | 57 |

**Total: 310 slides across 7 lectures**

## Architecture

### Astro Components (`src/components/`)

| Component | Purpose | Props |
|-----------|---------|-------|
| `Slide.astro` | Slide container | `layout`: `default` / `cover` / `center`; `class`: additional CSS |
| `Reveal.astro` | Progressive disclosure (click-to-reveal) | `items`: `true` (reveal children one-by-one) / `false` (reveal whole block) |
| `Mermaid.astro` | Mermaid diagram rendering (client-side) | `scale`: number (default 1.0) |

### Slide Engine (`src/scripts/slide-engine.js`)

Vanilla JS navigation system:
- **Keyboard**: ←→ arrows, Space, PageUp/Down, Home/End, Escape (back to index)
- **Progressive reveal**: `<Reveal>` children shown one at a time before advancing
- **URL hash**: `#slide-N` for direct access (1-indexed)
- **Touch**: Swipe left/right for mobile navigation
- **Counter**: Shows `current / total` in bottom-right nav bar

### Content Collections (`src/content.config.ts`)

Schema: `title` (string), `date` (string), `lecture` (number)

### Plugins

- **remark-math** + **rehype-katex**: LaTeX math rendering
- **Shiki** (one-dark-pro): Code syntax highlighting
- **mermaid.js**: Client-side diagram rendering
- **Tailwind CSS v4**: Utility-first styling

## MDX Slide Format

Each lecture MDX file follows this pattern:

```mdx
---
title: "Lecture Title"
date: "YYYY-MM-DD"
lecture: N
---

import Slide from '../../components/Slide.astro';
import Reveal from '../../components/Reveal.astro';
import Mermaid from '../../components/Mermaid.astro';

<Slide layout="cover">
# Week N: Title
Pytorch + NPU 온라인 모임 #N | YYYY-MM-DD
</Slide>

<Slide>
## Content Slide
Regular markdown content with Tailwind CSS classes.

<Reveal>
- Item revealed on first click
- Item revealed on second click
</Reveal>
</Slide>

<Slide>
## Mermaid Diagram

<Mermaid scale={0.7}>
{`graph LR
    A --> B --> C`}
</Mermaid>
</Slide>

<Slide layout="center">
## Thank You!
</Slide>
```

### MDX Gotchas

- **Curly braces**: `{` and `}` in plain text must be escaped as `\{` and `\}` (MDX treats them as JSX)
- **Self-closing tags**: Use `<br />` and `<img ... />` (not `<br>` or `<img>`)
- **HTML + Markdown**: Ensure blank lines between `<div>` tags and markdown content
- **Math**: `$...$` inline and `$$...$$` display math work via remark-math

## File Organization

```
pytorch-internal-lecture/
├── src/
│   ├── content/
│   │   └── lectures/          # 7 MDX lecture files
│   ├── components/            # Slide, Reveal, Mermaid components
│   ├── layouts/               # LectureLayout.astro
│   ├── pages/
│   │   ├── index.astro        # Lecture listing page
│   │   └── lectures/
│   │       └── [...slug].astro # Dynamic lecture routes
│   ├── scripts/
│   │   └── slide-engine.js    # Vanilla JS slide navigation
│   ├── styles/
│   │   └── global.css         # Tailwind v4 + slide styles
│   └── content.config.ts      # Content Collection schema
├── public/
│   └── images/01~07/          # 232 lecture images
├── scripts/
│   ├── convert_slidev_to_mdx.py  # Slidev→MDX converter
│   ├── extract_pptx.py           # PPTX content extractor
│   └── extract_images.py         # PPTX image extractor
├── slides/                    # Original Slidev source (reference)
├── astro.config.mjs
├── package.json
└── AGENTS.md
```

## Development

```bash
bun install         # Install dependencies
bun run dev         # Start dev server (localhost:4321)
bun run build       # Build static site to dist/
bun run preview     # Preview production build
```

## Conversion Script

To re-convert Slidev sources to MDX:

```bash
uv run --script scripts/convert_slidev_to_mdx.py slides/ src/content/lectures/
```

The script handles: slide separation, v-clicks→Reveal, mermaid blocks, speaker note removal, curly brace escaping, self-closing tags, and code line highlighting conversion.
