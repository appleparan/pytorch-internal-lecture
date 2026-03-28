import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const distDir = join(import.meta.dirname, "..", "dist");

function readBuildOutput(pagePath: string): string {
  const filePath = join(distDir, pagePath, "index.html");
  if (!existsSync(filePath)) {
    throw new Error(`Build output not found: ${filePath}. Run 'bun run build' first.`);
  }
  return readFileSync(filePath, "utf-8");
}

describe("Table of Contents", () => {
  let lectureHtml: string;
  let indexHtml: string;

  beforeAll(() => {
    lectureHtml = readBuildOutput("lectures/02-eager-mode");
    indexHtml = readBuildOutput("");
  });

  it("renders ToC sidebar on lecture pages", () => {
    expect(lectureHtml).toContain('class="toc-sidebar"');
    expect(lectureHtml).toContain('class="toc-list"');
  });

  it("does not render ToC on index page", () => {
    expect(indexHtml).not.toContain("toc-sidebar");
    expect(indexHtml).not.toContain("lecture-grid");
  });

  it("renders lecture-grid wrapper on lecture pages", () => {
    expect(lectureHtml).toContain('class="lecture-grid"');
  });

  it("contains h2 ToC items for lecture headings", () => {
    const h2Items = lectureHtml.match(/toc-item toc-h2/g);
    expect(h2Items).not.toBeNull();
    expect(h2Items!.length).toBeGreaterThan(0);
  });

  it("contains h3 ToC items for subsections", () => {
    const h3Items = lectureHtml.match(/toc-item toc-h3/g);
    expect(h3Items).not.toBeNull();
    expect(h3Items!.length).toBeGreaterThan(0);
  });

  it("ToC links point to heading IDs with # prefix", () => {
    const tocLinkPattern = /class="toc-item toc-h\d"><a href="#[^"]+"/g;
    const matches = lectureHtml.match(tocLinkPattern);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThan(0);
  });

  it("has accessible ToC title with aria-labelledby", () => {
    expect(lectureHtml).toContain('id="toc-heading"');
    expect(lectureHtml).toContain('aria-labelledby="toc-heading"');
  });

  it("heading elements have id attributes for ToC anchoring", () => {
    const headingWithId = lectureHtml.match(/<h2 id="[^"]+"/g);
    expect(headingWithId).not.toBeNull();
    expect(headingWithId!.length).toBeGreaterThan(0);
  });
});

describe("ToC across all lecture pages", () => {
  const lecturePages = [
    "lectures/01-technical-background",
    "lectures/02-eager-mode",
    "lectures/03-graph-mode",
    "lectures/04-automatic-differentiation",
    "lectures/05-distributed-programming",
    "lectures/06-beyond-pytorch",
    "lectures/07-cpu-gpu-npu",
  ];

  it.each(lecturePages)("%s has ToC sidebar", (page) => {
    const html = readBuildOutput(page);
    expect(html).toContain('class="toc-sidebar"');
    expect(html).toContain('class="lecture-grid"');
  });
});
