# PyTorch Internal Lecture

> **WIP** - 이 프로젝트는 현재 진행 중입니다.

PyTorch 내부 구조를 다루는 온라인 강의 자료 사이트입니다. Astro + MDX로 구축되어 있으며, KaTeX 수식, Mermaid 다이어그램, 인터랙티브 위젯 등을 포함합니다.

## Lectures

| # | 주제 |
|---|------|
| 01 | Technical Background |
| 02 | Eager Mode |
| 03 | Graph Mode |
| 04 | Automatic Differentiation |
| 05 | Distributed Programming |
| 06 | Beyond PyTorch |
| 07 | CPU, GPU, NPU |

## Getting Started

```bash
bun install
bun run dev
```

http://localhost:4321 에서 확인할 수 있습니다.

## Build

```bash
bun run build
bun run preview
```

## Tech Stack

- [Astro](https://astro.build/) + MDX
- [Tailwind CSS](https://tailwindcss.com/) v4
- [KaTeX](https://katex.org/) (수식 렌더링)
- [Mermaid](https://mermaid.js.org/) (다이어그램, pre-rendered SVG)
- [Bun](https://bun.sh/) (패키지 매니저 & 런타임)
