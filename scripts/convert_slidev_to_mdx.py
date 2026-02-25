#!/usr/bin/env python3
"""Convert Slidev markdown files to Astro MDX format.

Usage:
    python scripts/convert_slidev_to_mdx.py slides/ src/content/lectures/

/// script
/// dependencies = []
/// ///
"""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path


# Lecture metadata
LECTURE_METADATA: dict[str, dict[str, str | int]] = {
    '01-technical-background': {
        'title': 'Pytorch의 기술적인 배경',
        'date': '2024-10-05',
        'lecture': 1,
    },
    '02-eager-mode': {
        'title': 'Pytorch Eager Mode',
        'date': '2024-10-12',
        'lecture': 2,
    },
    '03-graph-mode': {
        'title': 'Pytorch Graph Mode',
        'date': '2024-12-18',
        'lecture': 3,
    },
    '04-automatic-differentiation': {
        'title': 'Automatic Differentiation in Pytorch',
        'date': '2025-01-08',
        'lecture': 4,
    },
    '05-distributed-programming': {
        'title': 'Distributed Programming in Pytorch',
        'date': '2025-01-15',
        'lecture': 5,
    },
    '06-beyond-pytorch': {
        'title': 'Beyond Pytorch: Custom Kernel과 vLLM',
        'date': '2025-02-05',
        'lecture': 6,
    },
    '07-cpu-gpu-npu': {
        'title': 'CPU / GPU / NPU',
        'date': '2025-02-12',
        'lecture': 7,
    },
}


@dataclass(frozen=True)
class ParsedSlide:
    """A single parsed slide from Slidev markdown."""

    frontmatter: dict[str, str]
    content: str
    index: int


def parse_slidev_file(text: str) -> list[ParsedSlide]:
    """Parse a Slidev markdown file into individual slides."""
    # Split on slide separators: ---\n at the start of lines
    # Slidev uses --- as both frontmatter delimiters and slide separators
    # The pattern is: ---\n[optional frontmatter]\n---\ncontent
    # OR just: ---\ncontent (no frontmatter)

    slides: list[ParsedSlide] = []

    # Split the file into raw slide blocks
    # First, normalize: ensure file starts with ---
    text = text.strip()
    if not text.startswith('---'):
        text = '---\n' + text

    # Split on --- that appears at the start of a line
    parts = re.split(r'\n---\n', text)

    i = 0
    slide_index = 0

    while i < len(parts):
        part = parts[i].strip()

        # Check if this part looks like frontmatter (key: value lines)
        if _is_frontmatter(part):
            frontmatter = _parse_frontmatter(part)
            # Next part is the content
            content = parts[i + 1].strip() if i + 1 < len(parts) else ''
            i += 2
        else:
            frontmatter = {}
            content = part
            i += 1

        # Skip the very first empty slide if it's just the initial ---
        if slide_index == 0 and not content and not frontmatter:
            slide_index += 1
            continue

        slides.append(ParsedSlide(
            frontmatter=frontmatter,
            content=content,
            index=slide_index,
        ))
        slide_index += 1

    return slides


def _is_frontmatter(text: str) -> bool:
    """Check if a text block looks like YAML frontmatter."""
    if not text:
        return False
    lines = text.strip().split('\n')
    # Frontmatter lines should be key: value pairs
    # Common keys: layout, level, class, src
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if not re.match(r'^[\w-]+\s*:', line):
            return False
    return True


def _parse_frontmatter(text: str) -> dict[str, str]:
    """Parse simple YAML frontmatter into a dict."""
    result: dict[str, str] = {}
    for line in text.strip().split('\n'):
        line = line.strip()
        if ':' in line:
            key, _, value = line.partition(':')
            result[key.strip()] = value.strip()
    return result


def _escape_curly_braces(content: str) -> str:
    """Escape curly braces in plain text for MDX compatibility.

    Preserves curly braces inside:
    - Code blocks (``` ... ```)
    - Inline code (`...`)
    - Mermaid JSX template literals ({`...`})
    - JSX props (={...})
    - Math expressions ($...$ and $$...$$)
    """
    lines = content.split('\n')
    result: list[str] = []
    in_code_block = False
    in_mermaid = False

    for line in lines:
        # Track code blocks
        if line.strip().startswith('```'):
            in_code_block = not in_code_block
            result.append(line)
            continue

        if in_code_block:
            result.append(line)
            continue

        # Track Mermaid components (template literals)
        if '<Mermaid' in line:
            in_mermaid = True
        if in_mermaid:
            result.append(line)
            if '</Mermaid>' in line:
                in_mermaid = False
            continue

        # Skip lines that are JSX props or template literals
        if re.search(r'=\{', line) or '{`' in line or '`}' in line:
            result.append(line)
            continue

        # For remaining lines, escape { } that are NOT inside:
        # - inline code (`...`)
        # - math ($...$, $$...$$)
        result.append(_escape_line_braces(line))

    return '\n'.join(result)


def _escape_line_braces(line: str) -> str:
    """Escape curly braces in a single line, preserving inline code and math."""
    # Split the line into segments: protected (code/math) and unprotected
    # Protected segments: `...`, $...$, $$...$$
    protected_pattern = re.compile(r'(`[^`]+`|\$\$[^$]+\$\$|\$[^$]+\$)')
    parts = protected_pattern.split(line)

    result: list[str] = []
    for i, part in enumerate(parts):
        if i % 2 == 1:
            # This is a protected segment (code or math)
            result.append(part)
        else:
            # Plain text - escape curly braces
            part = part.replace('{', '\\{').replace('}', '\\}')
            result.append(part)

    return ''.join(result)


def transform_content(content: str) -> str:
    """Apply all content transformations to a slide's body."""
    # 1. Strip speaker notes (<!-- ... -->)
    content = re.sub(r'<!--[\s\S]*?-->', '', content)

    # 2. Replace <v-clicks>...</v-clicks> with <Reveal>...</Reveal>
    content = content.replace('<v-clicks>', '<Reveal>')
    content = content.replace('</v-clicks>', '</Reveal>')

    # 3. Replace <v-click>...</v-click> with <Reveal items={false}>...</Reveal>
    content = content.replace('<v-click>', '<Reveal items={false}>')
    content = content.replace('</v-click>', '</Reveal>')

    # 4. Replace <div v-click ...>...</div> with <Reveal items={false}><div ...>...</div></Reveal>
    # Match the div v-click pattern and its content up to the matching </div>
    content = re.sub(
        r'<div\s+v-click\s+([^>]*)>([\s\S]*?)</div>',
        r'<Reveal items={false}><div \1>\2</div></Reveal>',
        content,
    )

    # 5. Remove Vue navigation blocks
    content = re.sub(
        r'<div\s+class="abs-tl[^"]*">\s*<span\s+@click="\$slidev\.nav\.go\(\d+\)"[^>]*>.*?</span>\s*</div>',
        '',
        content,
        flags=re.DOTALL,
    )

    # 6. Replace abs-tl class (Slidev-specific)
    content = content.replace('abs-tl', 'absolute top-0 left-0')

    # 6b. Fix self-closing HTML tags for JSX compatibility
    content = re.sub(r'<br\s*>', '<br />', content)
    content = re.sub(r'<hr\s*>', '<hr />', content)
    content = re.sub(r'<img\s+([^>]*[^/])>', r'<img \1 />', content)

    # 7. Convert code block line highlighting: {all|1-2|3} -> {1-2, 3}
    def convert_code_highlight(match: re.Match[str]) -> str:
        lang = match.group(1)
        spec = match.group(2)
        parts = [p.strip() for p in spec.split('|') if p.strip() != 'all']
        if parts:
            return f'```{lang} {{{", ".join(parts)}}}'
        return f'```{lang}'

    content = re.sub(
        r'```(\w+)\s*\{([^}]+)\}',
        convert_code_highlight,
        content,
    )

    # 8. Convert mermaid blocks with scale
    def convert_mermaid_scale(match: re.Match[str]) -> str:
        scale = match.group(1)
        body = match.group(2).strip()
        # Escape backticks in mermaid content for JSX template literal
        body = body.replace('`', '\\`')
        return f'<Mermaid scale={{{scale}}}>\n{{`{body}`}}\n</Mermaid>'

    content = re.sub(
        r'```mermaid\s*\{scale:\s*([\d.]+)\}\n([\s\S]*?)```',
        convert_mermaid_scale,
        content,
    )

    # 9. Convert plain mermaid blocks
    def convert_mermaid_plain(match: re.Match[str]) -> str:
        body = match.group(1).strip()
        body = body.replace('`', '\\`')
        return f'<Mermaid>\n{{`{body}`}}\n</Mermaid>'

    content = re.sub(
        r'```mermaid\n([\s\S]*?)```',
        convert_mermaid_plain,
        content,
    )

    # 10. Escape curly braces in plain text for MDX
    # MDX treats { } as JSX expressions. We need to escape them
    # in plain text but NOT inside:
    #   - Code blocks (``` ... ```)
    #   - Mermaid components (already converted with template literals)
    #   - JSX props (items={false}, scale={0.7})
    #   - Math blocks ($...$ or $$...$$)
    content = _escape_curly_braces(content)

    # 11. Clean up excessive blank lines
    content = re.sub(r'\n{4,}', '\n\n\n', content)

    return content.strip()


def convert_file(input_path: Path, output_path: Path) -> list[str]:
    """Convert a single Slidev file to Astro MDX.

    Returns a list of warnings/issues found during conversion.
    """
    warnings: list[str] = []

    text = input_path.read_text(encoding='utf-8')
    stem = input_path.stem
    metadata = LECTURE_METADATA.get(stem, {
        'title': stem,
        'date': '2025-01-01',
        'lecture': 0,
    })

    slides = parse_slidev_file(text)

    # Generate MDX content
    lines: list[str] = []

    # Frontmatter
    lines.append('---')
    lines.append(f'title: "{metadata["title"]}"')
    lines.append(f'date: "{metadata["date"]}"')
    lines.append(f'lecture: {metadata["lecture"]}')
    lines.append('---')
    lines.append('')

    # Imports
    lines.append("import Slide from '../../components/Slide.astro';")
    lines.append("import Reveal from '../../components/Reveal.astro';")
    lines.append("import Mermaid from '../../components/Mermaid.astro';")
    lines.append('')

    slide_count = 0
    for slide in slides:
        # Skip src: import slides (these reference other files)
        if 'src' in slide.frontmatter:
            continue

        layout = slide.frontmatter.get('layout', 'default')
        css_class = slide.frontmatter.get('class', '')

        content = transform_content(slide.content)

        # Skip empty slides
        if not content.strip():
            continue

        # Build Slide tag
        attrs = ''
        if layout != 'default':
            attrs += f' layout="{layout}"'
        if css_class:
            attrs += f' class="{css_class}"'

        lines.append(f'<Slide{attrs}>')
        lines.append('')
        lines.append(content)
        lines.append('')
        lines.append('</Slide>')
        lines.append('')

        slide_count += 1

        # Check for potential issues
        if 'v-click' in content or 'v-clicks' in content:
            warnings.append(
                f'  WARNING: Residual v-click/v-clicks in slide {slide.index}'
            )
        if '@click' in content:
            warnings.append(
                f'  WARNING: Residual @click handler in slide {slide.index}'
            )
        if '<Reveal items={false}><div' in content:
            warnings.append(
                f'  FIXUP: div v-click pattern needs manual </Reveal> closing in slide {slide.index}'
            )

    output_path.write_text('\n'.join(lines), encoding='utf-8')

    return [
        f'Converted {input_path.name} -> {output_path.name}: {slide_count} slides',
        *warnings,
    ]


def main() -> None:
    """Main entry point."""
    if len(sys.argv) != 3:
        print(f'Usage: {sys.argv[0]} <input_dir> <output_dir>')
        sys.exit(1)

    input_dir = Path(sys.argv[1])
    output_dir = Path(sys.argv[2])

    if not input_dir.is_dir():
        print(f'Error: {input_dir} is not a directory')
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)

    report_lines: list[str] = ['# Conversion Report\n']

    # Process each markdown file
    md_files = sorted(input_dir.glob('*.md'))
    total_slides = 0

    for md_file in md_files:
        output_file = output_dir / f'{md_file.stem}.mdx'
        messages = convert_file(md_file, output_file)

        for msg in messages:
            print(msg)
            report_lines.append(f'- {msg}')

        # Count slides in output
        output_text = output_file.read_text(encoding='utf-8')
        slide_count = output_text.count('<Slide')
        total_slides += slide_count

    report_lines.append(f'\n**Total: {len(md_files)} files, {total_slides} slides**')

    # Write report
    report_path = Path('conversion-report.md')
    report_path.write_text('\n'.join(report_lines), encoding='utf-8')
    print(f'\nReport written to {report_path}')
    print(f'Total: {len(md_files)} files, {total_slides} slides')


if __name__ == '__main__':
    main()
