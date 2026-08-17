# Implementation Plan

## Objective

Revise Lectures 01–07 so that factual descriptions use direct technical prose,
while preserving lecturer-authored analogies and limiting them to their original
teaching scope.

## Risks and boundaries

- Preserve ideas and analogies found in the original lecture sources.
- Do not turn the style pass into a wholesale rewrite of the lecture structure.
- When a style edit touches a technical claim, verify the resulting wording
  against primary documentation or narrow the claim to the demonstrated case.
- Keep established technical terms such as Memory Wall, pipeline,
  producer/consumer, graph, and Roofline.

## Stages

### 1. Source comparison and review criteria

- [x] Compare high-risk MDX passages with the original Slidev/PPT-derived source.
- [x] Separate lecturer-authored analogies from prose added during conversion.
- [x] Record the direct-prose rules used for the edit.

### 2. Lectures 01–03

- [x] Replace narrative history and indirect metaphors with descriptive prose.
- [x] Keep technical scope and examples intact.
- [x] Correct nearby terminology where the reviewed sentence is already changing.

### 3. Lectures 04–05

- [ ] Replace magic, shell/core, bridge, and switchboard metaphors.
- [ ] State AOTAutograd and distributed framework responsibilities explicitly.

### 4. Lectures 06–07

- [ ] Replace marketing and convergence language with descriptive headings.
- [ ] Preserve OOO : VLIW = GPU : NPU as the original scheduling analogy and
      state its scope.
- [ ] Explain GEMM epilogue before epilogue warp terminology.
- [ ] Identify the thread or warp role that issues TMA and tcgen05 operations.

### 5. Verification and delivery

- [ ] Review the full diff for tone, technical scope, and source preservation.
- [ ] Run repository-wide quality checks and the Astro production build.
- [ ] Record completed stages and verification results in issue #27.
- [ ] Remove this temporary plan before the final commit.
- [ ] Push the branch and open a PR that closes issue #27.

## Success criteria

- All seven lectures favor direct subject-action-object explanations.
- Analogies are retained only when original or materially useful, and are marked
  as limited comparisons rather than architectural identities.
- No undefined epilogue warp-group terminology remains in Lecture 07.
- The production build passes.
