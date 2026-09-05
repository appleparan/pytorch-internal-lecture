# Review: 04-automatic-differentiation.mdx (2026-09-05)

리뷰어: Claude Fable 5.1 (서브에이전트) + OpenAI Codex `gpt-6-astra`.
대상: `src/content/lectures/04-automatic-differentiation.mdx` (1033행). 읽기 전용 리뷰, 수정 없음.

## TL;DR

- **AI slop / 용어**: 중간. 수사 의문문 warm-up 5곳, "정리하면" 6곳, "바로" 13곳, "핵심" 8곳. 비표준 용어 2개: "FX Graph normalization"(11곳, 표준은 functionalization + decomposition), "backward-trigger gradient"(표준은 incoming gradient / `grad_outputs`). 두 리뷰어 일치.
- **이해도**: 낮음. AOTAutograd 4단계 파이프라인이 8–9회, "backward lowering은 lazy" 주의가 9회 반복. 후반부(Q1–Q3, MyCube 예제, 827행)는 절반으로 줄여도 손실 없음. 두 리뷰어 일치.
- **다이어그램**: 문제 있음. Baydin 표 이미지 `h-28`로 판독 불가, `slide22_1.png` 고아 이미지, slide25_1 설명이 그림에 없는 단계(Dynamo, lazy)를 말하고 그림에 있는 단계(unwrap/dedupe)를 빠뜨림. Codex는 추가로 Mermaid 190–207행이 forward 데이터 흐름에 backward Node 이름(`MulBackward0: ×2`, `PowBackward0: 2y`→z=16)을 섞어 오해를 유발한다고 지적(high).
- **정확성**: 핵심 메커니즘 서술 3곳이 틀림. 두 리뷰어 완전 일치.
  1. 418행 "Autograd가 fake tensor에서 동작할지 불확실" → AOTAutograd가 하는 일이 정확히 fake tensor 위에서 C++ engine을 돌리는 것. Dynamo가 못 하는 진짜 이유는 bytecode tracer라 C++ engine 내부 호출을 못 봄.
  2. 571행 "FX Graph를 C++ object로 변환해 engine에 넘김" → 존재하지 않는 메커니즘. joint 함수를 `make_fx`(FakeTensorMode + `__torch_dispatch__`) 아래서 실행.
  3. 787행 "D의 joint graph는 Torch IR, E에서 분해" → decomposition/functionalization은 tracing 중 적용. slide30 그림이 이미 `aten.maximum`을 보여줌.
- 그 외 공통 medium: 652행 "H 이전엔 backend 최적화 없음"(Inductor는 decomposition table·partition_fn·joint graph pass를 미리 공급), 462–487행 코드는 `autograd.Function`이 아니라 partition된 GraphModule, 377행 `init_to_execute()`는 `.grad()` 경로에서만 호출, 1031행 "2.x는 Python 3.8+"(2.13은 3.10+), 1033행 `TypeDefault.cpp`는 2.x에 없음.

## 두 리뷰어가 일치한 항목 (우선 수정 후보)

| line | 문제 | 제안 |
|---|---|---|
| 22/393/867 | "PyTorch 1.0의 Autograd" | Autograd는 0.1부터. "1.0"은 eager 시대를 뜻한다고 각주 |
| 100-103 | Baydin 표 `h-28`, 그래프↔표 순서, $v_i$/$\bar v_i$ 미정의, x₁ 두 경로 합산 미설명 | 그래프 먼저, 표 `h-72`, adjoint 정의 두 문장, "∂f/∂x₁ = 1/x₁ + x₂ = 5.5" 추가 |
| 190-207 | Mermaid: forward 흐름에 backward Node 이름 | forward는 `×2`, `y²`로. grad_fn 연결은 별도 역방향 그림 |
| 377-391 | `init_to_execute()`를 필수 단계로 서술 | `compute_dependencies → [.grad()일 때만 init_to_execute] → execute_with_graph_task → thread_main → evaluate_function → call_function` |
| 408/416/548/646/764 | 수사 의문문 warm-up | 삭제하고 전제 문장부터 |
| 418 | "fake tensor에서 동작할지 불확실" | "Dynamo는 bytecode tracer라 C++ engine 내부 호출을 못 봄" |
| 462-487 | "AOTAutograd가 생성한 autograd.Function" | "partition된 fw/bw FX 코드(`TORCH_LOGS=aot_graphs`)". 실제 Function은 `CompiledFunction` |
| 495 | 2.0/2.1/2.8 lazy lowering 이력이 본문에 | 각주 `[^lazy-bw]`로 이동, 9곳 반복 제거 |
| 532-702 | "normalization" 11곳 | "functionalization + decomposition" |
| 536-723 | 파이프라인 4단계 8–9회 반복 | 40행 목차 + 632-642 표만 유지 |
| 571-573 | "FX Graph → C++ object → engine" | joint 함수 + `torch.autograd.grad`를 fake tensor + `__torch_dispatch__` 기록 모드에서 실행 |
| 604 | `slide22_1.png` 고아 | 삭제 또는 799행 partition 절로 이동 |
| 611-623 | slide25_1 설명이 그림과 불일치 | 그림의 세 변환(unwrap/dedupe → functionalize/decompose → autograd wrap) 기준으로 재작성 |
| 652 | "H 이전 backend 최적화 없음" | decomposition table, partition_fn, joint_graph_passes는 backend가 공급 |
| 684/787/796 | "Torch IR → … → Prims IR" 필수 경로, joint graph는 Torch IR | joint graph는 이미 ATen. Inductor는 Core ATen에서 lowering, Prims 완전 분해는 필수 아님 |
| 825-834 | recomputation 설명 2회 | 827행 삭제 |
| 839-878 | MyCube 예제(고차 미분) | 3줄짜리 최소 cube 예제로 |
| 918-933 | Q1–Q3가 757-764 반복 | Q4·Q5만 유지 |
| 930 | "backward-trigger gradient" | "`grad_outputs`(joint graph의 `tangents_*`)" |
| 937 | Compiled Autograd "정식 기능" | "2.4 도입, 개발 중" |
| 1031-1033 | Python 3.8+, `TypeDefault.cpp` | 2.13은 3.10+. `RegisterCompositeImplicitAutograd.cpp` |

## 한쪽만 제기한 항목 (검토 필요)

- **Codex A4-1 (high) line 63**: "backpropagation이 자동화된 것이 AD" → AD가 더 넓은 개념(forward-mode 포함). backprop = reverse-mode AD의 적용.
- **Codex A4-2 (high) line 132-134**: "flag 켜진 텐서만 기록" → 입력 중 하나라도 `requires_grad`면 기록, `requires_grad=False` 입력도 backward에 필요하면 저장됨.
- **Codex A4-3 (high) line 202**: "`PowBackward0`가 2y를 반환" → incoming gradient g에 2y를 곱한 값(g·2y=8)을 반환.
- **Codex A4-4 (high) line 275**: `no_grad`가 "항상 False로 override" → factory function 예외 있음.
- **Codex A4-9 (high) line 541**: "`torch.compile`이 autograd.Function을 반환" → callable wrapper 반환, 첫 실행 시 캡처. 941행 "항상 nn.Module"도 함수 입력엔 안 맞음.
- **Codex A4-13 (high) line 759-764**: `fw_inputs`에 parameter/buffer 포함 가능함을 빠뜨려 weight gradient가 나오는 이유가 설명되지 않음.
- **Codex A4-14 (high) line 436**: "이미 최적화된 코드가 수행" → 첫 backward에서 컴파일. 495행과 충돌.
- **Codex A3-7 (high) line 525-530**: aotautograd-interpose SVG "직행 불가(training·inference 공통)" → 모든 backend가 AOTAutograd를 거친다는 일반화는 틀림. custom backend는 Dynamo FX graph를 직접 받음.
- **Codex A3-6 line 509-514**: compile-train-flow SVG에 eager loss backward 단계 없음.
- **Fable A4-9 line 126**: "operator overloading"을 `+`,`*`만 추적되는 것처럼 서술 → Baydin 분류의 AD 구현 방식 이름. `torch.matmul`도 dispatcher Autograd key에서 동일 기록.
- **Fable A4-10 line 834**: min-cut partitioner가 activation checkpointing을 대체하는 것처럼 서술 → 값싼 op만 recompute, 사용자 AC 태그는 존중.
- **Fable A4-13 line 234**: "NDEBUG 블록만 생략" → forward-mode AD 블록도 생략됐을 가능성. needs verification(`_any_has_forward_grad_result` 검색).
- **Fable A4-14 line 665**: stage 이름 `aot_stage2_autograd`/`_aot_stage2c_*`는 main에 없음. Codex는 "실제 구현에 존재"라고 반대 판정. **출처 검증 결과 v2.13.0(L2421, L2523)과 main 모두에 존재 — Codex가 맞고 Fable 항목은 기각.**
- **Fable A4-16 line 521**: "AOTDispatcher가 1차 명칭" → 한 페이지 기준. "일부 문서" 정도로.
- **Fable A4-18 line 114**: HIPS autograd와 "이름 충돌 논의" 출처 없음. needs verification.

## 출처 검증 (2026-09-05)

검증 방법: GitHub는 `curl -sL https://raw.githubusercontent.com/...`로 태그별 원문을 받아 `sed -n`/`grep -n`으로 줄 대조, docs.pytorch.org·jmlr.org는 WebFetch(막히면 PDF는 로컬 저장 후 `pdftotext`+`Read`), 태그는 인용문이 명시한 버전(v0.4.0/v1.13.1/v2.0.0/v2.1.0/v2.8.0/v2.13.0) 그대로, "main" 언급은 현재 pytorch/pytorch main HEAD로 확인.

| # | 인용 위치 | 출처 | 접근 | 판정 | 근거 (인용/줄 번호) |
|---|---|---|---|---|---|
| 1 | Codex A3-7 (line 525-530, 원문 202) | [custom backends 문서(main)](https://docs.pytorch.org/docs/main/user_guide/torch_compiler/torch.compiler_custom_backends.html) | 200 | 지지 | "It is possible to define custom backends that are called by AOTAutograd **rather than** TorchDynamo" → backend이 Dynamo FX Graph를 직접 받는 경로가 표준이고 AOTAutograd 경유는 선택 사항 |
| 2 | Codex A4-1 (line 63, 원문 226) | [Baydin et al., JMLR 2018](https://www.jmlr.org/papers/volume18/17-468/17-468.pdf) | 200 | 지지 | Abstract: "AD... is a family of techniques similar to but **more general than backpropagation**" (p.1) |
| 3 | Codex A4-2 (line 132-134, 원문 228) | [Autograd mechanics (stable)](https://docs.pytorch.org/docs/stable/notes/autograd.html) | 200 (stable→2.14로 리다이렉트, 2.13 아님) | 지지 (버전 주의) | "an operation is only recorded in the backward graph if **at least one** of its input tensors require grad" — 2.14 페이지 확인, 이 노트는 버전 간 문구가 안정적이라 2.13에도 통용 가능성 높음(직접 2.13 스냅샷은 미확인) |
| 4 | Codex A4-3 (line 202, 원문 230) | [v1.13.1 derivatives.yaml](https://github.com/pytorch/pytorch/blob/v1.13.1/tools/autograd/derivatives.yaml) | 200 | 지지 | `pow.Tensor_Scalar`: `self: pow_backward(grad, self, exponent)` (L1264-1266); `FunctionsManual.cpp` L406-412: `pow_backward = grad * (exponent * self.pow(exponent-1))` → y=4, exponent=2, grad=1 ⇒ `1*2*4=8` = "g·2y" 그대로 |
| 5 | Codex A4-4 (line 275, 원문 232) | [v2.13.0 grad_mode.py#L21-L68](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/autograd/grad_mode.py#L21-L68) | 200 | 부분지지 | "There is an exception! All factory functions... will **NOT** be affected by this mode" (L31), 예제 L69 — `no_grad` 클래스는 L22-82라 인용 범위(21-68)가 예제 일부(69)를 벗어남. 정정 범위: L21-82 |
| 6 | Codex A4-5 (line 377-391, 원문 234) | [v1.13.1 engine.cpp#L1016-L1081](https://github.com/pytorch/pytorch/blob/v1.13.1/torch/csrc/autograd/engine.cpp#L1016-L1081) | 200 | 부분지지(줄 번호 이탈) | 인용 범위는 `compute_dependencies` 본문(~1016-1044)과 `Engine::execute` 도입부(1046-1081)만 포함. 실제 `compute_dependencies→[if(!outputs.empty()) init_to_execute]→execute_with_graph_task` 체인은 **L1092-1114**에 있음(내용 자체는 정확). `thread_main`(427)→`evaluate_function`(860)→`call_function`(809,897) 체인도 확인됨 |
| 7 | Codex A4-6 (line 393, 원문 236) | [v0.4.0 function.py](https://github.com/pytorch/pytorch/blob/v0.4.0/torch/autograd/function.py) | 200 | 지지 | 파일이 실제로 존재하며 `torch.autograd.Function`(`_ContextMethodMixin` 등) 구현이 이미 완비 — Autograd/custom Function이 1.0(2018) 이전부터 있었음을 뒷받침 |
| 8 | Codex A4-7 (line 408-418, 원문 238) | [PyTorch 2.0 소개](https://docs.pytorch.org/get-started/pytorch-2.0/) | 200 | 부분지지 | "AOTAutograd leverages PyTorch's **torch_dispatch**... to trace through our Autograd engine, allowing us to capture the backwards pass **ahead-of-time**" — 메커니즘은 지지하나 이 페이지 자체는 "fake tensor"라는 단어를 쓰지 않음(대신 #9 논문이 명시) |
| 9 | Codex A4-7 (line 408-418, 원문 238) | [PyTorch 2 논문(PDF)](https://docs.pytorch.org/assets/pytorch2-2.pdf) | 200 | 지지 | §3.9 (p.7): "AOTAutograd works by running the PyTorch eager mode autograd engine on **fake tensor inputs** and recording a joint forwards and backwards graph." — 418줄 "동작할지 불확실"을 정면 반박 |
| 10 | Codex A4-8 (line 462-487, 원문 240) | [v2.13.0 graph_compile.py](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/_functorch/_aot_autograd/graph_compile.py) (앵커 없음) | 200 | 부분지지 | 이 파일 L2433: "returns a wrapped **torch.autograd.Function** with a forward and backward"까지만 확인됨. 실제 `class CompiledFunction(torch.autograd.Function)` 정의는 형제 파일 `runtime_wrappers.py` **L3441**에 있음(같은 서브패키지, 파일만 다름) |
| 11 | Codex A4-9 (line 541, 원문 242) | [torch.compile API(stable)](https://docs.pytorch.org/docs/stable/generated/torch.compile.html) | 200 (stable→2.14로 리다이렉트) | 지지 (버전 주의) | 반환형 `Callable[[_InputT], _RetT]`; "we will attempt to compile it and cache the compiled result on the code object **for future use**" — callable 반환 + 첫 실행 시 캡처 확인 |
| 12 | Codex A4-10 (line 571-573, 원문 244) | [PyTorch 2.0 소개](https://docs.pytorch.org/get-started/pytorch-2.0/) | 200 | 지지 | #9의 PT2 논문과 결합 시 "FX Graph를 C++ object로 변환" 메커니즘은 존재하지 않고 fake tensor 위에서 기존 autograd engine을 실행·기록한다는 서술과 일치 |
| 13 | Codex A4-11 (line 652, 원문 246) | [v2.13.0 compile_fx.py#L2104-L2146](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/_inductor/compile_fx.py#L2104-L2146) | 200 | 부분지지(줄 번호 이탈) | 인용 범위는 `fw_compiler_freezing`(추론 전용 freezing 경로)만 포함. "Inductor가 partition 전에 joint-graph pass 실행"의 정확한 근거는 `partition_fn` 함수(**L2273-2295**, 주석 "joint-graph passes first... Used by `_get_partition_fn`")에 있음 |
| 14 | Codex A4-12 (line 791-796, 원문 248) | [torch.compiler_ir(main)](https://docs.pytorch.org/docs/main/user_guide/torch_compiler/torch.compiler_ir.html) | 200 | 부분지지 | 페이지는 "Torch IR/ATen IR"은 언급하지 않고 **Core Aten IR**과 **Prims IR** 두 개만 설명. Prims는 "designed to interface with **compiler backends**"로 별도 목적 opset이라 "완전한 Prims 분해가 필수는 아니다"는 취지는 지지하나, 본문이 말하는 4단계(Torch→ATen→Core ATen→Prims) 자체는 이 페이지에 없음 |
| 15 | Codex A4-12 (line 791-796, 원문 248) | [v2.13.0 compile_fx.py](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/_inductor/compile_fx.py) (앵커 없음) | 200 | 지지 | 파일에 `partition_fn`/decomposition table 사용 로직 존재(#13 참고) — Inductor가 Core ATen 수준에서 lowering한다는 일반 주장과 부합 |
| 16 | Codex A4-13 (line 759-764, 원문 250) | [v2.13.0 aot_autograd.py#L3645-L3704](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/_functorch/aot_autograd.py#L3645-L3704) | 200 (단, 파일은 총 1959줄) | 부분지지(앵커 범위 밖) | 이 파일은 1959줄뿐이라 L3645-3704는 **존재하지 않음**. 실제 parameter/buffer가 graph 입력으로 들어간다는 근거는 같은 파일 **L445-500**("calling convention... first `num_params_buffers` inputs... are parameters and buffers")과 **L857-878**(`aot_module`에서 named_params/buffers를 입력에 lift)에 있음 |
| 17 | Codex A4-14 (line 436, 원문 252) | [v2.13.0 graph_compile.py#L2099-L2245](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/_functorch/_aot_autograd/graph_compile.py#L2099-L2245) | 200 | 부분지지(줄 번호 이탈) | 인용 범위는 `_compute_indices_of_inps_to_detach`+`_aot_stage2a_partition`(파티셔닝)만 포함. "첫 backward에서 backend 컴파일" 결정 로직은 `_aot_stage2b_bw_compile` 함수 안 **L2354-2369**(`compiled_bw_func = None` 후 `num_symints_saved_for_bw>0 or aot_config.force_non_lazy_backward_lowering`일 때만 즉시 컴파일)에 있음 |
| 18 | Codex A4-15 (line 937, 원문 254) | [Compiled Autograd 튜토리얼](https://docs.pytorch.org/tutorials/intermediate/compiled_autograd_tutorial.html) | 200 | 지지 | "Compiled Autograd is **under active development and is not yet compatible with all existing PyTorch features**." PyTorch 2.4 도입 명시 |
| 19 | Codex A4-15 (line 937, 원문 254) | [optimizer 컴파일 레시피](https://docs.pytorch.org/tutorials/recipes/compiling_optimizer.html) | 200 | 지지 | "(beta)" 표시된 공식 레시피 — "In this recipe, we will apply `torch.compile` to the optimizer..." optimizer 컴파일이 공식 제공됨을 확인 |
| 20 | Codex A4-16 (line 1029-1031, 원문 256) | [v2.13.0 RELEASE.md#release-compatibility-matrix](https://github.com/pytorch/pytorch/blob/v2.13.0/RELEASE.md#release-compatibility-matrix) | 200 | 지지 | 표: "2.12 \| >=3.10..." / "2.9 \| >=3.10..." / "2.8 \| >=3.9..." — 헤딩 앵커 정확, 2.9·2.12 모두 Python 3.10 이상 요구 확인. 2.13 자체 행은 없지만(v2.13.0 시점 매트릭스가 2.12까지만 등록) 2.9~2.12 추세로 2.13도 3.10+임이 사실상 확인됨(merged summary의 "2.13은 3.10+"과 부합) |
| 21 | Codex 검증메모 (line 260) | [v2.0.0 aot_autograd.py#L2174-L2181](https://github.com/pytorch/pytorch/blob/v2.0.0/torch/_functorch/aot_autograd.py#L2174-L2181) | 200 | 부분지지(줄 번호 이탈, "lazy" 키워드 없음) | 파일 전체에 "lazy" 문자열이 없음. 다만 지연 컴파일 **패턴**은 확인됨: `compiled_bw = None`(**L2139**) 선언 후 `backward()` 안 **L2313-2320**에서 `if CompiledFunction.compiled_bw is None: ... = aot_config.bw_compiler(...)`로 최초 backward 호출 시 컴파일 |
| 22 | Codex 검증메모 (line 260) | [v2.1.0 aot_autograd.py#L2780-L2787](https://github.com/pytorch/pytorch/blob/v2.1.0/torch/_functorch/aot_autograd.py#L2780-L2787) | 200 | 부분지지(줄 번호 이탈) | 인용 범위(2780-2787)는 joint 함수 tracing 코드. SymInt 저장 시 즉시 컴파일하는 예외 로직은 **L2972-2982**: `if len(symint_outs_saved_for_bw): ... compiled_bw_func = aot_config.bw_compiler(bw_module, placeholder_list)` (실패 시 "failed to eagerly compile backwards for dynamic" 경고) |
| 23 | Codex 검증메모 (line 260) | [v2.8.0 runtime_wrappers.py#L1411-L1423](https://github.com/pytorch/pytorch/blob/v2.8.0/torch/_functorch/_aot_autograd/runtime_wrappers.py#L1411-L1423) | 200 | 부분지지(줄 번호 이탈) | 인용 범위는 무관한 aliasing 코드. 실제 "Note: [Backward graph lazy lowering]"는 **L1516-1521**(클래스 `AutogradLazyBackwardCompileInfo` 주석), `copy.deepcopy(bw_module)` 호출부는 **L2346-2348**. (참고: Fable이 지목한 형제 파일 `jit_compile_runtime_wrappers.py`에도 동일 Note와 `copy.deepcopy(bw_module)`가 **L1694-1699**에 있어 교차 확인됨) |
| 24 | Fable A4-7 (원문 137, "main 소스 확인"으로만 표기, URL 없음) | pytorch/pytorch **main** HEAD `torch/csrc/autograd/engine.cpp` | 200 | 지지 | main 최신 커밋에서도 `compute_dependencies(...)`(L1425) 직후 `if (!outputs.empty()) { graph_task->init_to_execute(...); }`(L1427-1429) — `.grad()`(outputs 지정) 경로에서만 조건부 호출됨을 확인 |
| 25 | Fable A4-12 (원문 142, "TypeDefault.cpp"/"RegisterCompositeImplicitAutograd.cpp", URL 없음) | v2.13.0 `torchgen/gen.py` | 200 | 지지 | `TypeDefault.cpp`는 **주석 한 줄(L106)**에서만 예시로 언급(구식 잔재), 실제 파일명 생성 규칙은 `f"Register{dispatch_key}.cpp"`(**L2377**) → `DispatchKey.CompositeImplicitAutograd`가 실재 키(L380)이므로 `RegisterCompositeImplicitAutograd.cpp`가 실제 생성 파일명이 맞음 |
| 26 | 요약표 line 57 / Fable A4-14 vs Codex (원문 144, stage 이름 분쟁) | v2.13.0 **및** main `torch/_functorch/_aot_autograd/graph_compile.py` | 200(둘 다) | **Codex 지지 / Fable 불일치** | v2.13.0: `aot_stage2_autograd`(**L2421**), `_aot_stage2c_make_autograd_function`(**L2523**) 모두 존재. 현재 main도 동일 이름 존재(`aot_stage2_autograd` L2492, `_aot_stage2c_make_autograd_function` L2594). Fable의 "main에 없음"은 사실과 다름 — Codex의 "실제 구현에 존재"가 맞음 |
| 27 | Fable A4-13 (원문 143, "needs verification: VariableType_2.cpp에서 `_any_has_forward_grad_result` 검색") | v1.13.1 `tools/autograd/gen_variable_type.py` | 200 | 지지 | `get_any_has_forward_grad_name()`(L1482-1486)이 `f"_any_has_forward_grad_{var_names}"` 형태 변수를 생성하고 `emit_any_has_forward_grad()`(L1488-1497)가 이를 무조건(NDEBUG와 무관) 방출. `add.Tensor`는 forward-mode 규칙(`result: self_t + maybe_multiply(other_t, alpha)`, derivatives.yaml L215)을 가지므로 실제 codegen에 이 블록이 포함됨 — "NDEBUG 블록만 생략"은 과소 서술이라는 의심이 근거 있음 |

### 요약

- 총 27건: 지지 16 / 부분지지 11 / 불일치 1(#26의 Fable 쪽 주장) / 무관 0 / 접근불가 0
- 핵심 결론: Codex Axis4 항목들의 **주장 내용**(A4-1·A4-2·A4-7·A4-9·A4-10·A4-11·A4-13·A4-14·A4-15·A4-16)은 전부 사실과 부합해 신뢰도를 유지해도 된다. 다만 **GitHub 줄번호 앵커의 절반 이상(#5,6,8,10,13,14,16,17,21,22,23)이 실제 위치에서 어긋나 있어**, 리뷰를 문서에 반영할 때는 이 보고서가 제시한 정정 줄번호를 사용해야 한다 — 특히 #16(v2.13.0 `aot_autograd.py` L3645-3704)은 파일이 1959줄뿐이라 **아예 존재하지 않는 범위**였다.
- Fable A4-14(660행, "main에 stage 이름 없음")는 **불일치로 다운그레이드**해야 한다: v2.13.0과 현재 main 모두에 `aot_stage2_autograd`, `_aot_stage2c_make_autograd_function`이 존재한다(#26). 병합 요약 57행의 "직접 확인 필요" 플래그는 이제 해소됨 — Codex 쪽 서술을 채택.
- Fable A4-7(main `init_to_execute` 조건부 호출, #24)과 A4-12(TypeDefault.cpp 부재, #25), A4-13(forward-mode AD 블록 존재 의심, #27)은 모두 실제 소스로 확인되어 "needs verification" 딱지를 떼고 확정 사실로 반영해도 된다.
- Codex A4-8(#10)은 인용 파일(`graph_compile.py`)이 틀린 건 아니지만 실제 `class CompiledFunction`은 형제 파일 `runtime_wrappers.py`에 있다는 점을 수정 문구에 반영해야 한다.
- `docs/stable`로 표기된 두 인용(#3 autograd notes, #11 torch.compile)은 현재 stable이 **2.14**로 리다이렉트되어 2.13과 정확히 같은 스냅샷이 아니다 — 문서 자체 내용은 버전 간 안정적이라 판정에는 영향 없지만, 강의 노트에 "2.13 기준"이라고 못 박으려면 v2.13.0 태그 문서(archived docs)를 별도로 대조할 필요가 있다.

## 원문 리뷰

<details><summary>Fable 5.1 전문</summary>

# Review: `04-automatic-differentiation.mdx` (read-only)

대상: `/home/appleparan/src/pytorch-internal-lecture/src/content/lectures/04-automatic-differentiation.mdx` (1033줄)

## TL;DR

- **Axis 1 (슬롭/용어)**: 중간. 문장 자체는 대체로 담백하지만 수사 의문문 warm-up 5곳, "정리하면/요약하면" 6곳, "바로" 13곳이 있고, "normalization"이라는 비표준 용어가 AOTAutograd 절 전체(10곳)에서 functionalization+decomposition 대신 쓰인다.
- **Axis 2 (이해도/장황함)**: 낮음. AOTAutograd 파이프라인(joint → partition → compile → autograd.Function)이 6번, "backward lowering은 lazy" 주의가 8번 반복된다. 후반부는 절반으로 줄여도 내용 손실이 없다.
- **Axis 3 (다이어그램)**: 중간. SVG 4개와 Mermaid 3개는 본문과 일치. 문제는 (a) Baydin 표 이미지가 `h-28`로 읽을 수 없고, (b) `slide22_1.png`이 본문 언급 없이 고아 상태이며, (c) 아키텍처 그림(slide25_1)의 설명이 그림에 없는 단계를 말하고 그림에 있는 단계를 빼먹는다.
- **Axis 4 (기술 정확성)**: 중간. 큰 오류 3개 — (1) 418줄 "Autograd가 fake tensor에서 동작할지 불확실"은 571줄 해법과 모순(AOTAutograd는 실제로 fake tensor 위에서 C++ engine을 돌린다), (2) 571줄 "FX Graph를 C++ object로 변환해 engine에 넘긴다"는 존재하지 않는 메커니즘, (3) 787줄 "D의 joint graph는 Torch IR, E에서 분해"는 순서가 틀림(decomposition/functionalization은 `make_fx` tracing 중에 적용되며 slide30의 joint graph는 이미 `aten.maximum`).
- **최우선 수정 3개**: A4-1/A4-2(418·571줄 tracing 메커니즘 서술), A4-3(787줄 decomposition 순서), A2-1/A2-2(파이프라인·lazy lowering 중복 제거).

---

## Axis 1 — AI slop 및 용어

- **[A1-1] [severity: medium] line 532-702** — 인용: "AOTAutograd가 제공하는 **FX Graph normalization** 기능을 그대로 활용" → 문제: "normalization"은 PyTorch 문서·소스에 없는 용어다. 해당 기능의 표준 이름은 functionalization(`FunctionalTensorMode`/Functionalize key)과 decomposition(`torch._decomp`, `torch._refs`)이며, 532·588·589·592·602·620·636·650·699·702줄과 `aotautograd-interpose` SVG 라벨까지 총 11곳에서 반복된다. → 제안: 표준 용어 없음 — "normalization"을 삭제하고 "functionalization + decomposition"으로 풀어 쓴다. 절 제목(650 "Normalization(C/E 단계)이란?")도 "Functionalization과 Decomposition"으로.
- **[A1-2] [severity: low] line 930** — 인용: "loss function으로부터 흘러 들어오는 backward-trigger gradient (`grad_outs`)" → 문제: "backward-trigger gradient"는 만들어낸 표현. → 제안: 표준 용어는 `grad_outputs`(joint graph에서는 `tangents`). "loss에서 내려오는 incoming gradient(`grad_outputs`, joint graph의 `tangents_*`)"로.
- **[A1-3] [severity: medium] line 408, 416, 548, 646, 764** — 인용: "그런데 왜 graph mode가 도입되면 미분 엔진까지 다시 만들어야 할까요?" → 문제: 본론 앞에 붙는 수사 의문문 warm-up이 5곳(408, 416 "어떻게 생성해야 할까요?", 548 "왜 ... 어려울까요?", 646 "의문이 들 수 있습니다", 764 "왜 `grad_outs`가 필요할까요?"). 하나면 강조지만 다섯이면 패턴. → 제안: 408·548은 삭제하고 바로 전제 문장부터 시작. 646은 "Joint 함수를 만드는 이유는 recomputation이다."로. 764는 "`grad_outs`가 input인 이유:"로.
- **[A1-4] [severity: medium] line 26, 222, 507, 523, 599, 885** — 인용: "정리하면, 이 강의의 전반부는 ..." → 문제: "정리하면/요약하면" closer가 6곳. 26줄은 20줄을 그대로 다시 말한다. 599-602는 바로 위 표를 재서술. → 제안: 26줄, 599-602줄 삭제. 나머지는 "정리하면" 없이 문장 시작.
- **[A1-5] [severity: low] line 114, 408, 623, 698, 751, 773, 827, 839, 867, 898** — 인용: "구현한 것이 바로 **Autograd**입니다" → 문제: 강조 부사 "바로"가 13회. 대부분 빼도 의미가 같다. → 제안: 114 "구현한 것이 Autograd입니다", 623 "이 객체가 앞서 말한 ...", 839 "I 단계입니다" 식으로 일괄 제거.
- **[A1-6] [severity: low] line 764, 930-931** — 인용: "Backward에 필요한 재료는 ① 위에서 내려오는 gradient와 ② forward 중간 단계에서 계산된 tensor들인데" → 문제: 한 문장 안 ①② 인라인 나열. 930-931에서도 반복. → 제안: 두 항목을 bullet 두 줄로 분리.
- **[A1-7] [severity: low] line 143, 179, 188, 503, 615, 623, 640** — 인용: "`requires_grad = True`로 마킹" / "역방향으로 concatenate되어" / "리턴되기까지" → 문제: 같은 문서에서 "반환"(539, 541)과 "리턴"(615, 623), "표시"와 "마킹", "연결"과 "concatenate"가 혼용. "슬라이싱"(640)도 동사로 어색. → 제안: 마킹→표시, 리턴→반환, "concatenate되어"→"이어져", "단순 슬라이싱이 아니라"→"단순히 앞뒤로 자르는 것이 아니라".
- **[A1-8] [severity: low] line 615, 810, 816, 937** — 인용: "`requires_grad`가 켜져 있는 input tensor들이 딱 들어오는 시점부터" → 문제: 구어체 필러("딱", 810 "한 가지 흥미로운 점은", 937 "좋은 질문입니다")와 816의 강연자 자기 언급 괄호는 글에서는 소음. → 제안: 615 "input tensor가 들어오는 시점부터", 810 "Partitioner는 계산 위치까지 옮긴다.", 816 괄호 문장 삭제, 937 "좋은 질문입니다." 삭제.
- **[A1-9] [severity: low] line 232, 280, 304, 372** — 인용: "Forward에서 수행되는 AutoGrad kernel 예제" → 문제: "AutoGrad"(232)와 "Autograd" 표기 혼용. 같은 대상을 "grad function"(160), "Grad Functions"(278), "backward 클래스"(304), "`Node` 구현"(280)으로 부른다. → 제안: 표기는 "Autograd"로 통일, 대상 명칭은 "grad_fn(= `torch::autograd::Node` 서브클래스)"으로 처음 한 번 정의 후 "grad_fn"으로 통일.
- **[A1-10] [severity: low] line 22, 499, 751, 880** — 인용: "backward가 forward의 연장선처럼 자연스럽게 이어져 실행됩니다" → 문제: "자연스럽게" 4회, "핵심" 8회(59, 114, 116, 118, 234, 393, 646, 723). 사실을 덧칠하는 수식. → 제안: 모두 삭제해도 문장이 성립한다.

## Axis 2 — 이해도 / ELI5 / 장황함

- **[A2-1] [severity: high] line 536-543, 615-625, 659-663, 698-702, 723** — 인용: "AOTAutograd가 joint graph 생성 → forward/backward partitioning → 각각의 backend compilation → runtime Autograd 연결을 수행합니다" → 문제: 같은 4단계 파이프라인이 40, 434, 536-539, 543, 619-623, 632-642(표), 661-663, 698-702, 723줄 등 8~9번 등장. 독자는 "아직도 개요인가"를 반복해서 겪는다. → 제안: 개요는 40줄(목차)과 632-642줄 표 하나만 남긴다. 615-625줄 문단은 그림(slide25_1) 설명 2문장으로, 698-702줄은 삭제(667-694 코드 주석이 이미 같은 내용), 723줄 문단 삭제.
- **[A2-2] [severity: high] line 495, 538, 541, 622, 691, 898, 902, 906, 909** — 인용: "backward의 backend lowering은 첫 `backward()` 호출 시점까지 지연되는 것이 기본값이라" → 문제: lazy lowering 주의가 9곳에서 거의 같은 문장으로 반복되고, 그중 4곳은 "dynamic shape면 2.1부터 즉시" 괄호까지 동일하다. → 제안: 495줄에서 한 번 각주로 정리하고(`[^lazy-bw]`), 나머지는 "(backward lowering은 lazy[^lazy-bw])" 한 단어 참조로 줄인다. 898·902·906·909는 참조조차 불필요.
- **[A2-3] [severity: medium] line 825-827** — 인용: "**Recomputation이란?** 모델 학습 과정에서 일부 중간 계산(특히 중간 activation)을 곧바로 저장하지 않고" → 문제: 827줄 문단은 825줄을 그대로 다시 설명한다(저장 안 함 → 재계산 → 메모리 절약 → 연산 증가). → 제안: 827줄 삭제, 825줄 끝에 "메모리를 아끼는 대신 재계산만큼 연산이 늘어나는 trade-off다." 한 문장 추가.
- **[A2-4] [severity: medium] line 495** — 인용: "PyTorch 2.1부터는 backward용 SymInt 같은 dynamic shape 정보가 저장된 경우에 한해 ... 2.8에서는 이 규칙이 \"Backward graph lazy lowering\" Note로 정식화되면서" → 문제: "[1] 첫 호출에서 무슨 일이 일어나는가"를 설명하는 문단에 2.0/2.1/2.8 버전 이력이 끼어들어 흐름이 끊긴다. 초심자에게는 SymInt·deepcopy가 모두 미정의. → 제안: 버전 이력은 각주로 이동(A2-2의 `[^lazy-bw]`와 통합). 본문은 "backward는 partition까지만 끝나 있고 backend compile은 첫 `backward()` 때 한다."로.
- **[A2-5] [severity: medium] line 100-103** — 인용: "이 함수의 computation graph를 구성하면, 각 중간 연산 노드에서의 gradient를 chain rule을 통해 역방향으로 전파할 수 있습니다. 자세한 내용은 Baydin et al." → 문제: 표 이미지(forward primal / reverse adjoint trace)에 등장하는 $v_{-1}..v_5$, $\bar v$(adjoint) 표기를 본문이 한 번도 정의하지 않고 "참고하세요"로 끝난다. 그래프 그림이 표 뒤에 오는 순서도 거꾸로다. → 제안: 그래프(slide06_3)를 먼저 두고 "각 중간값을 $v_i$, 출력에 대한 $v_i$의 편미분 $\partial y/\partial v_i$를 $\bar v_i$(adjoint)라 하면, 오른쪽 표처럼 $\bar v_5=1$에서 시작해 역순으로 곱하고 더해 $\bar x_1, \bar x_2$를 얻는다." 두 문장 추가.
- **[A2-6] [severity: low] line 85-89** — 인용: "(ii) $y = f(t)$이고 $x = g(t)$일 때 (parametric form)" → 문제: parametric form chain rule은 이후 어디에서도 쓰이지 않는다. → 제안: (ii) 삭제.
- **[A2-7] [severity: medium] line 403, 416** — 인용: "Forward 추적 | 실제 tensor | Fake tensor로 emulation" → 문제: "fake tensor"가 표에서 정의 없이 처음 등장하고, 416줄 "빠르게 에뮬레이션"도 정의가 아니다. Dynamo·FX Graph에는 각주를 달았는데 fake tensor에는 없다. → 제안: 403줄에 `[^fake]` 각주: "실제 메모리를 잡지 않고 shape/dtype/device 메타데이터만 가진 tensor. 연산을 실행하는 대신 출력 메타데이터만 계산해 tracing을 값 계산 없이 진행하게 한다 (Week 3 참고)."
- **[A2-8] [severity: medium] line 253-256, 270-273** — 인용: "at::AutoDispatchBelowADInplaceOrView guard; return at::redispatch::add(ks & c10::after_autograd_keyset, self_, other_, alpha);" → 문제: 코드의 핵심 줄(Autograd key를 제거하고 다음 key로 redispatch)이 270-273 단계 설명에 없다. `set_history`도 설명이 없다. 독자는 "실제 계산은 어디서 일어나나"를 알 수 없다. → 제안: 단계 4를 "Autograd key를 뺀 keyset으로 `redispatch`하여 실제 커널(CPU/CUDA)을 실행한다"로, 단계 5 "`set_history`로 결과 tensor에 `grad_fn`을 붙인다"를 추가 (A4-6 참조).
- **[A2-9] [severity: medium] line 288-299** — 인용: "result: self_t + maybe_multiply(other_t, alpha)" → 문제: `result:` 줄과 `self_t`/`self_p`, `handle_r_to_c`, `maybe_multiply`가 설명 없이 등장. 302줄 "각 입력마다 ... 수식을 적어 두는 구조"는 `result:`를 설명하지 못한다. → 제안: YAML에서 `result:` 세 줄을 빼거나, 한 줄 주석 "`result:`는 forward-mode AD(JVP) 규칙, 이 강의 범위 밖. `_t`는 tangent, `_p`는 primal". `handle_r_to_c`는 "복소수→실수 gradient 처리 helper" 정도만.
- **[A2-10] [severity: medium] line 561-573** — 인용: "이 FX Graph를 **C++ object로 표현**하여 C++로 구현된 Autograd engine에 그대로 넘김" → 문제: 사실 오류(A4-2)이기도 하지만 이해도 측면에서도 독자가 "누가 무엇을 언제 기록하는가"를 그릴 수 없다. 여기가 이 강의에서 ELI5 비유가 가장 필요한 지점이다. → 제안: "Dynamo는 Python 호출부에 녹음기를 두므로 C++ 안에서 일어나는 backward 호출은 못 듣는다. AOTAutograd는 녹음기를 dispatcher(모든 aten 호출이 지나가는 교환기)에 두고 `torch.autograd.grad`를 실제로 실행한다. C++ engine이 backward 커널을 호출하는 순간마다 교환기에서 기록된다."
- **[A2-11] [severity: low] line 764** — 인용: "반면 위에서 내려오는 gradient는 graph 바깥에서 들어오는 값입니다 — 학습 루프 관점에서 보면 loss function이 이 FX Graph 밖에 있으므로" → 문제: 한 문단이 같은 말을 세 번 한다(재료 ①②, 중간 tensor는 안에 있음, gradient는 밖에서 옴). → 제안: "Backward에 필요한 것은 forward 중간 tensor와 loss에서 내려오는 gradient다. 전자는 joint graph 안에 있고, 후자는 loss가 graph 밖에 있으므로 input으로 받아야 한다." 두 문장.
- **[A2-12] [severity: medium] line 918-933** — 인용: "**Q1. [B 단계] `inner_fn`의 `outs`와 `backward_out`은 각각 무엇인가요?**" → 문제: Q1~Q3의 답이 757-764(Joint Function의 Input 구성)와 644(B 단계)를 그대로 반복한다. Q&A로 남길 가치가 있는 것은 Q4(Compiled Autograd)와 Q5뿐. → 제안: Q1~Q3 삭제하고, Q3의 input/output 정리 bullet(930-931)만 757줄 절에 흡수.
- **[A2-13] [severity: low] line 841-865** — 인용: "class MyCube(torch.autograd.Function):" → 문제: "compiled fw/bw가 하나의 autograd.Function 안에 있다"는 이미 465-482 예시로 보였는데 두 번째 예시가 또 붙는다(stacked). 게다가 이 doc 예제의 요점은 higher-order gradient(`grad_dx * 6 * x`)라 초심자에게 딴 얘기다. → 제안: 예제 전체 삭제하거나 `forward`/`backward` 각 3줄짜리 최소형(x**3 / 3*x**2*grad)으로 축약.
- **[A2-14] [severity: low] line 709-717** — 인용: "loss = func(p, 0).sum()\nloss.backward()\nprint(p.grad)" → 문제: 기대 출력이 없어 독자가 partition 결과(`where(ge, 3*tangent, 0)`)와 대조할 수 없다. → 제안: 마지막 줄에 `# tensor([3., 0.], device='cuda:0')` 추가. `TORCH_LOGS=aot_joint_graph,aot_graphs`로 slide30/32 출력을 얻는다는 한 줄도 여기에.
- **[A2-15] [severity: low] line 684, 793** — 인용: "Torch IR → ATen IR → Core ATen IR → Prims IR" → 문제: 네 IR 이름이 정의 없이 두 번 등장. → 제안: 793줄 뒤에 각 한 줄: Torch IR(`torch.*` 호출 그대로), ATen IR(`aten.*` op, ~3000개), Core ATen IR(backend가 반드시 구현해야 하는 ~250개 부분집합), Prims IR(~250개 원시 op, 더 작은 집합). 숫자는 "needs verification" 표기 권장.

## Axis 3 — 다이어그램

문제 없는 것:
- `training-loop` SVG (line 52-57): Forward → Loss Function → Loss → Backward(autodiff) → Gradient → Optimizer → Weight Update. 61-64줄 4단계와 라벨·순서 일치.
- Mermaid line 190-193, 204-207: 노드 3개/5개, forward 방향 그래프. 본문과 일치. (`AccumulateGrad` leaf 노드가 없지만 이 수준에서는 생략이 맞다.)
- Mermaid line 224-227: `graph RL`이라 forward 그림의 거울상으로 읽힌다 — 의도적이면 좋다. 숫자(1×8=8, 8×2=16) 본문과 일치.
- `compile-train-flow` SVG (line 509-514): [1][2][3] 라벨, "첫 호출 시 1회 (bwd lowering은 지연)", grad_fn 등록 → backward 실행. 493-505줄과 순서·용어 일치.
- `aotautograd-interpose` SVG (line 525-530): 532줄(training은 joint→분리, inference는 생략)과 일치. 라벨 "normalization"만 A1-1에 따라 수정.
- `activation-checkpointing` SVG (line 818-823): L1~L4, a2/a4 버림 → 재계산. 825줄과 일치. (단 A4-14 참조 — 이 그림은 layer 단위 checkpoint이고 min-cut partitioner의 recompute는 op 단위.)
- `slide30_1.png` (line 780): joint graph, forward(초록)/backward(빨강)/ge(노랑) 구분이 본문 782줄과 맞음.
- `slide32_1/2.png` (line 806-807): partition 결과 fw/bw. 본문과 일치.

문제:
- **[A3-1] [severity: high] line 100** — 인용: "<img src=\"/images/04/slide06_1.png\" alt=\"예제 함수 f(x1, x2) = ln(x1) + x1x2 - sin(x2)의 autodiff 계산 과정\" class=\"h-28\" />" → 문제: 2048×1068 두 칸 표(forward primal / reverse adjoint, 16행)를 높이 7rem(≈112px)으로 렌더링한다. 슬라이드에서 글자를 읽을 수 없다. → 제안: `class="h-72 mx-auto"` 이상으로 키우고, 그래프(101줄)를 표보다 앞에 둔다(A2-5).
- **[A3-2] [severity: medium] line 604** — 인용: "<img src=\"/images/04/slide22_1.png\" alt=\"TORCH_LOGS=aot_graphs로 출력한 partition 후 forward/backward 그래프 예제\" class=\"h-72 mx-auto\" />" → 문제: 599-602 "정리하면" 문단 뒤에 본문 언급 없이 놓인 고아 이미지. 내용은 465-482줄 코드 블록과 동일하고 partition 결과라서 "도전 과제" 절과도 무관하다. → 제안: 삭제. (465-482 코드가 이미 같은 내용을 텍스트로 보여준다.)
- **[A3-3] [severity: medium] line 611-623** — 인용: "1. Input → Dynamo → FX Graph ... 4. Backend Compile (각각, backward는 lazy) ... 5. `torch.autograd.Function`으로 매핑 & return" → 문제: 그림(slide25_1)에는 Dynamo도, backend compile도, lazy도 없다. 반대로 그림의 핵심인 왼쪽 열(runtime unwrapping/deduping: subclass 풀기·alias된 입력 중복 제거)과 "Autograd-aware ↔ plain tensor", "YES/NO mutation, autograd control" 대비는 본문이 한 번도 언급하지 않는다. 그림은 compile-time 변환(가운데)과 runtime 경로(아래 행)를 함께 그린 것인데 본문은 compile-time 단계 나열로만 읽는다. → 제안: 615-623을 그림 기준으로 다시 쓴다: "위 행: autograd·alias·mutation·subclass가 있는 `torch.*` 그래프. 가운데 화살표: functionalization·decomposition·tracing으로 mutation/autograd control이 없는 ATen 그래프로. 아래 행(runtime): 입력을 plain tensor로 풀고(unwrap/dedupe) compiled graph를 실행한 뒤 출력을 `autograd.Function`으로 다시 감싼다." Dynamo·lazy는 다른 절에 이미 있다.
- **[A3-4] [severity: low] line 789** — 인용: "alt=\"clamp_min이 clamp → maximum으로 분해되는 PrimTorch decomposition 코드 예제\"" → 문제: 그림 아래쪽 파일 경로 `torchinductor/decomposition.py`는 torchdynamo 저장소 시절 경로(현재 `torch/_inductor/decomposition.py`)이고, 그 절반은 PrimTorch가 아니라 Inductor 전용 decomposition이다. 본문(787-796)이 이 두 출처 차이를 말하지 않는다. → 제안: 캡션 추가 "위: `torch/_refs`(PrimTorch ref), 아래: Inductor decomposition (현재 `torch/_inductor/decomposition.py`). 슬라이드는 2022년 torchdynamo 저장소 기준."
- **[A3-5] [severity: low] line 892, 905** — 인용: "<img src=\"/images/04/slide32_1.png\" alt=\"partition된 forward FX Graph (forward는 이 시점에 컴파일 완료)\"" → 문제: 806-807과 같은 두 이미지를 90줄 뒤에 다시 싣는다. 캡션 "→ 등록된 backend가 forward를 미리 컴파일"은 그림이 아니라 본문이 할 말이다. → 제안: 892-894, 904-907 `<div>` 두 개 삭제, 필요하면 "(806줄 그림 참고)"로 대체.

## Axis 4 — 기술 정확성

- **[A4-1] [severity: high] line 418** — 인용: "Autograd는 실제 tensor 값을 기반으로 동작하도록 설계되었기 때문에, fake tensor를 사용하는 tracing 과정에서 그대로 동작할지 확신하기 어렵습니다" → 문제: 실제 AOTAutograd가 하는 일이 정확히 "fake tensor 위에서 C++ autograd engine을 돌리는 것"이다(`make_fx` + `FakeTensorMode` 아래에서 `torch.autograd.grad` 실행). 571줄 해법 2번 "fake tensor로 trace"와 정면으로 모순된다. 방법 1이 안 되는 진짜 이유는 Dynamo가 Python bytecode 수준 tracer라 C++ engine 내부의 op 호출을 볼 수 없다는 것. 확신도: high. → 제안: "그러나 Dynamo는 Python bytecode를 해석하는 tracer라서, `backward()`가 C++ engine 안에서 호출하는 커널들은 Dynamo에게 보이지 않습니다. 따라서 Dynamo 혼자서는 backward를 캡처할 수 없습니다."
- **[A4-2] [severity: high] line 571-573** — 인용: "이 FX Graph를 **C++ object로 표현**하여 C++로 구현된 Autograd engine에 그대로 넘김" → 문제: 그런 변환은 없다. AOTAutograd는 FX GraphModule을 Python 함수로 그대로 실행하는 joint 함수(`fn(*primals)` → `torch.autograd.grad`)를 만들고, `make_fx`(`ProxyTorchDispatchMode` + `FakeTensorMode`) 아래에서 호출한다. `torch.autograd.grad`가 C++ engine을 실제로 실행하고, engine이 호출하는 aten op들이 `__torch_dispatch__` 수준에서 가로채져 graph node로 기록된다. 확신도: high. → 제안: 570-573을 "① Dynamo로 forward FX Graph 생성 ② 그 그래프를 호출하고 이어서 `torch.autograd.grad`를 호출하는 joint 함수 작성 ③ fake tensor + `__torch_dispatch__` 기록 모드(`make_fx`) 아래에서 joint 함수를 한 번 실행 → C++ engine이 실제로 돌면서 호출하는 aten op가 모두 기록됨"으로.
- **[A4-3] [severity: high] line 787, 632-642, 684** — 인용: "D 단계에서 만들어진 joint graph는 아직 Torch IR 수준의 고수준 op들을 포함하고 있습니다. E 단계(Decomposition)에서는 이 op들을 더 낮은 수준의 작은 op들로 분해" → 문제: decomposition은 tracing 뒤의 별도 pass가 아니라 `make_fx(..., decomposition_table=...)`가 tracing 중에 적용한다. Functionalization도 `FunctionalTensorMode` 아래에서 tracing 중에 일어난다. 그래서 D의 산출물(slide30_1)은 이미 `aten.maximum`(clamp_min이 분해된 결과)을 담고 있다 — 그림이 본문을 반박한다. 667-694 코드 주석("D, E, F: 실제 tracing + Decomposition + FxGraph 생성"이 `_create_graph` 한 호출)은 맞게 써 놓고 787줄이 되돌린다. 확신도: high. → 제안: 표에서 C·D·E를 "C: joint 함수를 functionalization wrapper로 감쌈 / D: fake tensor로 joint 함수를 실행하며 dispatcher 수준에서 기록 — 이때 decomposition table이 적용되어 ATen 수준 op로 기록됨"으로 합치고, 787줄을 "joint graph는 이미 ATen 수준이다. 여기서는 그 분해가 어떤 규칙으로 일어나는지 본다"로.
- **[A4-4] [severity: medium] line 796, 684, 702** — 인용: "수천 개에 달하는 Torch op을 정해진 소수의 Prims IR op으로 분해" → 문제: Inductor 경로의 decomposition table(`torch._inductor.decomposition`, `select_decomp_table()`)은 Core ATen + Inductor 전용 decomp를 목표로 하며, Inductor는 ATen op을 직접 lowering한다. Prims IR까지 내려가는 것은 `torch._refs` 기반 backend(예: nvFuser 시절)의 이야기. 확신도: medium-high. → 제안: "Torch IR → ATen IR → (backend에 따라) Core ATen IR 또는 Prims IR. Inductor는 Core ATen 수준에서 lowering한다."
- **[A4-5] [severity: medium] line 652** — 인용: "backend-aware 최적화(per-backend 최적화)는 H 단계에서만 적용됩니다. forward/backward가 분리된 이 시점 이전에는 backend에 따른 최적화가 들어갈 여지가 없습니다" → 문제: backend는 H 이전에 세 가지를 공급한다 — decomposition table(E), `partition_fn`(G, Inductor는 `min_cut_rematerialization_partitioner`), 그리고 Inductor의 `joint_graph_passes`(partition 전 joint graph에 pattern-matching/constant folding 적용). 확신도: high. → 제안: "backend가 만드는 코드 생성은 H에서만 일어나지만, 어떤 decomposition을 쓰고 어디서 자를지(partition_fn)는 backend가 AOTAutograd에 넘겨주는 설정이다. Inductor는 partition 전에 joint graph pass도 돌린다."
- **[A4-6] [severity: medium] line 273** — 인용: "4. 이 모든 기록이 끝난 후에 실제 forward 계산을 수행합니다." → 문제: 236-263 코드 순서는 grad_fn 생성·`set_next_edges` → `redispatch::add`(실제 계산) → `set_history(result, grad_fn)`(결과에 grad_fn 부착). "기록이 다 끝난 뒤 계산"이 아니라 계산 뒤에 결과 tensor에 붙이는 단계가 남는다. 확신도: high. → 제안: "4. Autograd key를 제외한 keyset으로 redispatch하여 실제 커널을 실행한다. 5. `set_history`로 결과 tensor에 `grad_fn`을 붙인다 — `y.grad_fn`이 여기서 정해진다."
- **[A4-7] [severity: medium] line 377, 383** — 인용: "역전파 계산에 필요한 함수들을 준비(`init_to_execute()`)합니다" / "└→ graph_task->init_to_execute()" → 문제: main 브랜치 `engine.cpp`의 `Engine::execute`에서 `init_to_execute`는 `if (!outputs.empty())`일 때만, 즉 `torch.autograd.grad(inputs=...)` 경로에서만 호출된다. `z.backward()`에서는 `compute_dependencies()`만 돈다. 또 `execute_with_graph_task` → `evaluate_function` 사이의 `thread_main`이 빠졌다. 확신도: high(main 소스 확인). → 제안: 트리를 `execute()` → `compute_dependencies()` (`.grad()`일 때만 `init_to_execute()`) → `execute_with_graph_task()` → `thread_main()` → `evaluate_function()` → `call_function()`으로.
- **[A4-8] [severity: medium] line 462-487** — 인용: "**AOTAutograd가 생성한 `torch.autograd.Function`** (예시)" / "`forward()`와 `backward()`가 한 `torch.autograd.Function` 객체 안에 함께 들어 있다는 점에 주목하세요" → 문제: 보이는 코드는 `TORCH_LOGS=aot_graphs`가 출력한 partition 후 fw/bw `GraphModule`의 `forward` 코드다(슬라이드 제목도 그렇다). `def backward(self, ge_scalar, tangents_1)`는 bw GraphModule의 `forward`를 슬라이드에서 이름만 바꾼 것. 실제 `torch.autograd.Function`은 `runtime_wrappers.py`의 `CompiledFunction`이며, 그 `forward`/`backward`가 이 두 GraphModule(compile된 결과)을 호출한다. 확신도: high. → 제안: 제목을 "AOTAutograd가 partition한 forward/backward 그래프 (`TORCH_LOGS=aot_graphs`)"로, 487줄을 "이 두 그래프가 각각 compile되어 하나의 `torch.autograd.Function`(`CompiledFunction`)의 forward/backward에서 호출된다"로.
- **[A4-9] [severity: medium] line 126** — 인용: "**Operator overloading**을 통해 Python의 기본 연산자(예: `+`, `*`, `@`)를 PyTorch 텐서 객체에서 사용할 때, Autograd와 함께 처리되도록 수정된 함수가 실행됩니다" → 문제: Autograd 문맥의 "operator overloading"은 Baydin 분류(source transformation vs. operator overloading)의 의미로, `torch.matmul(a, b)`처럼 연산자를 안 쓴 호출도 똑같이 기록된다. 기록 지점은 `Tensor.__mul__`이 아니라 dispatcher의 Autograd key(236줄 커널). 이대로면 독자는 `+`, `*`만 추적된다고 오해한다. 확신도: high. → 제안: "여기서 operator overloading은 '모든 tensor 연산이 값 계산과 함께 기록 동작을 수행한다'는 AD 구현 방식의 이름이다. Python 연산자든 `torch.matmul`이든 결국 dispatcher의 Autograd key에서 같은 기록이 일어난다."
- **[A4-10] [severity: medium] line 834** — 인용: "Min-Cut partitioner가 ... 전체 그래프 관점에서 판단할 수 있어, activation checkpointing을 보다 자동화되고 효율적으로 적용할 수 있습니다" → 문제: 기본 `min_cut_rematerialization_partitioner`는 저장 대신 재계산할 대상을 fusible한 값싼 op(pointwise, view 등)로 제한하고 matmul/conv 같은 비싼 op 재계산은 금지한다(`ban_recomputation`). 즉 activation checkpointing을 대체하지 않으며, 사용자 AC(`torch.utils.checkpoint`, selective AC 태그)는 partitioner가 태그를 읽어 존중한다. 그림(activation-checkpointing SVG)의 layer 단위 segment와도 다른 층위. 확신도: high. → 제안: "partitioner는 기본적으로 재계산이 싼 op(pointwise 등)만 골라 recompute하여 메모리 대역폭을 줄인다. Layer 단위 activation checkpointing은 여전히 `torch.utils.checkpoint`로 지정하며, torch.compile 경로에서는 partitioner가 그 지정을 읽어 반영한다."
- **[A4-11] [severity: medium] line 937** — 인용: "PyTorch 2.4부터 [Compiled Autograd]가 정식 기능으로 도입되었습니다" → 문제: 공식 튜토리얼은 2.4 도입은 맞지만 "under active development and is not yet compatible with all existing PyTorch features"라고 명시한다. "정식 기능"은 과장. 나머지(`torch._dynamo.config.compiled_autograd = True`, cache lookup 오버헤드, recompile 취약)는 튜토리얼과 일치. 확신도: high(튜토리얼 확인). → 제안: "PyTorch 2.4에서 Compiled Autograd가 도입되었습니다(2.13 기준으로도 모든 기능과 호환되지는 않는 개발 중 기능)."
- **[A4-12] [severity: medium] line 1033** — 인용: "이쪽 결과물(예: `RegisterCPU.cpp`, `TypeDefault.cpp`)을 보면" → 문제: `TypeDefault.cpp`는 1.8 무렵 제거되었고 2.x에는 없다(현재 대응물은 `RegisterCompositeImplicitAutograd.cpp`, `RegisterCompositeExplicitAutograd.cpp`). 1029줄은 `v2.3.0` 재현을 권하므로 독자가 찾다 실패한다. 확신도: high. → 제안: "`RegisterCPU.cpp`, `RegisterCompositeImplicitAutograd.cpp`"로 교체.
- **[A4-13] [severity: low] line 234** — 인용: "(디버그 전용 `#ifndef NDEBUG` 블록의 storage alias 검증 코드는 핵심 흐름 이해에 지장이 없어 생략했습니다.)" → 문제: 1.13.1 codegen의 `add_Tensor`에는 forward-mode AD 블록(`_any_has_forward_grad_result`, `isFwGradDefined(self)`, `result_new_fw_grad`)도 함께 생성된다. NDEBUG 블록만 뺐다는 주석은 실제 생략 범위보다 좁을 가능성이 크다. 확신도: medium — needs verification(재현 산출물 `VariableType_2.cpp`에서 `_any_has_forward_grad_result` 검색). → 제안: 확인 후 "디버그 검증 블록과 forward-mode AD 블록은 생략"으로.
- **[A4-14] [severity: low] line 665** — 인용: "최신 PyTorch에서는 `aot_stage1_graph_capture` / `aot_stage2_autograd` / `_aot_stage2a~c_*`로 스테이지가 재분할되었습니다" → 문제: main의 `graph_compile.py`에는 `aot_stage1_graph_capture`, `aot_stage2_compile`, `aot_stage2_inference`, `aot_stage2_export`, `_aot_stage2a_partition`, `_aot_stage2b_fw_compile`/`_bw_compile`/`_inference_compile`이 있고 `aot_stage2_autograd`·`_aot_stage2c_*`는 없다. 2.13 태그에서는 다를 수 있음. 확신도: medium — needs verification(v2.13.0 `torch/_functorch/_aot_autograd/graph_compile.py`). → 제안: 2.13 소스에 맞춰 이름을 다시 쓰고, "(2.13 기준)"을 붙인다.
- **[A4-15] [severity: low] line 495** — 인용: "2.8에서는 이 규칙이 \"Backward graph lazy lowering\" Note로 정식화되면서 lowering이 `bw_module`의 deepcopy 위에서 수행되도록 바뀌었습니다" → 문제: v2.8.0 `jit_compile_runtime_wrappers.py`에 해당 Note와 `copy.deepcopy(bw_module)`(`num_symints_saved_for_bw > 0`일 때 eager compile)이 있는 것은 확인. 다만 main에는 `aot_config.force_non_lazy_backward_lowering` 조건이 추가되어 "dynamic shape일 때만 즉시"가 더 이상 유일한 예외가 아니다. 2.1 SymInt 예외 도입 시점은 medium 확신. → 제안: 각주로 옮기면서(A2-4) "2.13에서는 `force_non_lazy_backward_lowering` 옵션으로도 즉시 lowering 가능"을 한 줄 추가. 2.1 도입 시점은 needs verification(v2.1.0 `aot_autograd.py`의 `symint_outs_saved_for_backwards` 분기).
- **[A4-16] [severity: low] line 521** — 인용: "PyTorch 2.13 공식 문서에서는 이 컴포넌트를 **AOTDispatcher**로 표기하는 것이 1차 명칭입니다" → 문제: 2.13 `torch.compiler_backward` 페이지는 "AOTDispatcher (sometimes known as AOTAutograd)"라고 쓰지만, 다른 페이지(예: dynamo overview)에는 어느 이름도 없고 IR/deep-dive 문서는 AOTAutograd를 쓴다. "1차 명칭"은 한 페이지 기준. 확신도: high(해당 페이지 확인). → 제안: "일부 2.13 문서는 AOTDispatcher(= AOTAutograd)라고 부릅니다. 이 강의는 AOTAutograd로 통일합니다."
- **[A4-17] [severity: low] line 22, 34, 112** — 인용: "이 방식이 PyTorch 1.0의 **Autograd**입니다" → 문제: Autograd는 2017년 PyTorch 0.1부터 있었고 1.0(2018)에서 도입된 것이 아니다. "1.0 vs 2.0" 대비 프레임으로 쓰는 것은 괜찮지만 독자가 연대를 오해한다. 확신도: high. → 제안: 112줄 제목 아래 한 줄 "(Autograd 자체는 0.1부터 있었고, 여기서 '1.0'은 2.0의 graph mode와 대비되는 eager 시대를 뜻합니다)".
- **[A4-18] [severity: low] line 114** — 인용: "PyTorch도 같은 이름을 사용하면서 초기에 이름 충돌에 대한 논의가 있었습니다" → 문제: HIPS autograd(Maclaurin, Duvenaud, Johnson) → Google/JAX는 맞지만 "이름 충돌 논의"는 출처가 없다. 확신도: low — needs verification. → 제안: 출처(예: PyTorch 초기 GitHub issue/포럼)를 각주로 달거나 그 문장을 삭제.
- **[A4-19] [severity: low] line 1031** — 인용: "PyTorch 2.x는 Python 3.8+만 지원" → 문제: 2.5부터 3.8 지원 종료, 2.13 시점에는 최소 3.10 이상일 가능성이 큼. "만"이라는 표현도 어색. 확신도: medium — needs verification(2.13 `setup.py` `python_requires`). → 제안: "2.x는 버전마다 최소 Python이 올라간다(2.0~2.4: 3.8, 2.5+: 3.9, ...). 해당 태그의 `setup.py`를 확인."

검증 완료(문제 없음): 911줄 `backward_pass_autocast` 기본값 `"same_as_forward"`(옵션 `"off"`/list)와 2.13 문서 링크 존재; 146-155 출력값; 287-299 derivatives.yaml 항목; 308-341, 349-369 codegen 결과 형태; 966-994 `gen_autograd.py` 인자 4개와 산출 파일 목록(1.13 기준 shard 수); 842-865 `setup_context` API.

</details>

<details><summary>Codex gpt-6-astra 전문</summary>

문체는 설명을 예고하거나 반복하는 문장이 많고, 이해도는 AOTAutograd 구간의 용어 밀도와 긴 재설명 때문에 떨어집니다.
그림은 모두 주제와 관련되지만, forward/backward 혼동과 그림에 없는 단계를 설명하는 문제가 있습니다. 기술 내용은 핵심 메커니즘을 수정해야 합니다.
우선 수정 ① AOTAutograd가 기존 Autograd를 FakeTensor로 실행·추적한다는 관계 ② `torch.compile`의 반환값·첫 실행·backward 컴파일 시점 구분.
우선 수정 ③ forward 연산과 backward Node를 구분한 그림 및 backend별 decomposition·partitioning 설명. 아래에 근거와 교체 문구를 제시합니다.

## Axis 1 — AI 문체와 비표준 용어

- **[A1-1] [severity: medium] line 548** — 인용: "먼저 두 문제와 해결책의 요약을 표로 정리하고, 이어서 각각을 조금 더 풀어서 설명하겠습니다." → 문제: 질문, ‘두 가지 큰 도전 과제’ 선언, 설명 순서 예고가 연달아 나오지만 새 정보는 없습니다. → 제안: 문단을 “Dynamo가 C++ Autograd engine의 실행을 직접 캡처하지 못하는 문제와, mutation·aliasing을 compiler가 다룰 형태로 바꾸는 문제가 있습니다.”로 줄입니다.

- **[A1-2] [severity: medium] line 644** — 인용: "여기서 중요한 포인트는 B 단계 자체에서는 아직 tracing이 일어나지 않는다는 것입니다. 단지 trace할 대상이 될 함수를 준비해 둘 뿐입니다." → 문제: ‘중요한 포인트’라는 강조 뒤에 같은 부정을 두 번 반복하며, 직전 표의 B 단계와도 겹칩니다. → 제안: “B 단계에서는 forward와 `torch.autograd.grad`를 차례로 호출하는 Python 함수를 정의합니다. 실제 추적은 이 함수를 실행하는 D 단계에서 일어납니다.”

- **[A1-3] [severity: medium] line 930** — 인용: "backward-trigger gradient (`grad_outs`)" → 문제: 이 합성어는 별도 메커니즘의 이름처럼 보이지만 여기서 필요한 표준 표현은 incoming gradient 또는 output gradient입니다. → 제안: “출력에 대한 loss의 gradient (`grad_outs`, ∂loss/∂output)”로 바꿉니다. `tangents`라는 내부 이름을 사용할 때도 같은 값임을 설명합니다.

`AOTDispatcher`, functionalization, decomposition, rematerialization, Min-Cut은 실제 사용되는 용어입니다. ‘텐서’ 같은 통용 표기나 일반적인 강의 말투를 별도 문제로 세지 않았습니다.

## Axis 2 — 이해도, 비유의 균형, 분량

- **[A2-1] [severity: medium] line 97-103** — 인용: "각 중간 연산 노드에서의 gradient를 chain rule을 통해 역방향으로 전파할 수 있습니다." → 문제: 앞에서는 한 경로의 미분을 곱하는 법만 설명했는데, 이 예제에서는 같은 입력으로 돌아오는 여러 경로의 기여를 더해야 합니다. 그림의 답만으로는 처음 보는 독자가 5.5가 나오는 이유를 따라가기 어렵습니다. → 제안: “`x₁`은 `ln(x₁)`과 `x₁x₂` 두 곳에 쓰이므로 두 경로의 기여를 더합니다: ∂f/∂x₁=1/x₁+x₂=5.5.”를 추가합니다. ‘같은 입력을 사용한 각 경로의 기여를 합산한다’ 정도의 설명이면 충분합니다.

- **[A2-2] [severity: medium] line 495** — 인용: "2.8에서는 이 규칙이 "Backward graph lazy lowering" Note로 정식화되면서 lowering이 `bw_module`의 deepcopy 위에서 수행되도록 바뀌었습니다." → 문제: 첫 호출의 동작을 익히는 문단에 SymInt, 2.0·2.1·2.8의 변경 이력, deepcopy까지 들어갑니다. lazy lowering 설명은 538·541·622·691·898줄에서도 반복됩니다. → 제안: 본문에는 “첫 forward 호출 때 backward graph까지 준비하지만, backend 컴파일은 보통 첫 backward 호출까지 미룹니다.”만 남기고, 정확한 예외 조건과 버전 이력은 근거 링크를 붙인 참고 하나로 모읍니다.

- **[A2-3] [severity: medium] line 582-591** — 인용: "aliasing, mutation, subclass, view/storage decoupling 등" → 문제: 저장소 공유, 값 변경, Tensor subclass를 구분할 정의나 예제 없이 구현 용어가 한꺼번에 등장합니다. ‘복잡성을 제거한다’는 후속 설명만으로는 무엇이 바뀌는지 알 수 없습니다. → 제안: 먼저 “`y=x.view(-1)`은 x와 저장소를 공유합니다(aliasing). `y.add_(1)`은 그 저장소의 값을 바꿉니다(mutation).”를 보여주고, functionalization이 이를 명시적인 값 계산과 필요한 갱신으로 표현한다고 설명합니다.

- **[A2-4] [severity: medium] line 825-834** — 인용: "Forward 과정에서 모든 중간 값을 전부 저장해 두면 메모리를 많이 차지하지만" → 문제: 827줄은 바로 앞 문단의 저장·재계산 설명을 거의 그대로 반복하고, 834줄은 646줄의 joint graph 필요성을 다시 풀어 씁니다. → 제안: 두 문단을 “Activation checkpointing은 일부 중간값의 저장을 생략하고 backward에서 재계산해 메모리를 줄입니다. 재계산에 드는 비용과 저장 비용을 비교해야 합니다.”로 합칩니다. framework별 API 목록은 유지합니다.

- **[A2-5] [severity: medium] line 839-878** — 인용: "아래는 그 형태를 이해하기 위한 공식 문서의 hand-written 예제입니다" → 문제: wrapper 연결을 설명하려다가 두 출력, `setup_context`, 저장된 미분값, 고차 미분까지 한 번에 도입합니다. 뒤의 긴 영어 인용도 이미 설명한 custom gradient 기능을 반복합니다. → 제안: 본문에는 `forward`에서 입력을 저장하고 `backward(ctx, grad_output)`에서 `3*x*x*grad_output`을 반환하는 최소 cube 예제를 사용합니다. 현재 예제는 고차 미분 참고로 옮기고, `ctx`가 forward의 값을 backward까지 보관하는 공간임을 먼저 설명합니다.

## Axis 3 — 그림과 설명의 대응

Mermaid 3개, `<img>` 10회, `ThemeImage` 4개(각 light/dark 파일)를 모두 확인했습니다. 아래 행 번호는 이미지 파일이 아닌 MDX의 참조 위치입니다. 현재 레이아웃은 스크롤형 article이고 CSS가 이미지 높이를 자동 조정하므로, `h-*` 값만으로 화면상의 글자 크기를 단정하지 않았습니다. 별도 슬라이드 화면에서의 최종 가독성은 추가 확인이 필요합니다.

- **[A3-1] [severity: medium] line 52-57** — 인용: "Training loop diagram" → 문제: 두 테마 모두 학습 루프를 보여주지만, `Loss`에서 loss의 gradient function으로 이어지는 실선은 loss의 수치 자체를 backward 입력으로 전달하는 것처럼 보입니다. 시작 gradient와 forward에서 저장한 값의 구분이 없습니다. → 제안: 해당 선에 “`loss.backward()`: 시작 gradient=1”을 적고, `Gradient Input/Output`을 각각 “∂loss/∂model_output”, “∂loss/∂weights”로 구체화합니다. 단계 수와 배치는 적당합니다.

- **[A3-2] [severity: medium] line 100** — 인용: "/images/04/slide06_1.png" → 문제: 실제 이미지는 computation graph인데 alt는 ‘autodiff 계산 과정’이고, 노드에는 `v₋₁`부터 `v₅`까지의 기호만 있어 연산을 알아볼 수 없습니다. 이미지 안 캡션도 별도 표의 정의를 보라고 합니다. → 제안: 노드에 `ln`, `×`, `sin`, `+`, `−`를 직접 쓰고, alt를 ‘예제 함수의 computation graph’로 수정합니다. 아래 계산표와의 기호 대응을 유지합니다.

- **[A3-3] [severity: medium] line 101** — 인용: "/images/04/slide06_3.png" → 문제: 실제 이미지는 forward/reverse 계산표이며 alt의 ‘computation graph’와 다릅니다. 수치는 맞지만 `v̄`, primal, adjoint의 뜻과 오른쪽 표를 아래에서 위로 읽는 규칙이 설명되지 않았고, 원본의 작은 수식을 한 장에 모두 넣었습니다. → 제안: alt를 계산표로 고치고 “v̄=∂f/∂v, 왼쪽은 위→아래, 오른쪽은 아래→위”라는 범례를 추가합니다. 발표용으로는 forward 계산과 gradient 합산을 나눠 확대합니다.

- **[A3-4] [severity: high] line 190-193** — 인용: "x["x: 2"] --> mul["MulBackward0: ×2"] --> y["y: 4"]" → 문제: forward 데이터 흐름의 곱셈 노드가 backward Node 이름을 달고 있어 `MulBackward0`가 `y`를 계산하는 것처럼 보입니다. 노드 수와 가독성에는 문제가 없습니다. → 제안: forward는 `x → ×2 → y`로 표시하고, `y.grad_fn → MulBackward0 → AccumulateGrad(x)`를 별도의 역방향 연결로 표시합니다.

- **[A3-5] [severity: high] line 204-207** — 인용: "pow["PowBackward0: 2y"] --> z["z: 16"]" → 문제: `2y`를 적용해 `z=16`을 얻는 그림이지만 `y=4`에서 `2y=8`입니다. forward의 `y²`와 backward의 국소 미분 `2y`를 같은 경로에 섞었습니다. → 제안: forward 노드는 `square: y²`로 바꾸고, `PowBackward0`와 저장된 `y`는 backward 경로에 배치합니다. 5개 노드의 선형 구조 자체는 읽기 쉽습니다.

정상 — line 224-227, Mermaid: `1 → 8 → 16`의 역방향 계산과 본문이 일치하며, 4개 노드로 읽기 쉽습니다. 구현 그림임을 강조하려면 마지막 저장 단계를 `AccumulateGrad`라고 보충할 수 있습니다.

- **[A3-6] [severity: medium] line 509-514** — 인용: "/images/04/compile-train-flow-dark.svg" → 문제: 두 테마에서 `loss.backward()`의 실행 화살표가 compiled backward로 바로 연결됩니다. 본문 503줄에서 먼저 실행한다고 한 eager loss backward가 그림에는 없어, loss에서 모델 출력까지의 gradient 계산을 건너뛴 것처럼 보입니다. → 제안: `loss.backward() → loss backward → compiled backward → weight gradients` 순서로 실행 화살표를 그립니다. 등록을 나타내는 점선과 실행을 나타내는 실선의 구분은 유지합니다.

- **[A3-7] [severity: high] line 525-530** — 인용: "/images/04/aotautograd-interpose-dark.svg" → 문제: 두 테마의 ‘직행 불가 (training·inference 공통)’는 모든 backend가 AOTAutograd를 반드시 거친다는 잘못된 일반화입니다. inference도 같은 흐름에 포함하면서 마지막에는 compiled forward+backward의 `autograd.Function`만 보여줍니다. → 제안: 제목을 “기본 Inductor backend의 학습 경로”로 제한하거나, inference의 forward-only 반환 경로를 분기해 표시합니다. 사용자 backend가 Dynamo FX Graph를 직접 받는 구조는 [공식 custom backend 문서(main)](https://docs.pytorch.org/docs/main/user_guide/torch_compiler/torch.compiler_custom_backends.html)를 기준으로 설명합니다.

- **[A3-8] [severity: medium] line 604** — 인용: "/images/04/slide22_1.png" → 문제: 이미지는 partition 후 코드이며 `ge_scalar`가 forward로 이동한 사실을 보여줍니다. 주변 표가 설명하는 dispatcher tracing과 normalization의 작동 과정은 보이지 않아 어느 부분을 봐야 하는지 불명확합니다. → 제안: 799줄의 partitioning 절로 옮기거나 “normalization·partitioning을 거친 결과 예시”라는 캡션을 붙입니다. 이미 옮겨 적은 464-482줄의 코드 또는 확대된 806-807줄 이미지를 활용하면 중복도 줄어듭니다.

- **[A3-9] [severity: high] line 611-623** — 인용: "/images/04/slide25_1.png" → 문제: 그림은 입력의 unwrapping/deduping, 그래프의 functionalization·decomposition, 출력의 autograd wrapping을 보여줍니다. 뒤의 번호 목록이 설명하는 Dynamo, joint graph, partition, 두 backend compile 단계는 그림에 없으며, 그림의 반환 대상은 autograd-aware output tensor입니다. → 제안: 본문을 그림의 세 변환에 맞춰 설명하고, A~I 파이프라인은 별도 그림으로 제시합니다. `deduping`과 `autograd control`의 뜻도 한 줄씩 풀이합니다.

- **[A3-10] [severity: high] line 778-780** — 인용: "/images/04/slide30_1.png" → 문제: 이미지에는 이미 `aten.maximum`, `aten.mul`, `aten.where`로 분해된 joint graph가 있습니다. 이를 787줄에서 ‘아직 Torch IR 수준’의 decomposition 이전 결과로 설명하므로 D/E/F 순서와 실제 증거가 맞지 않습니다. → 제안: 캡션을 “decomposition을 적용하며 trace한 joint FX Graph: D~F의 결과”로 고칩니다. 긴 코드 대신 `primals_1 → maximum/mul`과 `primals_1 → ge → where ← tangents_1` 의존성을 함께 보여주면 joint graph의 장점도 드러납니다.

- **[A3-11] [severity: medium] line 789** — 인용: "/images/04/slide31_1.png" → 문제: `clamp_min → clamp → maximum`의 변환은 설명을 뒷받침하지만, 이미지 속 `torchinductor/decomposition.py`는 역사적 경로입니다. 그림에는 Prims 연산으로의 변환이나 mutation·aliasing 제거 예제가 없어 본문 전체를 증명하지는 않습니다. → 제안: 원본 버전의 역사적 예제임을 명시하고 해당 소스 링크를 붙입니다. 현재 버전을 설명하려면 `torch/_inductor/decomposition.py`의 해당 구현을 대조하고, functionalization 예제는 분리합니다.

정상 — line 806, `slide32_1.png`: forward가 결과와 저장할 `ge_scalar`를 반환해 본문과 일치하며, 코드 부분만 잘라 비교적 읽기 쉽습니다.

정상 — line 807, `slide32_2.png`: 저장된 `ge_scalar`와 incoming gradient를 받아 `where`로 gradient를 계산하는 단계가 본문과 일치합니다.

- **[A3-12] [severity: medium] line 818-823** — 인용: "일반 training은 모든 activation을 저장해 backward에서 사용하고" → 문제: 두 테마 모두 저장/재계산 비교는 명확하지만, 일반 Autograd가 모든 activation을 저장한다는 인상을 줍니다. 아래쪽에서는 `a₂`, `a₄`를 버리면서 재계산 화살표는 `a₁ → a₂`만 표시합니다. → 제안: “이 예제에서는 네 activation이 backward에 필요하다고 가정”을 명시하고 `a₃ → a₄`의 재계산도 표시합니다. 일반 설명은 “backward에 필요한 텐서를 저장”으로 바꿉니다.

정상 — line 892, `slide32_1.png` 재사용: forward용 FX 코드와 forward 컴파일 설명이 대응합니다. backend가 생성한 최종 기계 코드가 아니라는 점만 유지하면 됩니다.

정상 — line 905, `slide32_2.png` 재사용: backward용 FX 코드와 첫 backward 호출 때의 lowering 캡션이 대응합니다. 선행 설명과 다른 추가 단계는 없습니다.

## Axis 4 — 기술적 정확성

확신도는 각 항목에 표시했습니다. 2.13 문서 URL 일부는 직접 열리지 않아 확인 가능한 `v2.13.0` 소스, 명시된 `v1.13.1` 소스와 공식 논문을 대조했습니다. `main` 문서는 고정 버전의 증거와 구분합니다. PyTorch가 설치된 실행 환경을 확인하지 못해 GPU 예제와 C++ codegen을 직접 실행한 결과로 주장하지 않습니다.

- **[A4-1] [severity: high] line 63** — 인용: "이 과정을 backpropagation이라 하며, 이것이 자동화된 것이 **Automatic Differentiation**입니다." → 문제: Automatic Differentiation을 backpropagation의 자동화로 정의하면 forward-mode AD 등이 범위에서 빠집니다. gradient 자체도 optimizer가 적용할 ‘보정값’과 같지 않습니다. 확신도: high. → 제안: “Backpropagation은 신경망의 gradient를 계산하는 reverse-mode AD의 적용입니다. Gradient는 각 가중치 변화에 대한 loss의 변화율이며, optimizer가 이를 이용해 업데이트를 계산합니다.” [Baydin 외, AD 개관](https://www.jmlr.org/papers/volume18/17-468/17-468.pdf)

- **[A4-2] [severity: high] line 132-134** — 인용: "이 flag가 켜져 있는 텐서들만 computation graph에 연산 기록을 남기게 됩니다." → 문제: 기록 여부는 grad mode와 연산 입력들의 상태로 결정되며, `requires_grad=False`인 입력도 다른 입력의 gradient 계산에 필요한 값으로 저장될 수 있습니다. 입력의 값이 바뀌지 않는다는 이유만으로 입력 gradient가 불필요해지는 것도 아닙니다. 확신도: high. → 제안: “Grad mode에서 미분 가능한 연산의 입력 중 하나라도 `requires_grad=True`이면 backward graph를 기록합니다. 기본적으로 gradient는 학습 대상 leaf tensor의 `.grad`에 누적하며, 미분 대상이 아닌 입력값도 backward에 필요하면 저장합니다.” [Autograd mechanics](https://docs.pytorch.org/docs/stable/notes/autograd.html)

- **[A4-3] [severity: high] line 202** — 인용: "`PowBackward0`에 들어가는 입력은 $y$이며, 미분식 $2y$를 반환합니다." → 문제: 이 backward Node의 실행 입력은 incoming gradient이고, `y`는 forward에서 저장해 둔 값입니다. Node는 미분식 자체가 아니라 incoming gradient에 `2y`를 곱한 tensor를 반환합니다. 확신도: high. → 제안: “`PowBackward0`는 저장된 `y`와 입력 gradient `g`를 이용해 `g*2*y`를 계산합니다. 이 예제에서는 `g=1`, `y=4`이므로 8을 반환합니다.” [v1.13.1 미분 규칙](https://github.com/pytorch/pytorch/blob/v1.13.1/tools/autograd/derivatives.yaml)

- **[A4-4] [severity: high] line 275** — 인용: "출력의 `requires_grad`가 항상 `False`로 override됩니다" → 문제: `no_grad`에는 `requires_grad` 인자를 받는 factory function 등의 예외가 있습니다. 문장 앞부분의 ‘영향을 받는 모든 output’도 비교 연산이나 `detach`에 대해서는 성립하지 않습니다. 확신도: high. → 제안: “Grad mode에서 추적되는 미분 가능 연산의 출력은 `requires_grad=True`가 됩니다. `no_grad`와 `inference_mode`는 일반 연산의 미분 기록을 막으며, factory·view 등 세부 동작은 별도 규칙을 따릅니다.” [v2.13.0 `no_grad`의 factory 예외](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/autograd/grad_mode.py#L21-L68)

- **[A4-5] [severity: high] line 377-391** — 인용: "그래프에 등록된 함수들을 확인하며 역전파 계산에 필요한 함수들을 준비(`init_to_execute()`)합니다." → 문제: v1.13.1에서 `init_to_execute`는 요청한 gradient 대상 edge가 있을 때 조건부로 호출되므로 일반적인 인자 없는 `z.backward()`의 필수 단계가 아닙니다. 실제 준비에는 dependency 계산과 ready queue 처리가 포함돼 ‘함수를 찾아 등록할 뿐이라 오버헤드가 작다’는 결론도 근거가 부족합니다. 확신도: high. → 제안: 호출 흐름에 `compute_dependencies → [대상 지정 시 init_to_execute] → execute_with_graph_task → thread_main → evaluate_function → call_function`을 표시하고, 비용은 graph 크기·연산량에 따라 달라진다고 적습니다. [v1.13.1 Engine 구현](https://github.com/pytorch/pytorch/blob/v1.13.1/torch/csrc/autograd/engine.cpp#L1016-L1081)

- **[A4-6] [severity: high] line 393** — 인용: "PyTorch 1.0에서 eager mode 기반 Autograd가 핵심 기능으로 도입된 이후" → 문제: Autograd와 custom `Function`은 PyTorch 1.0 이전부터 존재합니다. 867줄의 ‘1.0부터 존재’라는 설명도 도입 시점을 잘못 전달합니다. 확신도: high. → 제안: “Autograd는 PyTorch 초기부터 제공됐으며, 이 절의 생성 코드 예시는 v1.13.1을 기준으로 합니다.”로 바꿉니다. [v0.4.0의 `torch.autograd.Function`](https://github.com/pytorch/pytorch/blob/v0.4.0/torch/autograd/function.py)

- **[A4-7] [severity: high] line 408-418** — 인용: "Autograd는 실제 tensor 값을 기반으로 동작하도록 설계되었기 때문에, fake tensor를 사용하는 tracing 과정에서 그대로 동작할지 확신하기 어렵습니다." → 문제: AOTAutograd는 바로 기존 eager Autograd engine을 FakeTensor 입력으로 실행해 backward 연산을 추적합니다. 22·405·414줄의 ‘두 미분 엔진’ 구도는 이 재사용 관계를 가리고 뒤의 648줄 설명과 충돌합니다. 확신도: high. → 제안: “AOTAutograd는 기존 Autograd를 이용해 forward와 backward를 FakeTensor로 실행하고 연산을 FX graph로 기록합니다. 컴파일된 영역은 runtime wrapper를 통해 eager Autograd engine에 연결됩니다.” [공식 PyTorch 2 설명](https://docs.pytorch.org/get-started/pytorch-2.0/), [PyTorch 2 논문](https://docs.pytorch.org/assets/pytorch2-2.pdf)

- **[A4-8] [severity: high] line 462-487** — 인용: "**AOTAutograd가 생성한 `torch.autograd.Function`** (예시)" → 문제: 아래 코드는 partition된 FX GraphModule의 함수 본문이지 `autograd.Function` 구현이 아닙니다. `self`를 받는 메서드와 저장 tensor를 명시적 인자로 받는 backward는 `ctx`를 사용하는 `Function` 인터페이스와 다릅니다. 확신도: high. → 제안: 제목을 “Partition된 forward/backward FX 코드”로 바꾸고, “이 두 graph를 컴파일한 callable을 runtime `autograd.Function`이 호출한다”라고 설명합니다. [v2.13.0 graph compilation과 wrapper 구성](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/_functorch/_aot_autograd/graph_compile.py)

- **[A4-9] [severity: high] line 541** — 인용: "`torch.compile`을 호출하면 위의 1~4번 과정이 순차적으로 일어나 최종적으로 forward와 backward를 모두 가진 `torch.autograd.Function`이 반환됩니다." → 문제: `torch.compile(model)`은 callable/module wrapper를 준비하고 일반적인 tracing·컴파일은 첫 실행 때 일어납니다. 사용자에게 내부 `autograd.Function` 객체를 직접 반환한다는 설명은 432·495줄과도 모순되며, 941줄의 ‘항상 nn.Module 형태’도 함수 입력 사례에는 맞지 않습니다. 확신도: high. → 제안: “`torch.compile`은 최적화된 실행을 준비하는 callable을 반환합니다. 이를 처음 실행할 때 graph를 캡처·컴파일하며, 학습 경로 내부에서 Autograd 연결용 wrapper를 구성합니다.” [공식 `torch.compile` API](https://docs.pytorch.org/docs/stable/generated/torch.compile.html)

- **[A4-10] [severity: high] line 571-573** — 인용: "이 FX Graph를 **C++ object로 표현**하여 C++로 구현된 Autograd engine에 그대로 넘김" → 문제: FX GraphModule을 별도 C++ graph로 변환해 Autograd engine에 넘기는 단계는 이 메커니즘이 아닙니다. Python callable을 FakeTensor로 실행하면서 기존 Autograd가 만드는 backward 연산을 dispatcher 수준에서 추적합니다. 확신도: high. → 제안: “FX GraphModule의 forward와 `torch.autograd.grad`를 실행하는 joint 함수를 만듭니다. 이를 FakeTensor로 실행하며 `__torch_dispatch__` 기반 tracing으로 forward·backward의 연산을 기록합니다.” [공식 PyTorch 2 설명](https://docs.pytorch.org/get-started/pytorch-2.0/)

- **[A4-11] [severity: high] line 652** — 인용: "forward/backward가 분리된 이 시점 이전에는 backend에 따른 최적화가 들어갈 여지가 없습니다." → 문제: Inductor는 partition 전에 joint-graph pass를 실행하며 partitioner에도 `compiler="inductor"`를 전달합니다. Backend별 정책은 decomposition 선택과 저장·재계산 결정에도 영향을 줍니다. 확신도: high. → 제안: “분리된 graph의 backend 코드 생성은 H 단계에서 수행합니다. Backend별 decomposition과 joint-graph 최적화, partition 정책은 그 전이나 partition 중에도 적용됩니다.” [v2.13.0 Inductor의 partition 함수](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/_inductor/compile_fx.py#L2104-L2146)

- **[A4-12] [severity: high] line 791-796** — 인용: "Torch IR → ATen IR → Core ATen IR → Prims IR" → 문제: 모든 AOTAutograd graph가 반드시 이 직렬 단계를 거쳐 Prims만으로 끝나는 것은 아닙니다. Backend에 전달할 op 집합과 decomposition table에 따라 달라지며, 같은 잘못된 필수 경로가 684·702줄에도 나옵니다. 확신도: high. → 제안: “AOTAutograd는 functionalization과 선택한 decomposition을 적용해 backend가 처리할 FX graph를 만듭니다. Core ATen과 Prims는 지원 대상으로 삼을 수 있는 op 집합이며, Prims로의 완전한 분해는 필수가 아닙니다.” [공식 IR 설명(main)](https://docs.pytorch.org/docs/main/user_guide/torch_compiler/torch.compiler_ir.html), [v2.13.0 Inductor 구현](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/_inductor/compile_fx.py)

- **[A4-13] [severity: high] line 759-764** — 인용: "**Forward Input** (`fw_inputs`): 원래 모델이 받는 입력값 그대로." → 문제: 모델 parameter·buffer도 graph 입력으로 넘겨지는 경우를 빠뜨려, 뒤에서 weight gradient를 구하는 이유가 설명되지 않습니다. 920·924·931줄의 ‘backward 결과는 weight gradient’라는 단정도 일반적으로는 미분 대상 입력들의 gradient로 고쳐야 합니다. 확신도: high. → 제안: “Forward 입력은 캡처된 영역의 입력 tensor이며 parameter·buffer를 포함할 수 있습니다. Backward는 그중 미분 대상 입력의 gradient를 반환합니다. 이 예제의 `grad_outs`는 모델 출력에 대한 loss의 gradient입니다.” Loss가 graph 바깥이라는 설명도 현재 예제에 한정합니다. [v2.13.0 parameter·buffer 입력 처리](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/_functorch/aot_autograd.py#L3645-L3704)

- **[A4-14] [severity: high] line 436** — 인용: "Backend compiler로 이미 최적화된 코드가 수행됨" → 문제: 기본 경로의 첫 backward에서는 그 호출 시점에 backend 컴파일을 수행하므로 ‘이미’라는 설명이 495·898줄과 충돌합니다. 확신도: high. → 제안: “아직 컴파일되지 않았다면 첫 backward 호출에서 backend 컴파일한 뒤 실행하고, 이후에는 결과를 재사용합니다.” [v2.13.0 backward 컴파일 분기](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/_functorch/_aot_autograd/graph_compile.py#L2099-L2245)

- **[A4-15] [severity: medium] line 937** — 인용: "Loss 계산이나 optimizer 쪽 코드에서 graph break가 발생할 가능성이 커서 하나의 trace로 깔끔하게 묶기 어렵기 때문입니다." → 문제: **needs verification**: 어떤 loss·optimizer·코드 구성을 말하는지 없어 graph break 가능성이 크다는 판단을 검증할 수 없습니다. Loss를 compiled 함수 안에 넣는 예제와 optimizer 컴파일은 공식적으로 제공되며, 이것과 학습 전체를 하나의 graph로 만드는 문제는 구분해야 합니다. 확신도: medium. → 제안: “Loss 계산도 compiled 영역에 포함할 수 있고 optimizer도 컴파일할 수 있습니다. 전체 step이 하나의 graph가 되는지는 별도 문제이므로 `TORCH_LOGS=graph_breaks`로 확인합니다. Compiled Autograd는 backward의 캡처 범위를 넓힙니다.” [공식 Compiled Autograd 예제](https://docs.pytorch.org/tutorials/intermediate/compiled_autograd_tutorial.html), [optimizer 컴파일 예제](https://docs.pytorch.org/tutorials/recipes/compiling_optimizer.html)

- **[A4-16] [severity: high] line 1029-1031** — 인용: "PyTorch 2.x는 Python 3.8+만 지원" → 문제: 2.x 전체에 동일한 최소 Python 버전을 적용할 수 없습니다. 예를 들어 2.9와 2.12는 최소 Python 3.10을 요구하며, 2.13 문서와 함께 제시하면서 2.3.0을 ‘최신 버전’ 예시로 드는 것도 일관되지 않습니다. 확신도: high. → 제안: “Python 지원 범위와 codegen 인자는 재현할 PyTorch tag마다 확인합니다. 예를 들어 v2.12는 Python 3.10 이상을 요구합니다.”로 바꾸고 `v2.3.0`은 ‘다른 버전의 예’라고 표시합니다. [v2.13.0 release compatibility matrix](https://github.com/pytorch/pytorch/blob/v2.13.0/RELEASE.md#release-compatibility-matrix)

검증 메모: `x=2 → y=4 → z=16`, `x.grad=16`은 맞습니다. `f(2,5)=11.652071…`, gradient `(5.5, 1.716337…)`도 이미지와 일치합니다. Clamp 예제의 예상 gradient는 `[3, 0]`이며, `MyCube`의 `grad_dx*6*x` 항은 두 번째 출력의 gradient 기여로 수학적으로 맞습니다. 747줄의 `leaves`·`gradOuts`는 실행 가능한 API 인자는 아니지만, 바로 뒤에서 pseudocode와 실제 인자명을 명시하므로 별도 오류로 세지 않았습니다. 이 덱에는 distributed collectives·DTensor/FSDP·vLLM·대역폭/FLOP 수치 주장이 없습니다.

버전·소스 확인: 495줄의 lazy lowering 연혁은 [v2.0의 lazy backward](https://github.com/pytorch/pytorch/blob/v2.0.0/torch/_functorch/aot_autograd.py#L2174-L2181), [v2.1의 저장된 SymInt 예외](https://github.com/pytorch/pytorch/blob/v2.1.0/torch/_functorch/aot_autograd.py#L2780-L2787), [v2.8의 Note·deepcopy 처리](https://github.com/pytorch/pytorch/blob/v2.8.0/torch/_functorch/_aot_autograd/runtime_wrappers.py#L1411-L1423)와 부합합니다. 665줄의 새 stage 이름들도 실제 구현에 존재합니다. v1.13.1 YAML의 add/mul/pow 규칙과 부록의 네 positional 인자 형식은 소스와 부합하며, 생성된 C++ 코드 전체의 동일성은 실제 codegen 재실행으로 추가 확인할 수 있습니다.

</details>
