# AGENTS.md - PyTorch Internal Lecture Slidev Conversion Guide

## Project Overview

This project converts a Korean-language lecture series on PyTorch internals into Slidev (sli.dev) presentations. The lectures are from "모두의 연구소 PyTorch + NPU랩" and cover PyTorch internals from fundamentals to advanced hardware topics.

- **Framework**: Slidev (sli.dev) with `@slidev/theme-seriph`
- **Language**: Korean (한국어) with English technical terms preserved as-is
- **Source material**: 7 PDF lecture files in `lecture_files/` (git-ignored)
- **Target**: One `.md` file per lecture in `slides/` directory, plus a main `slides.md` entry point

## Lecture Series Structure

The series is divided into two parts:

### Part 1: PyTorch Internal 기초 (Fundamentals, Weeks 1-4)

| Week | File | Title | Slides | Key Topics |
|------|------|-------|--------|------------|
| 1 | `01-technical-background.md` | Pytorch의 기술적인 배경 | ~19 | ML stack overview, heterogeneous computing, course roadmap |
| 2 | `02-eager-mode.md` | Pytorch Eager Mode | ~25 | High-level architecture (Front-End → Dispatcher → Device Backend → Device Runtime), torch.matmul call stack (55 levels), Python/C++ boundary (pybind11), auto-generated code, native_functions.yaml, Dispatcher as reimplemented vtables |
| 3 | `03-graph-mode.md` | Pytorch Graph Mode | ~30 | Tracing (CFG, trace cache, partial evaluation), jit.trace → jit.script → Dynamo evolution, CPython internals (Compiler → Bytecode → VM), Python VM (Runtime/Interpreter/Thread/Frame/Eval loop), TorchDynamo, IR lowering, device backend |
| 4 | `04-automatic-differentiation.md` | Automatic Differentiation in Pytorch | ~25 | Supervised learning (forward/backward), reverse-mode autodiff, chain rule, computation graph, Pytorch 1.0 Autograd (Dispatcher-based incremental graph), Pytorch 2.0 AOTAutograd, backward() call chain |

### Part 2: PyTorch Internal 심화 (Advanced, Weeks 5-8)

| Week | File | Title | Slides | Key Topics |
|------|------|-------|--------|------------|
| 5 | `05-distributed-programming.md` | Distributed Programming in Pytorch | ~25 | MPI vs OpenMP, distributed concepts (Node/Process/World/Rank/Rendezvous), torch.distributed (DDP/FSDP/TP/SP/PP), c10d layer, collective ops (scatter/gather/reduce/allreduce/broadcast/allgather), backends (Gloo/NCCL/MPI), torchrun |
| 6 | `06-beyond-pytorch.md` | Beyond Pytorch: Custom Kernel과 vLLM | ~47 | LLM serving optimization (prefill vs decode, roofline analysis, memory wall), memory overhead reduction (continuous batching, speculative decoding, Flash Attention, Paged Attention, quantization/sparsity), kernel programming (CUDA, cuTLASS, OpenAI Triton), serving frameworks (vLLM architecture, model support, optimizations) |
| 7 | `07-cpu-gpu-npu.md` | CPU / GPU / NPU | ~55 | Processor design (ISA → microarchitecture), latency/throughput/latency hiding, instruction-level pipelining (pipeline stages, branch delay, branch prediction), loop-level pipelining (OOO processor vs VLIW), thread-level pipelining (multi-core, GPU SIMT/warps, NPU DMA/compiler), GPU vs NPU comparison (HW vs SW pipelining) |

> **Note**: Week 8 (리벨리온 NPU) is not included in the PDF files.

## Content Conversion Guidelines

### Slide Separation

Each `---` in Slidev creates a new slide. One PDF/PPTX page generally maps to one Slidev slide, but this is **not a strict 1:1 rule**. When a single source slide contains dense content (e.g., multiple distinct topics, long bullet lists, or detailed sub-sections), split it into 2 or more Slidev slides for readability. Conversely, very thin slides (e.g., a single line or image) can sometimes be merged. Prioritize **clarity and readability** over rigid page-to-slide mapping.

### Frontmatter per Lecture File

```yaml
---
theme: seriph
title: "Lecture Title"
info: |
  모두의 연구소 PyTorch + NPU랩
  Week N - YYYY-MM-DD
transition: slide-left
mdc: true
---
```

### Slide Layout Patterns

Use these Slidev layouts based on the original slide content type:

| PDF Content Type | Slidev Layout | Notes |
|---|---|---|
| Title slide | `layout: cover` | Lecture title + date + "모두의 연구소 PyTorch + NPU랩" |
| Agenda / TOC | `layout: default` | Bulleted list with current section highlighted |
| Text + diagram side-by-side | `layout: two-cols` | Use `::right::` separator |
| Full-page diagram | `layout: image` or `layout: center` | Consider embedding as image or recreating with Mermaid |
| Code walkthrough | `layout: default` | Use Slidev code blocks with line highlighting |
| Architecture diagram | `layout: default` | Use Mermaid diagrams where possible |
| Summary / recap | `layout: default` | Bulleted list |
| "감사합니다" (Thank you) | `layout: center` with `class: text-center` | End slide |

### Technical Diagrams

Many slides contain architecture diagrams. Handle them as follows:

1. **Mermaid-convertible**: Architecture flows, sequence diagrams, tree structures → Use Mermaid
2. **Simple block diagrams**: Stack diagrams, pipeline stages → Use HTML/CSS with grid or flexbox
3. **Complex figures**: Roofline plots, hardware block diagrams, paper figures → Save as images in `public/images/XX/` (where XX = lecture number) and reference with `![alt](/images/XX/filename.png)`

### Code Blocks

The lectures contain code examples in Python, C++, CUDA, and assembly (RISC-V). Use Slidev's code highlighting:

```md
```python {all|2|4-6}
# Line highlighting with click animations
import torch
x = torch.randn(3, 4)
y = torch.matmul(x, x.T)
```
```

For call stack visualizations (e.g., Lecture 02's 55-level torch.matmul stack), use `v-click` animations to reveal layers progressively.

### Mathematical Notation

Several lectures use math (Lecture 04 autodiff, Lecture 06 softmax formulas, Lecture 07 roofline). Use KaTeX:

```md
$$
y_i = \frac{e^{x_i - \max_k x_k}}{\sum_{j=1}^{V} e^{x_j - \max_k x_k}}
$$
```

### Click Animations

Use `v-click` for progressive reveals, especially for:
- Agenda slides that highlight the current section (use orange dashed borders like the original)
- Step-by-step explanations (e.g., Flash Attention algorithm steps)
- Architecture layer reveals (e.g., going deeper into the PyTorch call stack)

### Korean Language Guidelines

- Keep all Korean text as-is from the original slides
- Technical terms remain in English: PyTorch, Tensor, Dispatcher, Eager Mode, Graph Mode, etc.
- Mixed Korean/English is normal and expected: "Pytorch의 기술적인 배경"
- Slide titles may be in English or Korean - follow the original
- Speaker notes (`<!-- -->`) can be in Korean

## Key Technical Concepts by Lecture

### Lecture 01: Technical Background
- ML Stack: Open Pretrained LLM → HuggingFace Hub/Transformers → PyTorch → Kernel Programming (Triton/CUDA/vLLM)
- Why heterogeneous computing matters for AI

### Lecture 02: Eager Mode
- Architecture: `Python Front-End → Dispatcher → Device Backend → Device Runtime`
- Call path: `torch.matmul()` → pybind11 → C++ dispatcher → device-specific kernel
- Key file: `native_functions.yaml` → code generation → dispatch tables
- Dispatcher concept: "reimplemented vtables" for operator routing

### Lecture 03: Graph Mode
- Tracing evolution: `jit.trace` → `jit.script` → `TorchDynamo`
- Dynamo integrates at CPython bytecode level (PEP 523 frame evaluation)
- CPython internals: `Compiler → Bytecode → VM (Runtime/Interpreter/Thread/Frame/Eval)`
- IR lowering pipeline: Python graph → optimized backend IR

### Lecture 04: Automatic Differentiation
- Reverse-mode autodiff via chain rule on computation graph
- Autograd 1.0: incremental graph building through Dispatcher
- AOTAutograd (2.0): ahead-of-time graph capture for backward pass
- `backward()` call chain: Python → C++ engine

### Lecture 05: Distributed Programming
- Concepts: Node, Process, World, Rank, Rendezvous
- Parallelism strategies: DDP, FSDP, TP, SP, PP
- c10d: collective ops (scatter/gather/reduce/allreduce/broadcast/allgather) + P2P
- Backends: Gloo (CPU), NCCL (GPU), MPI

### Lecture 06: Beyond PyTorch
- **LLM Inference**: Prefill (compute-bound, parallel) vs Decode (memory-bound, sequential)
- **Roofline model**: Arithmetic intensity → memory-bound vs compute-bound regions
- **Memory wall**: HW FLOPS growing 60000x/20yrs vs DRAM BW 100x/20yrs
- **Optimization techniques**:
  - Continuous batching (individual → dynamic → continuous)
  - Speculative decoding (assistant model + main model verification)
  - Flash Attention (tiling + fusion, online softmax for numerical stability)
  - Paged Attention (OS-like virtual memory for KV cache)
  - Quantization/sparsity (FP32 → sparse → INT8)
- **Kernel Programming**: CUDA → cuTLASS → cuBLAS hierarchy; OpenAI Triton as block programming alternative
- **vLLM**: PagedAttention-based serving, chunked prefill, multi-LoRA, prefix caching

### Lecture 07: CPU / GPU / NPU
- **Processor stack**: Developer → Language → Compiler → ISA → Control Logic → Datapath
- **Three approaches to performance**: Microarchitecture optimization, Compiler optimization, Programming Model
- **Latency hiding hierarchy**:
  1. Instruction-level: Pipelining (IF/ID/EX/ME/W), branch prediction
  2. Loop-level: OOO processor (HW, branch prediction + register renaming + data-flow graph) vs VLIW (SW, compiler schedules parallelism)
  3. Thread-level: Multi-core CPU, GPU (SIMT, warp-based latency hiding), NPU (DMA-based, compiler-driven)
- **Key comparison**:
  - GPU = HW pipelining, vertical encoding, similar to OOO processor
  - NPU = SW pipelining, horizontal encoding, HW details exposed to SW, similar to VLIW/reconfigurable

## File Organization

```
pytorch-internal-lecture/
├── slides.md                    # Main entry point (imports all lectures)
├── slides/
│   ├── 01-technical-background.md
│   ├── 02-eager-mode.md
│   ├── 03-graph-mode.md
│   ├── 04-automatic-differentiation.md
│   ├── 05-distributed-programming.md
│   ├── 06-beyond-pytorch.md
│   └── 07-cpu-gpu-npu.md
├── public/
│   └── images/
│       ├── 01/                  # Images for lecture 01
│       ├── 02/                  # Images for lecture 02
│       └── ...
├── components/                  # Custom Vue components if needed
├── package.json
└── AGENTS.md                    # This file
```

## Slidev Features to Leverage

- **Mermaid diagrams**: For architecture flows and tree structures
- **KaTeX**: For mathematical formulas (autodiff, softmax, roofline)
- **Code highlighting with line focus**: `{all|2|4-6}` syntax for progressive code reveals
- **`v-click` animations**: For step-by-step reveals matching the original PDF's progressive disclosure
- **`v-mark` directive**: For highlighting current agenda items (to replicate the orange dashed borders in the original)
- **Two-column layouts**: For side-by-side comparisons (CPU vs GPU, Prefill vs Decode, etc.)
- **Magic Move**: For code transformation animations (e.g., showing code evolution)
- **PlantUML**: For complex UML-style diagrams if Mermaid is insufficient

## Conversion Priority

1. Start with Lecture 01 (simplest, establishes patterns)
2. Then Lecture 02 (introduces code-heavy slides and architecture diagrams)
3. Then Lectures 03-05 (increasingly complex diagrams)
4. Finally Lectures 06-07 (most complex, dense content with many diagrams and formulas)
