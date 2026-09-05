# Review: 01-technical-background.mdx (2026-09-05)

리뷰어: Claude Fable 5.1 (서브에이전트) + OpenAI Codex `gpt-6-astra`.
대상: `src/content/lectures/01-technical-background.mdx` (383행). 읽기 전용 리뷰, 수정 없음.

## TL;DR

- **AI slop / 용어**: 양호. 음차어("트랜스포메이션", "랭귀지", "코스 그레인")와 비표준 명칭 "JIT Trace" 정리만 필요. 두 리뷰어 일치.
- **이해도**: 313–328행 "graph 추출의 역사"(Trace scheduling / OoO / Trace cache / V8)가 Dynamo와 연결되지 않아 가장 큰 구멍. 37–39 ↔ 169–174, 232–237 ↔ 271 중복. 342–353 특징 목록 과밀. 두 리뷰어 일치.
- **다이어그램**: Fisher 논문 표지 캡처는 장식용, vLLM 그림은 적절. 두 리뷰어 일치.
- **정확성**: 두 리뷰어 공통 high 5건. (1) 212행 NumPy가 pybind11 사용 — 틀림. (2) 380행 "CUDA는 PTX/SASS 기반 프로그래밍 모델" — 층위 혼동. (3) 228행 `torch.compile`을 AOT라 부름. (4) 353행 "2.0에서 training 지원이 처음" — TorchScript도 학습 지원. (5) 328행 trace scheduling에 "롤백 없이" — compensation code 개념과 혼동.
- Codex만 잡은 high: 60행 define-and-run / define-by-run 대응 순서 뒤집힘, 92행 "GPGPU 등장 2007"(CUDA 등장), 131행 "N³" 정의 누락.
- Fable만 잡은 medium: 137행 BLAS(1979)에 GEMM 포함(Level 3는 1990), 320행 V8은 tracing JIT 아님(TraceMonkey/PyPy가 맞는 예).

## 두 리뷰어가 일치한 항목 (우선 수정 후보)

| line | 문제 | 제안 |
|---|---|---|
| 33 | "트랜스포메이션" 음차 + 추상 동사 | "연산을 합치거나 순서를 바꿔 hardware target에 최적화" |
| 35 / 68 | 같은 도입 문장 3회 | 35행 삭제 |
| 37-39 / 169-174 | Dynamo/Inductor/Triton 설명 중복 | Q&A는 한 줄, 상세는 169-174만 |
| 39, 172 | "Dynamo = JIT Trace 대체, 컴파일러 유사" | "bytecode 분석 → FX graph 추출하는 graph capture frontend. TorchScript(trace/script)의 graph 획득 역할을 대신함" |
| 52 | MPI (1992) | 1994 (Forum 결성 1992) |
| 54 | TVM (OctoAI) | Apache TVM (UW 시작) |
| 121-125 | SIMD/SPMD/MIMD/MPI 무정의 | SPMD·rank·collective 한 줄 정의 |
| 138-139 | CUTLASS를 BLAS 구현으로 분류 | cuBLAS=BLAS 구현, CUTLASS=GEMM template 라이브러리(2017 공개) |
| 212 | NumPy가 pybind11 채택 | NumPy는 C + CPython C API, PyTorch는 pybind11(+ 직접 C API) |
| 228 | `torch.compile`의 ahead-of-time compilation | JIT임. "실행 전에 캡처하는 FX graph와 구분" 정도로 |
| 313-328 | 역사 4항목이 Dynamo와 무관하게 나열 | 각 항목에 한 줄 연결, 마지막에 "Dynamo도 trace + guard + recompile" |
| 322 | Fisher 논문 표지 이미지 | control-flow graph에서 hot path 선택 → compensation code 그림으로 교체 |
| 328 | "롤백 없이" | compensation code 설명으로 교체 |
| 342-353 | 특징 bullet 7개 과밀 | 2–3 슬라이드로 분할 |
| 351 | "제3 랭귀지/멀티 랭귀지 솔루션" | 명칭 없이 "Python API + C++ 구현 + CUDA/Triton kernel" |
| 353 | "2.0에서 training 지원" | "AOTAutograd가 backward graph까지 캡처해 forward+backward 모두 컴파일" |
| 379-381 | CUDA=PTX/SASS vs Triton=decorator | CUDA=SIMT(thread/block/grid 명시), Triton=block 단위 DSL, 둘 다 PTX로 컴파일 |

## 한쪽만 제기한 항목 (검토 필요)

- **Codex A4-2 (high) line 60**: `"define-and-run" vs. "define-by-run"`이 `Eager vs. graph mode` 순서와 반대. 232행과 충돌. 확인 결과 실제로 뒤집혀 있음.
- **Codex A4-5 (high) line 92**: "GPGPU의 등장 (2007)" → CUDA 등장. GPGPU는 2005년 이전부터.
- **Codex A4-6 (high) line 131**: "N³에 비례" — N 정의 없음, Strassen과 나란히 두면 모순.
- **Codex A4-8 (high) line 144-149**: "정적 model로 고정" — symbolic shape, graph break를 무시한 표현.
- **Codex A4-11 line 235-239**: PyTorch eager autograd(매 실행 기록)와 `tf.function`/`jax.jit`(trace 후 재사용)을 같은 define-by-run으로 묶음.
- **Fable A4-6 line 137**: BLAS 1979 = Level 1만. GEMM은 Level 3(1990).
- **Fable A4-7 line 320**: V8은 method JIT + deopt. tracing JIT 예는 TraceMonkey/PyPy/LuaJIT.
- **Fable A4-10 line 205**: Cython은 "#1 Python compiler"보다 "#2 언어 증강"에 해당. #1 예시는 PyPy/Numba/CPython 3.13 JIT.
- **Fable A2-3 line 61**: 예고한 "Interpretation vs JIT/AOT" 절이 본문에 없음.
- **Fable A3-3 line 355-363**: 결론 표(통합 지점 3개)에 스택 어느 층인지 보여주는 그림 없음. Codex도 A4-15에서 같은 표의 분류 기준 불일치 지적.
- **Fable A4-17 line 163**: Rebellions NPU의 TensorFlow 지원 — needs verification.

## 원문 리뷰

<details><summary>Fable 5.1 전문</summary>

# Review: `src/content/lectures/01-technical-background.mdx` (Week 1, PyTorch의 기술적인 배경)

## TL;DR

- **Axis 1 (AI slop/용어)**: 양호. LLM 문체는 거의 없고, 음차어 몇 개("트랜스포메이션", "랭귀지", "코스 그레인")와 "JIT Trace"라는 비표준 고유명사만 정리하면 됨.
- **Axis 2 (이해도/장황함)**: 보통. 313–328행(Trace scheduling/OoO/V8 나열)은 PyTorch와의 연결고리가 없어 초심자가 따라갈 수 없고, 37–39행과 169–174행, 232–237행과 271행이 사실상 중복. 61행에서 예고한 "Interpretation vs JIT/AOT"는 본문에 없음.
- **Axis 3 (다이어그램)**: Mermaid 없음, 이미지 2장. vLLM 이미지는 적절, Fisher 논문 캡처는 장식용.
- **Axis 4 (기술 정확성)**: 고칠 것 3개 — (1) 212행 "NumPy가 pybind11 방식을 채택"은 틀림(NumPy는 C + CPython C API), (2) 380행 "CUDA는 PTX/SASS 기반 프로그래밍 모델"은 ISA와 프로그래밍 모델 혼동, (3) 228행 `torch.compile`을 "ahead-of-time graph compilation"이라 부른 것은 deck 자체의 JIT 설명(61, 362행)과 모순.
- 그 외: 137행 "BLAS(1979)에 GEMM 포함"(GEMM은 1990 Level 3), 320행 V8은 tracing JIT가 아님, 39/172행 Dynamo를 "torch.jit.trace 대체·컴파일러 유사"로 소개한 부분.

---

## Axis 1 — AI slop / 음차어 / 비표준 용어

전반적으로 LLM 문체(극적 프레이밍, 서스펜스 문장, "즉/결국" 남발)는 거의 없음. 아래는 음차어와 비표준 명칭 위주.

- **[A1-1] [severity: medium] line 169-172** — 인용: "PyTorch 1.x에서도 JIT Trace가 모델을 정적 형태로 변환해주는 역할" / "Dynamo - JIT Trace를 대체하는 컴포넌트" → 문제: "JIT Trace"는 PyTorch에 없는 고유명사. 표준 명칭은 TorchScript tracing(`torch.jit.trace`)이며, 39행에서는 이미 `torch.jit.trace`로 쓰고 있어 deck 내부에서도 불일치. → 제안: "TorchScript(`torch.jit.trace`/`torch.jit.script`)"로 통일.
- **[A1-2] [severity: low] line 33** — 인용: "AI 가속기에 그대로 매핑하는 대신 트랜스포메이션 과정을 통해 하드웨어 타겟에 최적화합니다" → 문제: deck 전체가 영문 기술어를 그대로 쓰는데 여기만 음차. → 제안: "graph transformation을 거쳐 hardware target에 최적화합니다".
- **[A1-3] [severity: low] line 351** — 인용: "단순한 2개 언어가 아니라 제3 랭귀지 또는 멀티 랭귀지 솔루션" → 문제: "랭귀지" 음차 + "단순한 ~가 아니라" 패턴. 같은 bullet 앞부분에서 이미 "Three language layers"라고 썼으므로 중복. → 제안: 해당 구절 삭제하고 "Python(스크립팅) → C++(성능) → CUDA/Triton(kernel)"만 남김.
- **[A1-4] [severity: low] line 379** — 인용: "Triton은 코스 그레인한 데이터 블록 단위 처리" → 문제: 같은 줄의 "fine-grained"는 영문인데 "코스 그레인"만 음차. → 제안: "Triton은 coarse-grained한 block 단위 처리".
- **[A1-5] [severity: low] line 328** — 인용: "트레이스 스케줄링은 PGO에서 사용하는 특정 기법 중 하나입니다. 동적인 실행 경로(Trace)를 추출하여 브랜치 예측을 통해" → 문제: 317행은 "Trace scheduling", 328행은 "트레이스 스케줄링"으로 표기 불일치. "브랜치 예측"은 하드웨어 branch predictor를 연상시키는데 여기서는 컴파일러의 branch probability 추정을 뜻함. → 제안: "Trace scheduling"으로 통일, "브랜치 예측을 통해" → "profile이나 heuristic으로 추정한 branch 확률로".
- **[A1-6] [severity: low] line 348** — 인용: "**Heterogeneous computing** as an underneath foundation" → 문제: "underneath foundation"은 비관용 영어. → 제안: "as the underlying foundation".
- **[A1-7] [severity: low] line 112** — 인용: "구글의 데이터센터나 클라우드 기술도 유사한 구조를 가지고 있지만, 본질적인 차이가 존재합니다" → 문제: "본질적" filler. → 제안: "…유사한 구조지만 목적이 다릅니다:".
- **[A1-8] [severity: low] line 363** — 인용: "| Graph mode (codegen) | As a backend to Inductor |" → 문제: "Graph mode (codegen)"은 PyTorch 문서에 없는 분류 명칭. 의도는 Inductor의 device별 kernel codegen backend(예: `register_backend_for_device`). → 제안: "Graph mode (kernel codegen)" 또는 "Inductor codegen backend"로 바꾸고 각주에 `torch._inductor.codegen.common.register_backend_for_device` 언급.

## Axis 2 — 이해도 / ELI5 균형 / 장황함

- **[A2-1] [severity: high] line 313-320** — 인용: "Eager mode에서 graph를 추출하는 기법에는 오랜 역사가 있습니다: Trace scheduling for VLIW compiler (1981) / Out-Of-Order Execution in Pentium Pro (1995) / Trace cache (1996) / Chrome V8 Engine (2008)" → 문제: 네 항목이 "eager 프로그램에서 그래프 추출"과 어떻게 연결되는지 한 줄도 없음. 초심자는 VLIW, OoO, trace cache가 무엇인지도 모르고, 왜 여기 나오는지도 모름. 이 섹션의 진짜 요점(Dynamo도 "가장 자주 실행되는 경로를 trace로 뽑고, guard로 검증하며, 벗어나면 graph break/recompile")이 끝까지 안 나옴. → 제안: 각 항목 뒤에 한 줄씩 붙이고 마지막에 연결: "Trace scheduling — 분기가 있는 코드에서 가장 확률 높은 직선 경로(trace)를 뽑아 그 경로만 최적화 / OoO — 순차 명령 스트림에서 의존성 graph를 동적으로 구성 / Trace cache — 실행된 명령 경로를 그대로 캐시해 재사용 / Tracing JIT — 동적 언어의 hot path를 trace하여 컴파일, 가정이 깨지면 deopt. TorchDynamo도 같은 구조: Python bytecode를 trace해 FX graph를 만들고 guard로 가정을 검증, 깨지면 recompile."
- **[A2-2] [severity: medium] line 328** — 인용: "PGO(Profile-Guided Optimization)는 프로그램의 동적인 특성을 컴파일 타임에 활용해 최적화를 수행하는 더 넓은 개념이며, … 롤백 없이 효율적인 성능을 제공하는 것이 핵심입니다." → 문제: 네 문장이 한 단락에 밀려 있고, 위 A2-1의 연결 없이 PGO 정의로 끝남. 절반으로 줄일 수 있음. → 제안: "Trace scheduling은 profile로 가장 자주 실행되는 경로(trace)를 고르고, 그 경로를 하나의 basic block처럼 스케줄링합니다. trace를 벗어나는 경우는 보상 코드로 처리합니다. Dynamo의 guard/graph break가 같은 발상입니다."
- **[A2-3] [severity: medium] line 61** — 인용: "- Interpretation vs. JIT(Just in Time)/AOT(Ahead of Time) compilation" → 문제: "오늘 다룰 주제"로 예고했지만 본문(197–328행)에 이 딜레마를 다루는 섹션이 없음. 362행 표에 "JIT & AOT"가 잠깐 나올 뿐. → 제안: 313행 섹션 앞에 3–4줄짜리 "Interpretation vs JIT/AOT" 소절을 추가(eager = interpretation, `torch.compile` = JIT, `torch.export`/AOTInductor = AOT)하거나 61행 항목을 삭제.
- **[A2-4] [severity: medium] line 122, 317, 380, 310** — 인용: "개념적인 모델 - SIMD, SPMD, MIMD" / "for VLIW compiler" / "CUDA는 PTX/SASS 기반" / "컴파일 가능한 FX graph 구간" → 문제: SIMD/SPMD/MIMD, VLIW, PTX/SASS, FX graph 모두 정의 없이 등장. 대상 독자(내부 구조 모르는 PyTorch 사용자)는 SPMD와 FX graph를 모름. → 제안: 각 첫 등장에 괄호 한 줄. 예: "SPMD(같은 프로그램을 여러 process가 서로 다른 데이터에 실행 — `torch.distributed`의 기본 모델)", "FX graph(PyTorch op 호출을 node로 갖는 중간 표현, `torch.fx`)", "PTX/SASS(NVIDIA GPU의 가상/실제 ISA)".
- **[A2-5] [severity: medium] line 201-203** — 인용: "### Two (or More) Language Problems / Python은 사용하기 쉽지만 성능 문제가 있습니다." → 문제: "two-language problem"이 무엇인지 정의 없이 해결책부터 나열. → 제안: 첫 줄에 "Two-language problem(Julia 커뮤니티가 붙인 이름): 프로토타입은 Python으로 짜고 성능이 필요해지면 C/C++로 다시 짜야 하는 문제" 추가.
- **[A2-6] [severity: medium] line 167-174** — 인용: "#### PyTorch에서의 ML Compiler … Dynamo / Inductor / Triton" → 문제: 37–39행 Q&A 블록과 내용이 거의 같음(세 컴포넌트 동일 설명). → 제안: 37–39행 Q&A는 "Dynamo/Inductor/Triton — 뒤 ML Compiler 절에서 다룸" 한 줄로 줄이고 상세는 167–174행에만 둠.
- **[A2-7] [severity: low] line 271** — 인용: "TF1은 프로그래머들에게 명시적으로 그래프를 그려달라고 요청했지만, TF2나 PyTorch는 eager 모드로 모델을 만들어주면 거기서 자체적으로 그래프를 뽑아내는 방식" → 문제: 232–237행의 define-and-run/define-by-run 설명을 그대로 반복. → 제안: 271행 문단을 "TF2와 PyTorch가 실제로 어떻게 graph를 뽑는지 코드로 봅니다." 한 줄로 교체.
- **[A2-8] [severity: low] line 192-194** — 인용: "NumPy는 TensorFlow와 PyTorch의 API 설계와도 밀접한 관련이 있으며, 특히 텐서 연산 처리 방식에서 공통점이 많습니다. / NumPy API는 PyTorch의 tensor API 설계에 영향을 주었고" → 문제: 연속 두 문장이 같은 말. → 제안: 192행 둘째 문장 삭제.
- **[A2-9] [severity: low] line 139** — 인용: "cuBLAS (2007, closed-source), CUTLASS (2018, 오픈소스) - cuBLAS는 클로즈드 소스로 제공되지만, CUTLASS는 오픈소스 라이브러리로 누구나 접근 가능합니다." → 문제: 괄호 안 내용을 뒤에서 다시 풀어씀. → 제안: " - " 이후 삭제.
- **[A2-10] [severity: low] line 35, 68** — 인용: "ML Framework의 발전은 이전 연구와 산업적 성과가 축적된 결과입니다. 서로 다른 분야에서 발전한 기술적 흐름이 합쳐져" / "ML Framework은 서로 다른 뿌리를 가진 네 가지 기술적 흐름 위에서 만들어졌습니다." → 문제: 같은 문장이 세 번(35행 두 문장 + 68행). → 제안: 35행 삭제, 68행만 유지.
- **[A2-11] [severity: medium] line 342-353** — 인용: "**핵심 특징:** … (bullet 7개)" → 문제: 한 슬라이드에 7개 bullet, 각 1–3줄. 슬라이드 크기에서 읽기 어려움. → 제안: "언어/API" (NumPy-like, three language layers), "실행 모델" (heterogeneous, MPI-like), "컴파일" (define-by-run + Dynamo, training/inference, compute library 통합) 3개 슬라이드로 분할하고 각 bullet을 1줄로.
- **[A2-12] [severity: medium] line 133-134** — 인용: "**최적화 기술:** - Algorithmic efficiency 측면: Strassen algorithm, DeepMind의 AlphaTensor 등" → 문제: 알고리즘 측면만 있어서, 바로 다음 줄의 "vendor별 BLAS 구현"이 왜 필요한지(실제 속도는 blocking/tiling, cache, Tensor Core 활용에서 나옴) 독자가 연결하지 못함. Strassen/AlphaTensor는 실제 GPU GEMM에서는 거의 쓰이지 않음. → 제안: bullet 추가 "구현 측면(실제 성능을 결정): cache blocking/tiling, vectorization, Tensor Core 활용 — 이것이 vendor BLAS(cuBLAS)와 CUTLASS가 하는 일".
- **[A2-13] [severity: low] line 339** — 인용: "PyTorch가 여러 framework와 hardware backend 사이의 공통 interface인 \"Narrow Waist\" 역할" → 문제: "Narrow Waist"는 인터넷 아키텍처(IP 모래시계) 용어인데 설명 없이 등장. 이 deck에서 분석 비유가 도움이 될 몇 안 되는 자리. → 제안: "(인터넷에서 IP가 위의 수많은 application과 아래의 수많은 link 기술을 한 층으로 잇는 것처럼)" 한 구절 추가.
- **[A2-14] [severity: low] line 228** — 인용: "backward propagation은 이 graph의 `Function` node를 따라 실행됩니다" → 문제: `Function`이 무엇인지 앞에서 설명 없음(후속 강의 내용). → 제안: "`Function` node(tensor의 `grad_fn`)" 로 독자가 확인할 수 있는 이름을 붙임.

## Axis 3 — 다이어그램

Mermaid 블록 없음. `<img>` 2개.

- **[A3-1] [severity: low] line 322** — 인용: `<img src="/images/01/slide16_1.png" … alt="Trace Scheduling paper by Joseph A. Fisher, 1981" />` → 문제: Fisher 1981 논문 첫 페이지 캡처. 인용 출처로는 맞지만 본문이 설명하는 메커니즘(trace 추출 → 최적화 → off-trace 처리)은 전혀 보여주지 않는 장식용 이미지. 위 A2-1 문제와 겹쳐, 이 슬라이드에는 "무엇을" 보여주는 그림이 없음. → 제안: 논문 캡처는 각주로 내리고, basic block 4–5개짜리 control-flow graph에서 hot path를 강조한 간단한 Mermaid `flowchart`(node ≤ 6)로 교체. Dynamo의 graph break/guard와 대응시키면 313–328행 전체가 살아남.
- **[A3-2] [severity: low] line 334** — 인용: `alt="vLLM tweet - PyTorch as a Narrow Waist for hardware abstractions"` → 문제: 이미지는 적절하고 slide 크기에서 잘 읽힘(Models/Utilities → PyTorch → NVIDIA/AMD/Intel GPU/TPU). 다만 본문 339행은 "여러 framework와 hardware backend 사이"라고 쓰는데 그림 위쪽 라벨은 "Models, Utilities"라 용어가 어긋남. 본문이 말하는 "hardware plugin / custom operator"도 그림에 없음. → 제안: 339행을 "위로는 model/serving 코드, 아래로는 여러 hardware backend 사이"로 그림 라벨에 맞춤.
- (없는 그림) **[A3-3] [severity: medium] line 355-363** — 인용: "| Eager mode | As a new dispatch target |" → 문제: 이 deck의 결론에 해당하는 표인데, 세 통합 지점이 PyTorch 스택의 어느 층(Python API → Dynamo → Inductor → dispatcher/kernel)에 꽂히는지 그림이 없어 세 행의 관계가 안 보임. → 제안: `flowchart TB`로 "Python model → TorchDynamo → (custom backend ①) / Inductor → (codegen backend ②) / ATen dispatcher → (new device ③)" 5–6 node 그림 추가.

## Axis 4 — 기술 정확성

코드 스니펫(247–253, 259–264, 275–286, 292–308)은 모두 실행 가능하고 설명과 일치함. 아래는 산문의 사실 관계.

- **[A4-1] [severity: high] line 212** — 인용: "pybind11을 통한 Python + C++11 결합이 대표적이며, NumPy와 PyTorch가 이 방식을 채택하고 있습니다." → 문제: NumPy는 pybind11을 쓰지 않음. NumPy core는 C로 작성되어 CPython C API(extension module)로 직접 바인딩됨. pybind11을 쓰는 것은 PyTorch(`torch/csrc`). (confidence: high) → 제안: "다른 언어로 작성된 모듈과 binding — NumPy는 C + CPython C API, PyTorch는 C++ + pybind11".
- **[A4-2] [severity: high] line 380** — 인용: "**프로그래밍 모델**: CUDA는 PTX/SASS 기반, Triton은 Python 데코레이터 형태의 API 제공" → 문제: PTX/SASS는 CUDA의 프로그래밍 모델이 아니라 컴파일 결과물(가상 ISA/실제 ISA)임. CUDA의 프로그래밍 모델은 C/C++ 확장 + SIMT(thread/block/grid를 개발자가 명시). Triton도 최종적으로 PTX로 컴파일되므로 이 비교는 서로 다른 층을 나란히 놓은 것. (confidence: high) → 제안: "프로그래밍 모델: CUDA는 C/C++ 확장에서 thread/block/grid를 직접 다루는 SIMT 모델, Triton은 `@triton.jit` Python DSL에서 block 단위 tensor 연산을 기술. 둘 다 최종적으로 PTX → SASS로 컴파일됨."
- **[A4-3] [severity: medium] line 228** — 인용: "이 동적 autograd graph는 `torch.compile`의 ahead-of-time graph compilation과는 구분해야 합니다." → 문제: `torch.compile`은 첫 호출 시 컴파일하는 JIT임(61행, 362행에서 deck도 JIT로 분류). "ahead-of-time"은 `torch.export`/AOTInductor에 해당. AOTAutograd라는 컴포넌트 이름 때문에 혼동한 것으로 보이나, 그것도 "backward를 실행 전에 미리 trace한다"는 뜻이지 전체가 AOT 컴파일이라는 뜻은 아님. (confidence: high) → 제안: "이 동적 autograd graph는 `torch.compile`이 실행 전에 한 번에 캡처하는 FX graph와는 구분해야 합니다."
- **[A4-4] [severity: medium] line 39, 172** — 인용: "**Dynamo**(torch.jit.trace를 대체)" / "Dynamo - JIT Trace를 대체하는 컴포넌트로, 컴파일러와 유사한 역할 수행" → 문제: Dynamo는 컴파일러가 아니라 Python bytecode를 분석해 FX graph를 뽑는 graph capture frontend. "torch.jit.trace 대체"도 부정확 — `torch.jit.trace`는 2.x에서 여전히 존재하고, Dynamo가 대체한 것은 TorchScript의 tracing/scripting 기반 graph acquisition 역할. (confidence: high) → 제안: "Dynamo — CPython frame evaluation hook(PEP 523)으로 bytecode를 분석해 FX graph를 추출하는 graph capture frontend. TorchScript(trace/script)가 하던 graph 획득 역할을 대신함."
- **[A4-5] [severity: medium] line 39, 174** — 인용: "**Triton**(도메인 특화 언어)이 주요 ML 컴파일러 컴포넌트로 작동합니다" / "Triton - 도메인 특화 언어(DSL)로, GPU를 위한 커널 최적화 작업에 활용" → 문제: Triton은 OpenAI가 개발한 별도 프로젝트이며 PyTorch 컴포넌트가 아님 — Inductor가 NVIDIA/AMD GPU codegen target으로 사용할 뿐. 반면 PyTorch 2.0 발표가 핵심으로 꼽은 AOTAutograd(forward/backward graph를 함께 캡처)와 PrimTorch는 deck 어디에도 없어 353행의 "training 지원" 주장이 근거 없이 떠 있음. (confidence: high) → 제안: 컴포넌트 목록을 "TorchDynamo(graph capture) → AOTAutograd(backward graph 생성) → TorchInductor(컴파일러) → Triton/C++(codegen target; Triton은 OpenAI 프로젝트)"로.
- **[A4-6] [severity: medium] line 137** — 인용: "**BLAS** (Basic Linear Algebra Subprograms, 1979) - … Matrix multiplication을 위한 **GEMM**(General Matrix Multiply)을 포함합니다." → 문제: 1979년 BLAS는 Level 1(vector-vector)만 정의. GEMM은 1990년 Level 3 BLAS에서 추가됨(Level 2 matrix-vector는 1988). (confidence: high) → 제안: "BLAS (Level 1 1979 → Level 3 1990) - Level 3에서 **GEMM**이 정의됨".
- **[A4-7] [severity: medium] line 320** — 인용: "- **Chrome V8 Engine** (2008)" → 문제: V8은 trace 기반 JIT가 아님. V8은 method JIT + inline cache + speculative optimization/deoptimization(Crankshaft 2010, TurboFan) 구조. 2008년의 tracing JIT는 Mozilla TraceMonkey. "eager 프로그램에서 trace를 뽑는다"는 문맥에서는 TraceMonkey/LuaJIT/PyPy가 맞는 예. (confidence: high) → 제안: "Tracing JIT — TraceMonkey (2008), PyPy" 로 교체하거나, V8을 남기려면 "V8의 speculative optimization + deopt — Dynamo의 guard와 같은 발상"으로 항목 설명을 바꿈.
- **[A4-8] [severity: medium] line 328** — 인용: "올바른 트레이스를 만들어 롤백 없이 효율적인 성능을 제공하는 것이 핵심입니다." → 문제: Trace scheduling에는 rollback이 없음. trace를 벗어나는 경로는 compensation(bookkeeping) code로 정합성을 맞춤. "롤백"은 OoO의 misprediction squash나 tracing JIT의 deopt/side-exit 개념. 세 가지를 한 문장에 섞음. (confidence: high) → 제안: "trace를 벗어나는 경로에는 보상 코드를 넣어 정합성을 맞추며, 잘못 고른 trace는 보상 코드가 늘어 성능이 떨어집니다." (A2-2 제안문과 합치면 됨)
- **[A4-9] [severity: medium] line 353** — 인용: "Graph mode(컴파일) 경로가 inference뿐 아니라 training까지 지원하게 된 것이 PyTorch 2.0에서 가장 크게 변화한 부분" → 문제: TorchScript도 autograd를 통한 training은 가능했음. 2.0의 새 점은 AOTAutograd가 backward graph까지 캡처해 forward/backward 모두를 Inductor로 최적화한다는 것. 메커니즘 이름 없이 결과만 적혀 있어 반박 가능. (confidence: medium) → 제안: "AOTAutograd가 backward graph까지 캡처해, 컴파일 최적화가 inference뿐 아니라 training(forward+backward)에도 적용됨 — 2.0의 가장 큰 변화".
- **[A4-10] [severity: low] line 205-206** — 인용: "**해결책 #1: 고성능 Python compiler를 개발** - Cython의 성능이 점점 좋아지고 있으며, PyPy같은 대안 프로젝트도 존재합니다." → 문제: Cython은 순수 Python을 빠르게 하는 컴파일러가 아니라 `cdef` 타입 주석을 붙인 Python 초집합을 C로 변환하는 도구 — 분류상 "#2 언어 증강"에 더 가까움. #1의 예로는 PyPy, Numba, CPython 3.13의 experimental JIT가 맞음. (confidence: high) → 제안: #1 예시를 "PyPy, Numba, CPython 3.13 JIT(experimental)", #2 예시를 "Cython, Mojo"로 이동.
- **[A4-11] [severity: low] line 54** — 인용: "XLA (Google), TensorRT (Nvidia), TVM (OctoAI), Glow (Meta)" → 문제: TVM은 UW(Tianqi Chen)에서 시작된 Apache 프로젝트. OctoML(2023년 OctoAI로 개명, 2024년 말 NVIDIA에 인수)은 상용화 회사. (confidence: high) → 제안: "Apache TVM (UW/OctoML)".
- **[A4-12] [severity: low] line 52** — 인용: "Distributed programming - MPI (1992)" → 문제: 1992년은 MPI Forum 결성 시점이고 MPI-1 표준은 1994년. (confidence: high) → 제안: "MPI (1994; Forum 결성 1992)".
- **[A4-13] [severity: low] line 138-139** — 인용: "각 HW vendor들은 자사 하드웨어에 최적화된 BLAS 구현을 출시합니다: - Nvidia: **cuBLAS** (2007, closed-source), **CUTLASS** (2018, 오픈소스)" → 문제: CUTLASS는 BLAS API 구현이 아니라 GEMM을 조립하는 CUDA C++ template 라이브러리. cuBLAS가 BLAS 구현, CUTLASS는 그 구성 요소를 공개한 것. (confidence: high) → 제안: "cuBLAS (BLAS 구현, closed), CUTLASS (GEMM building block template 라이브러리, open)".
- **[A4-14] [severity: low] line 318** — 인용: "**Out-Of-Order Execution** in Pentium Pro (1995)" → 문제: OoO는 CDC 6600(1964)/IBM 360-91 Tomasulo(1967)가 원조. Pentium Pro는 x86 대중화 시점. 연도 표기 자체는 맞으나 "등장"으로 읽힘. (confidence: high) → 제안: "Out-of-Order Execution (Tomasulo 1967; x86 대중화는 Pentium Pro 1995)".
- **[A4-15] [severity: low] line 122-123** — 인용: "**개념적인 모델** - SIMD, SPMD, MIMD / **구현 표준** - MPI, OpenMP" → 문제: SIMD/MIMD는 Flynn 분류의 하드웨어 구조, SPMD는 프로그래밍 모델 — 한 줄에 다른 층위가 섞임. (confidence: high) → 제안: "하드웨어 분류(Flynn): SIMD, MIMD / 프로그래밍 모델: SPMD / 구현 표준: MPI, OpenMP".
- **[A4-16] [severity: low] line 372** — 인용: "그렇게 보기는 어렵습니다. TorchScript는 Python과 C++ 사이의 binding layer가 아니라" → 문제: binding layer가 아니라는 답은 맞지만, TorchScript가 Python 없이 libtorch(C++)에서 모델을 실행하기 위한 IR/interpreter였다는 점에서 질문자의 직관(Python과 C++ 사이)에도 근거가 있음. 답이 너무 단정적. (confidence: high) → 제안: "binding layer는 아니지만, Python 코드를 C++ interpreter(libtorch)가 실행할 수 있는 IR로 바꾸는 층이었다는 점에서는 그렇게 볼 수도 있습니다. 현재는 deprecated…" 로 완화.
- **[A4-17] [severity: low] line 163** — 인용: "| Rebellions NPU | TensorFlow, PyTorch | RBLN Compiler |" → 문제: RBLN SDK의 TensorFlow(Keras) 지원 범위는 needs verification(공식 문서의 지원 프레임워크 목록 확인). → 제안: 확인 후 유지 또는 PyTorch만 남김.
- **[A4-18] [severity: low] line 351** — 인용: "GPU/TPU/NPU 등의 하드웨어에서는 커널 레벨의 최적화 성능을 제공" → 문제: PyTorch 본체는 TPU를 직접 지원하지 않음(PyTorch/XLA 경유). 이 deck의 "three language layers" 맥락에서 TPU는 CUDA/Triton kernel 층이 없음. (confidence: high) → 제안: "GPU/NPU".

</details>

<details><summary>Codex gpt-6-astra 전문</summary>

문체는 대체로 강의체를 유지하지만, 도입부의 반복과 불필요한 음역은 줄일 필요가 있습니다.
이해도 측면에서는 graph·병렬 프로그래밍 용어의 정의가 부족하고, 후반 특징 목록이 과밀합니다.
이미지 2개를 모두 확인했습니다. 논문 표지는 메커니즘 설명을 대신하지 못하며, vLLM 구조 그림은 본문과 부합합니다. Mermaid는 없습니다.
기술 설명은 수정이 필요합니다. 최우선 3건은 **trace scheduling과 graph capture 구분**, **PyTorch 1.x의 학습 지원 이력 정정**, **CUDA/Triton 비교 기준 통일**입니다.

## Axis 1 — AI 문체와 비표준 용어

- **[A1-1] [severity: medium] line 33** — 인용: "컴파일러 역할로 AI 가속기에 그대로 매핑하는 대신 트랜스포메이션 과정을 통해 하드웨어 타겟에 최적화합니다." → 문제: 추상적인 동사와 불필요한 음역이 겹쳐 실제로 무엇을 바꾸는지 드러나지 않습니다. → 제안: "컴파일러는 연산을 합치거나 실행 순서를 바꿔 대상 하드웨어에 맞게 최적화합니다."

- **[A1-2] [severity: medium] line 35** — 인용: "ML Framework의 발전은 이전 연구와 산업적 성과가 축적된 결과입니다." → 문제: 다음 문장이 같은 내용을 반복하며, 어떤 기술이 축적됐는지는 뒤의 목차가 더 구체적으로 설명합니다. → 제안: 두 문장을 삭제하고 배경 기술 목록으로 바로 넘어갑니다.

- **[A1-3] [severity: medium] line 37-39** — 인용: "컴파일러의 정의를 먼저 살펴봐야 합니다." → 문제: 정의를 실제로 제시하지 않는 예고 문장입니다. 이 Q&A의 컴포넌트 설명은 169–174줄에서 다시 나옵니다. → 제안: 예고 문장을 삭제하고 여기서는 "PyTorch 2.x의 기본 컴파일 경로는 TorchDynamo와 TorchInductor를 사용합니다"만 남긴 뒤 역할 설명은 뒤에서 합니다.

- **[A1-4] [severity: medium] line 351** — 인용: "제3 랭귀지 또는 멀티 랭귀지 솔루션" → 문제: 정착된 PyTorch 계층명이나 메커니즘명이 아니며, 영어를 음역한 표현이 설명을 늘립니다. `Two-language problem`은 통용되는 표현이지만 이 확장 명칭에 대응하는 표준 용어는 없습니다. → 제안: 이름을 붙이지 말고 "Python API와 C++ 구현, CUDA C++·Triton으로 작성한 GPU kernel을 함께 사용합니다"로 서술합니다.

- **[A1-5] [severity: low] line 379** — 인용: "코스 그레인한 데이터 블록 단위 처리" → 문제: `coarse-grained`를 음역한 뒤 같은 의미의 "데이터 블록 단위"를 덧붙였습니다. → 제안: "Triton은 데이터 블록 단위의 연산을 기술합니다"로 줄입니다.

`Narrow Waist`는 첨부된 vLLM 원문에도 있는 표현이므로 발명된 용어로 판정하지 않았습니다. 일반적인 존댓말과 강의형 질문 자체는 지적 대상에서 제외했습니다.

## Axis 2 — 이해도·비유·분량

- **[A2-1] [severity: medium] line 25-29** — 인용: "**OS**이자 - AI 가속기를 추상화된 computing resource로 제공" → 문제: OS·언어·컴파일러라는 세 비유가 실제 구성요소와의 구분 없이 연달아 나옵니다. 입문자는 PyTorch 자체가 운영체제나 별도 프로그래밍 언어라고 받아들일 수 있습니다. → 제안: "역할을 비유하면, OS처럼 장치 차이를 감추고, API로 모델을 표현하게 하며, 컴파일러로 연산을 최적화합니다"로 비유의 범위를 먼저 밝힙니다.

- **[A2-2] [severity: medium] line 121-125** — 인용: "**개념적인 모델** - SIMD, SPMD, MIMD" → 문제: 정의되지 않은 약어 다섯 개에 rank·process·collective가 이어져 기초 PyTorch 사용자에게 연결고리가 없습니다. → 제안: 이번 설명에 필요한 SPMD와 MPI를 우선 소개하고, "SPMD는 여러 process가 같은 프로그램을 각자 다른 데이터에 실행하는 방식입니다. rank는 process 번호이며, collective는 참여 process들이 함께 수행하는 통신입니다"를 붙입니다. all-reduce에는 "각자의 값을 더해 모두가 합계를 받는다"는 예시 하나면 충분합니다.

- **[A2-3] [severity: medium] line 144** — 인용: "정적인 graph로 전환된 ML model" → 문제: 첫 본격 compiler 설명에서 graph를 정의하지 않고, 뒤에서는 autograd graph와 FX graph까지 등장합니다. → 제안: 먼저 "여기서 graph는 연산을 점으로, 연산 사이의 데이터 의존성을 화살표로 표현한 계산 계획입니다"를 넣고 `sin(x)`, `cos(y)`가 `add`로 연결되는 작은 예 하나를 제시합니다.

- **[A2-4] [severity: medium] line 203-213** — 인용: "Python은 사용하기 쉽지만 성능 문제가 있습니다." → 문제: 어떤 실행 비용을 말하는지 빠져 있어, 이미 GPU에서 수행되는 `torch.matmul`도 Python compiler만 바꾸면 빨라진다고 이해할 수 있습니다. → 제안: "Python 반복문으로 원소를 하나씩 계산하면 interpreter 비용이 큽니다. NumPy·PyTorch는 큰 연산을 native 코드에 맡기고, 작은 연산이 많을 때는 Python 호출 비용을 줄이는 컴파일도 활용합니다"로 적용 범위를 설명합니다.

- **[A2-5] [severity: medium] line 246-264** — 인용: "x1 = torch.rand(2, 3)" → 문제: TF1은 상수 행렬곱, PyTorch는 난수 원소별 덧셈이라 실행 방식 외의 차이도 함께 비교하게 됩니다. → 제안: PyTorch 예제를 `a = torch.tensor([[3, 3]])`, `b = torch.tensor([[2], [2]])`, `c = torch.matmul(a, b)`, `print(c)`로 맞추고 양쪽 모두 값 12, shape `(1, 1)`임을 보여줍니다.

- **[A2-6] [severity: medium] line 266** — 인용: "별도의 그래프 실행 과정이 필요 없으며, 코드 한 줄 한 줄이 실시간으로 계산됩니다." → 문제: 앞 문장의 "각 줄의 연산이 즉시 수행"과 같은 설명을 반복합니다. "실시간"은 이 예제에 필요 없는 성능상의 뉘앙스도 더합니다. → 제안: 문단을 "이 CPU 예제에서는 `+`를 호출하면 계산 결과가 담긴 `y`를 얻습니다. 별도의 `Session.run()`은 필요하지 않습니다"로 줄입니다.

- **[A2-7] [severity: medium] line 346-353** — 인용: "**핵심 특징:**" → 문제: 일곱 항목 안에 API 사용성·장치별 구현·통신·언어·컴파일·학습이 한꺼번에 들어 있고, 특히 348·350·351줄의 부연이 깁니다. 한 화면에서 읽기에는 주제 전환이 많습니다. → 제안: "기존 실행 기반: NumPy형 API, 장치별 연산 구현, 분산 통신"과 "2.x의 컴파일 경로: graph capture, backend 최적화, forward/backward 컴파일"로 나눕니다. 각 항목에는 역할 한 문장만 남깁니다.

## Axis 3 — 모든 이미지와 Mermaid 검토

대상은 `<img>` 2개이며 `<Mermaid>`와 `mindmap`은 0개입니다. 두 원본 이미지를 직접 열었습니다. 현재 파일과 레이아웃은 고정 슬라이드 경계가 없는 article 구조이므로, 실제 슬라이드 overflow를 측정했다고 주장하지 않고 발표용 축소 시의 가독성을 평가했습니다.

- **[A3-1] [severity: medium] line 322-328** — 인용: "Trace Scheduling paper by Joseph A. Fisher, 1981" → 문제: `slide16_1.png`는 논문 제목·저자·초록의 일부이며, 경로 선택이나 instruction 재배치 과정을 전혀 보여주지 않습니다. 제목·연도는 캡션과 일치하지만 작은 논문 본문은 발표 화면에서 설명 자료로 읽기 어렵습니다. → 제안: 표지는 작은 출처 이미지로 남기고, 분기 있는 control-flow graph에서 trace를 선택한 뒤 연산을 재배치하고 필요하면 compensation code를 넣는 전후 그림을 별도로 제시합니다.

- **[A3-2] [severity: low] line 334-339** — 인용: "vLLM tweet - PyTorch as a Narrow Waist for hardware abstractions" → 문제: 구조상 유의미한 문제는 없습니다. `slide17_1.png`의 Models·Utilities → PyTorch → 여러 장치 연결은 본문의 공통 인터페이스 설명과 맞고, 노드 수와 연결도 읽기 적절합니다. → 제안: 유지하되 plugin 내부 동작을 설명하는 그림으로 확대 해석하지 않습니다.

## Axis 4 — 기술적 정확성

검증 범위는 1–383줄 전체입니다. 아래 확신도는 각 판단의 확실성을 뜻합니다. 이 파일에는 PyTorch 2.13 링크나 소스 call stack 인용이 없으며, 웹에서 확인한 공식 문서의 버전 표시는 2.13과 2.14가 섞여 있어 버전별로 달라질 수 있는 세부사항은 구분했습니다.

- **[A4-1] [severity: high] line 172** — 인용: "**Dynamo** - JIT Trace를 대체하는 컴포넌트로, 컴파일러와 유사한 역할 수행" → 문제: TorchDynamo는 `torch.compile`의 graph capture frontend이며, `torch.jit.trace`의 export 기능을 그대로 대체하는 API가 아닙니다. 39줄의 같은 설명과 "컴파일러 유사"라는 표현도 역할 구분을 흐립니다. **확신도: high.** → 제안: "TorchDynamo는 Python bytecode를 분석해 FX graph 구간을 추출하고 backend에 전달합니다. 기본 backend인 TorchInductor가 이를 최적화하고 실행 코드를 생성합니다"로 교체합니다. [공식 compiler 구성 설명](https://docs.pytorch.org/docs/stable/user_guide/torch_compiler/torch.compiler.html)

- **[A4-2] [severity: high] line 60** — 인용: "Eager vs. graph mode: "define-and-run" vs. "define-by-run"" → 문제: 순서대로 읽으면 대응이 뒤집혀 있으며, 232–235줄의 분류와도 충돌합니다. 전통적인 용법은 eager/dynamic graph가 define-by-run, 실행 전에 graph를 구성하는 방식이 define-and-run입니다. **확신도: high.** → 제안: "Eager: define-by-run / 사전 graph 구성: define-and-run"으로 명시하고, eager 스타일 코드의 tracing은 별도 설명으로 분리합니다. [TensorFlow의 eager·graph 실행 구분](https://www.tensorflow.org/guide/intro_to_graphs)

- **[A4-3] [severity: medium] line 52** — 인용: "Distributed programming - MPI (1992)" → 문제: 1992년은 표준화 논의가 시작된 시점이며 MPI 1.0 표준 문서는 1994년입니다. 다른 항목의 출시 연도와 섞어 쓰면 최초 표준 발표가 1992년으로 읽힙니다. **확신도: high.** → 제안: "MPI: 표준화 논의 시작 1992, MPI 1.0 1994"로 표기합니다. [MPI Forum의 1.0·1.1 이력](https://www.mpi-forum.org/docs/mpi-1.1/mpi1-report.pdf)

- **[A4-4] [severity: medium] line 54** — 인용: "TVM (OctoAI)" → 문제: 기업과 프로젝트를 일대일 대응한 목록이라 TVM을 OctoAI 소유 compiler처럼 보이게 합니다. TVM은 University of Washington 연구에서 시작한 Apache 오픈소스 프로젝트입니다. **확신도: high.** → 제안: "Apache TVM (Apache Software Foundation; University of Washington 연구에서 시작)"으로 교체합니다. [TVM 공식 연혁](https://tvm.apache.org/history)

- **[A4-5] [severity: high] line 92** — 인용: "GPGPU의 등장 (2007년)" → 문제: 2007년은 CUDA 등장 시점이며 GPGPU 자체는 그 이전부터 존재했습니다. 바로 아래 94줄의 "사용 범위를 크게 확대"라는 설명이 더 정확합니다. **확신도: high.** → 제안: 제목을 "CUDA의 등장과 GPGPU의 확산 (2007년)"으로 바꿉니다. [NVIDIA가 공개한 2005년 GPGPU 연구](https://research.nvidia.com/publication/2005-08_survey-general-purpose-computation-graphics-hardware)

- **[A4-6] [severity: high] line 131-134** — 인용: "매트릭스 곱셈의 연산량은 매트릭스 크기에 따라 N³에 비례하기 때문에" → 문제: N의 정의와 알고리즘 조건이 빠졌습니다. 일반적인 `(M,K) × (K,N)` 곱은 Θ(MKN)이며, 바로 다음의 Strassen은 정방행렬에서도 cubic 알고리즘이 아닙니다. **확신도: high.** → 제안: "일반적인 행렬곱 알고리즘은 `(M,K) × (K,N)`에 Θ(MKN) 연산이 필요합니다. 두 행렬이 `N × N`이면 Θ(N³)이며, Strassen 등은 다른 복잡도를 갖습니다." [BLAS의 연산량 분류](https://www.netlib.org/blas/blas.pdf)

- **[A4-7] [severity: medium] line 138-139** — 인용: "**CUTLASS** (2018, 오픈소스)" → 문제: NVIDIA는 CUTLASS를 2017년에 공개했으며, 2018년을 쓰려면 1.0 등 어떤 이정표인지 밝혀야 합니다. 또한 CUTLASS는 cuBLAS와 같은 BLAS API 구현이라기보다 고성능 선형대수 kernel을 만드는 CUDA C++ 구성요소 모음입니다. **확신도: high.** → 제안: "cuBLAS: BLAS 라이브러리 / CUTLASS: CUDA C++ kernel 구성요소, 2017년 공개"로 구분하고 51줄 연도도 맞춥니다. [NVIDIA CUTLASS 소개](https://developer.nvidia.com/blog/cutlass-linear-algebra-cuda/)

- **[A4-8] [severity: high] line 144-149** — 인용: "동적으로 표현된 model을 특정한 "정적" model로 고정하고" → 문제: compiler가 분석 가능한 graph를 얻는 것과 모든 shape·실행 흐름을 고정하는 것은 다릅니다. PyTorch compiler는 symbolic shape를 지원하고, graph break로 나뉜 구간을 eager 실행과 섞을 수도 있습니다. **확신도: high.** → 제안: "프로그램에서 분석 가능한 graph를 추출한 뒤 대상 하드웨어에 맞게 최적화합니다. shape가 변하는 graph도 지원할 수 있으며, 캡처하지 못한 구간은 eager로 실행될 수 있습니다"로 교체합니다. [Dynamic Shapes](https://docs.pytorch.org/docs/stable/user_guide/torch_compiler/torch.compiler_dynamic_shapes.html), [torch.compile API](https://docs.pytorch.org/docs/stable/generated/torch.compile)

- **[A4-9] [severity: high] line 212** — 인용: "pybind11을 통한 Python + C++11 결합이 대표적이며, NumPy와 PyTorch가 이 방식을 채택하고 있습니다." → 문제: 두 프로젝트가 native 구현을 Python에 노출한다는 취지는 맞지만, 모두 pybind11로 구현된 것처럼 묶는 것은 부정확합니다. NumPy 핵심은 Python/C API와 NumPy C API를 사용하며, PyTorch도 pybind11 외에 직접 작성하거나 생성한 Python/C API binding을 사용합니다. **확신도: high.** → 제안: "NumPy와 PyTorch는 native 구현을 Python binding으로 호출합니다. binding 구현에는 Python/C API와 pybind11 같은 도구가 사용됩니다"로 바꿉니다. [NumPy C API](https://numpy.org/doc/stable/user/c-info.html), [PyTorch의 Tensor Python binding 소스](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/csrc/autograd/python_variable.cpp)

- **[A4-10] [severity: medium] line 228** — 인용: "`torch.compile`의 ahead-of-time graph compilation" → 문제: 일반적인 `torch.compile` 경로는 실행 중 필요한 구간을 JIT 컴파일합니다. AOTAutograd의 backward 사전 캡처와 배포 전 AOT 컴파일은 구분해야 합니다. **확신도: high.** → 제안: "이 autograd graph는 `torch.compile`이 캡처해 최적화하는 실행 graph와 다릅니다. 학습 컴파일 경로에서는 AOTAutograd가 backward 계산도 미리 캡처합니다"로 바꿉니다. [torch.compile의 JIT 실행 설명](https://docs.pytorch.org/tutorials/intermediate/torch_compile_full_example.html), [compiler 구성](https://docs.pytorch.org/docs/stable/user_guide/torch_compiler/torch.compiler.html)

- **[A4-11] [severity: medium] line 235-239** — 인용: "**PyTorch, TF2, JAX의 접근법 (define-by-run)**" → 문제: eager 스타일로 작성한다는 공통점과 graph를 만드는 실제 실행 방식이 섞였습니다. `tf.function`·`jax.jit`으로 추출한 graph를 재사용하는 것을 PyTorch eager autograd의 매 실행마다 graph를 기록하는 방식과 동일시하면 안 됩니다. **확신도: high.** → 제안: 제목을 "Eager 스타일 코드에서 tracing으로 graph 추출"로 바꾸고, "작성 방식은 비슷하지만 graph 생성·재사용 방식은 API마다 다릅니다"를 덧붙입니다. 288줄의 define-by-run 단정도 함께 정리합니다. [TensorFlow tracing과 graph 재사용](https://www.tensorflow.org/guide/function), [JAX JIT 설명](https://docs.jax.dev/en/latest/jit-compilation.html)

- **[A4-12] [severity: high] line 313-320** — 인용: "Eager mode에서 graph를 추출하는 기법에는 오랜 역사가 있습니다:" → 문제: 뒤의 trace scheduling·CPU out-of-order execution·trace cache·V8은 같은 종류의 tensor graph 추출 기법이 아닙니다. 실행 정보나 의존성을 활용한다는 연관성만으로 TorchDynamo graph capture의 역사로 묶으면 소프트웨어 compiler와 CPU 실행 기구를 혼동하게 됩니다. **확신도: high.** → 제안: 제목을 "관련 배경: 명령어 스케줄링과 동적 언어 최적화"로 바꾸고 각 기술의 대상과 역할을 한 줄씩 구분하거나, graph capture에 직접 필요한 설명만 남깁니다. [Trace scheduling 구현 논문](https://shiftleft.com/mirrors/www.hpl.hp.com/techreports/93/HPL-93-35.pdf), [V8의 compiler 구조](https://v8.dev/blog/launching-ignition-and-turbofan)

- **[A4-13] [severity: high] line 328** — 인용: "올바른 트레이스를 만들어 롤백 없이 효율적인 성능을 제공하는 것이 핵심입니다." → 문제: trace scheduling은 compiler가 basic block의 경로를 골라 명령어를 함께 스케줄하는 정적 최적화이며, 경로 밖에서도 의미를 보존하기 위해 compensation code가 필요할 수 있습니다. 좋은 profile과 branch prediction으로 rollback을 없애는 기법이라는 설명은 실행 중 추측과 정적 재배치를 혼동합니다. **확신도: high.** → 제안: "Trace scheduling은 자주 실행될 것으로 예상되는 basic block 경로를 골라 명령어를 재배치합니다. profile 정보를 활용할 수 있으며, 다른 경로의 결과도 보존하도록 필요하면 compensation code를 추가합니다"로 교체합니다. [실제 trace scheduling compiler의 보상 코드 연구](https://shiftleft.com/mirrors/www.hpl.hp.com/techreports/93/HPL-93-35.pdf)

- **[A4-14] [severity: high] line 353** — 인용: "Graph mode(컴파일) 경로가 inference뿐 아니라 training까지 지원하게 된 것이 PyTorch 2.0에서 가장 크게 변화한 부분" → 문제: PyTorch 1.x의 TorchScript도 autograd와 학습을 지원했습니다. 2.0의 변화는 학습 지원의 최초 도입이 아니라 TorchDynamo·AOTAutograd·Inductor를 통한 새로운 컴파일 경로입니다. **확신도: high.** → 제안: "PyTorch 2.0은 `torch.compile`과 AOTAutograd·Inductor를 통해 forward와 backward를 최적화하는 새 경로를 도입했습니다"로 바꿉니다. [2019년 TorchScript forward/backward 최적화 사례](https://pytorch.org/blog/optimizing-cuda-rnn-with-torchscript/)

- **[A4-15] [severity: medium] line 359-363** — 인용: "| Graph mode (JIT & AOT) | As a backend to TorchDynamo |" → 문제: JIT/AOT는 컴파일 시점이고 codegen은 compiler 단계여서 세 행이 서로 다른 분류 기준을 사용합니다. AOT export 경로까지 모두 TorchDynamo backend 등록으로 연결되는 것처럼 읽힙니다. **확신도: high, 2.13의 구체적인 확장 API는 needs verification.** → 제안: "eager 연산 구현 등록 / `torch.compile` backend 연결 / Inductor codegen 확장 / `torch.export` 이후 AOT backend 연결"로 접점을 나누고, 지원 절차는 2.13 문서·소스에서 각각 확인합니다. AOTInductor의 export 입력 관계는 [공식 API 설명](https://docs.pytorch.org/docs/stable/user_guide/torch_compiler/export/api_reference.html)과 [AOTInductor 사용 예](https://docs.pytorch.org/tutorials/recipes/torch_export_aoti_python.html?highlight=backward)를 참고하되 후자는 현재 2.14 문서입니다.

- **[A4-16] [severity: high] line 379-381** — 인용: "**프로그래밍 모델**: CUDA는 PTX/SASS 기반, Triton은 Python 데코레이터 형태의 API 제공" → 문제: 한쪽은 저수준 명령 표현, 다른 쪽은 소스 문법을 비교했습니다. CUDA C++는 thread/block/grid 모델을 제공하고, NVIDIA용 Triton kernel도 PTX를 거쳐 GPU 기계어로 실행되므로 PTX/SASS는 양자를 가르는 기준이 아닙니다. **확신도: high.** → 제안: "CUDA C++는 thread별 연산과 thread block 협력을 명시합니다. Triton은 program instance가 처리할 데이터 블록 연산을 기술하고, compiler가 이를 thread와 메모리에 배치합니다"로 교체합니다. [CUDA에서 PTX의 위치](https://docs.nvidia.com/cuda/cuda-programming-guide/03-advanced/advanced-kernel-programming.html?hl=en-US), [Triton 공식 모델 비교](https://triton-lang.org/main/programming-guide/chapter-1/introduction.html)

- **[A4-17] [severity: medium] line 372** — 인용: "현재 TorchScript는 deprecated 상태이며, 새로운 export 용도에는 `torch.export` 사용이 권장됩니다." → 문제: 최신 기준으로 맞는 설명이지만 자료의 날짜는 2024-12-04이고 이 파일에는 갱신 기준이나 2.13 문서 링크가 없습니다. 당시 설명과 나중에 추가된 상태 정보를 독자가 구분하기 어렵습니다. **확신도: high.** → 제안: 이 문장 앞에 "문서 갱신 기준: PyTorch 2.13"을 명시하고 해당 버전의 deprecated 안내를 연결합니다. 최신 공식 자료에서 권고 자체는 확인되지만 2024년 당시 상태라고 표현해서는 안 됩니다. [PyTorch의 TorchScript 폐기·export 전환 안내](https://pytorch.org/blog/pytorch-2-12-release-blog/)

검증 메모: Python 코드 블록 4개는 모두 `ast.parse` 문법 검사를 통과했습니다. import가 준비된 각 표기 버전을 전제로 API 이름·인자 순서·shape를 대조했으며, TF1 행렬곱은 `(1, 2) × (2, 1) → (1, 1)`, 값은 `[[12]]`입니다. PyTorch 덧셈 결과는 `(2, 3)`, 양쪽 `foo` 예제 결과는 `(3, 4)`로 일관됩니다. 런타임에는 torch·tensorflow가 설치돼 있지 않아 실행 검증은 하지 않았습니다. TF1의 `tf.Session()` 예제는 TF1용이며 TF2에서 그대로 실행하는 예제가 아닙니다.

이 파일에는 DTensor/FSDP·CUDA stream·메모리 byte 수·대역폭/FLOP 수치·PyTorch 소스 call stack이 없습니다. vLLM의 PyTorch/custom operator 활용 설명은 공식 plugin 문서와 부합하지만 모든 plugin이 같은 구현을 쓴다는 보장으로 읽어서는 안 됩니다. [vLLM 공식 plugin 구조](https://docs.vllm.ai/en/stable/design/plugin_system/)

</details>
