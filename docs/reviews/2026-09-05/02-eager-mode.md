# Review: 02-eager-mode.mdx (2026-09-05)

리뷰어: Claude Fable 5.1 (서브에이전트) + OpenAI Codex `gpt-6-astra`.
대상: `src/content/lectures/02-eager-mode.mdx` (1628행). 읽기 전용 리뷰, 수정 없음.

## TL;DR

- **AI slop / 용어**: 대체로 깨끗함. "핵심/바로" 10회 이상, 40행 워밍업 문장, 107행 "무려 55단계", 음차("매트릭스", "프린트", "디바이스"), Konglish("scratch로", "concrete한", "Nesting된"). 용어 문제: "C++ frontend" 레이블이 PyTorch 공식 용어(libtorch C++ Frontend)와 충돌, "block command"는 표준 용어 아님. 두 리뷰어 일치.
- **이해도**: 구조는 좋으나 redispatch 설명이 4곳(144, 253, 334, 575)에 중복되고 타이밍 서술이 서로 모순. Event record/block 설명이 1134–1143과 1179–1204에서 거의 그대로 반복. 정의 없는 용어: kernel(dispatcher 등록 함수 vs GPU 커널), boxing/unboxing, intrusive_ptr, stride, XPU/SYCL, VirtualGuardImpl. 40행짜리 구버전 Autograd kernel 코드(513–557)가 896–938과 중복. 빌드 시스템 전환 일정(1334–1355) 20행은 강의 범위 밖. 두 리뷰어 일치.
- **다이어그램**: 공통 high 2건: (1) High-level 아키텍처 Mermaid(227–245)에 Autograd kernel 노드가 없고 Device Backend가 redispatch하는 것처럼 그림. (2) Event sequence(1119–1132)에 block/wait하는 두 번째 stream이 없고 "소멸" 단계는 사실과 다름. 공통 medium: DeviceGuard SVG(1215)가 device 중첩처럼 보이고 복원(3→2→1) 화살표 없음. Fable: slide13_1과 slide38_1 동일 그림 2회 사용. Codex: .so 의존 그림(1493)에 `torch_cuda → torch_cpu` 누락, 빌드 옵션 조건 없음.
- **정확성**: 대부분의 v2.13.0 소스 인용은 정확(Dispatcher.h:833, VariableType 10 shard, THPVariable_dealloc, README 빌드 요구사항). 두 리뷰어 공통 high/medium:
  1. 188/197행 `callWithDispatchKeySlowPath`를 "key 선택·kernel 탐색"으로 설명 → 실제는 RecordFunction/profiler callback 경로. key 선택은 #21에서 완료.
  2. 191/250/275행 "Front-End가 dispatch key set을 계산" → `Dispatcher::call` 내부에서 계산.
  3. 334/575행 "처리가 끝나면 다음 key로 redispatch" → 144행과 모순. 실행 도중 중첩 호출 후 `set_history`.
  4. 1188행 `recordOnce` 인과 반전(thread-safe 아니라서 여러 번 호출될 수 있음).
  5. 1314–1322행 Generator `clone` 시그니처 존재하지 않음. `at::Generator`와 `GeneratorImpl` API 혼합.
  6. 1414행 `DEBUG` → scikit-build 매핑은 2.13이 아님(setuptools). 1334행과 자체 모순.
  7. 831행 TensorIterator 정의 오류(view/storage helper 아님, elementwise broadcast/stride helper).
  8. 1043행 CPU device index "0이어야" → `-1 또는 0`.
  9. 125–126행 matmul 분기 표(N-D×2-D는 fold 후 `mm`).
- Fable만 잡은 high: 48행 "`gemm_internal`이 v2.13에서 추가" → v2.5.0에 이미 74회 등장(v2.2.0에는 0). 그리고 `gemm<float>`(#0) 내부 호출이라 스택에 안 보임.
- Codex만 잡은 high: 322행 `CompositeImplicitAutograd`는 alias key라 runtime key set에서 "선택"되지 않음. 672행 cuBLASLt 경로는 `cublasLtMatmul`(직전 코드가 `gemm_and_bias`). 728행 `clone`은 `empty_strided` 후 `copy_`. 736행 "clone 안 하면 대부분 view" → 산술 연산도 새 storage. 852–863행 표의 `x`가 2D인데 `permute(2,0,1)`/`flatten(1,2)`/`reshape(2,12)`는 차원 오류. 747–755행 refcount 0 = GPU 메모리 반환 아님(caching allocator). 1145행 "RBLN event 미지원" → v0.11.2 문서에 `torch.rbln.Event` 존재. 1185행 XPU record 설명(barrier 제출 후 event 반환, host 대기 아님). 605행 meta 함수 검증도 codegen이 만든다고 서술.

## 두 리뷰어가 일치한 항목 (우선 수정 후보)

| line | 문제 | 제안 |
|---|---|---|
| 40, 107-108 | 워밍업·"무려" | 삭제, "55개 프레임" |
| 118, 419 등 | "매트릭스", "디바이스" 음차 | 행렬, `device` |
| 125-126 | matmul 분기 표 | N-D×2-D: fold 후 `mm`; batch: broadcast 후 `bmm` |
| 142-146 | kernel 미정의, 9문장 단락 | kernel 정의 한 줄, 3–4단계 bullet |
| 144/253/334/575 | redispatch 4곳 중복+모순 | 144를 정본으로, "실행 도중 중첩 호출" 통일 |
| 188/197 | `callWithDispatchKeySlowPath` 역할 | RecordFunction/profiler callback 경로 |
| 191/250/275/455 | "Front-End가 key set 계산" | Dispatcher 내부 |
| 227-245 | Mermaid에 Autograd kernel 없음 | `FE → D → Autograd kernel ⇢ D → Device backend → runtime` |
| 249/441/455 | "C++ frontend" 레이블 | "op별 C++ 진입점(`at::_ops::*::call`)", libtorch C++ Frontend와 구분 |
| 513-557 vs 896-938 | 구버전 Autograd kernel 코드 중복 | 현재 버전 10–15행 하나만, 구버전은 접기 |
| 701-708 | intrusive_ptr·stride 무정의 | 한 줄 정의 + (2,3)→transpose stride 예 |
| 831-845 | TensorIterator 정의 오류 | elementwise broadcast/stride/type promotion helper |
| 848-865 | view 분류표 기준 어긋남(transpose/permute, reshape/flatten copy 가능) | 표 재구성, "가능하면 공유, 아니면 복사" |
| 1043 | CPU index "0이어야" | -1 또는 0 |
| 1134-1143 vs 1179-1204 | Event 설명 2회 | 하나 삭제 또는 상세는 접기 |
| 1119-1132 | Event Mermaid: block 없음, "소멸" | Stream 2 + `block`, "완료: query()=true" |
| 1140 | "block command" | "wait 명령(`cudaStreamWaitEvent`)" |
| 1188 | `recordOnce` 인과 반전 | "미기록 시에만 record. thread-safe 아님" |
| 1215-1220 | DeviceGuard SVG 중첩·복원 없음 | scope 라벨, restore 화살표 |
| 1312-1327 | Generator `clone` 시그니처 | `at::Generator` / `GeneratorImpl` 분리, 무인자 `clone()` |
| 1334-1355 | 빌드 전환 일정 20행 | 2줄 + 접기. 일정은 needs verification |
| 1414-1418 | `DEBUG`→scikit-build, `MAX_JOBS` alias | 2.13은 setup.py/`tools/setup_helpers/cmake.py`. 2.14+ 분리 |

## 한쪽만 제기한 항목 (검토 필요)

- **Fable A4-1 (high) line 48**: `gemm_internal` "v2.13에서 추가" → v2.3~2.5에 이미 존재. #0 아래라 스택에 안 보임.
- **Fable A4-5 line 1012-1023**: `getDispatchKeySetUnboxed` 인용이 구버전(2.13은 TLS 합산 후 `getBackendIndex`, `nonFallthroughKeysPerBackend_`).
- **Fable A4-15 line 978**: "새 key는 core 패치 필요" → `PrivateUse1~3` 예약 key로 out-of-tree 가능. NPU 청중에 중요.
- **Fable A4-17 line 418-428/583-599/652**: native_functions.yaml·Blas.cpp 인용이 구버전(SparseMPS, MTIA, `gemm_and_bias<scalar_t, res_scalar_t>`).
- **Fable A4-12 line 699/747**: `torch.tensor`(factory) → `torch.Tensor`.
- **Fable A4-16 line 332**: "Edward Z. Yang이 구현" → 블로그 저자. 구현은 Sebastian Messmer 등.
- **Fable A3-2 line 330/964**: slide13_1 = slide38_1 동일 그림.
- **Codex A4-1 (high) line 322**: `CompositeImplicitAutograd`는 alias key. runtime key set에서 선택 안 됨.
- **Codex A4-7 (high) line 672**: cuBLASLt 경로 = `cublasLtMatmul`.
- **Codex A4-9/10 (high) line 728/736**: `clone` = `empty_strided` + `copy_`. "clone 안 하면 view"는 틀림.
- **Codex A4-12 (high) line 747-755**: refcount 0 ≠ GPU 메모리 반환(caching allocator).
- **Codex A4-13 (high) line 852-863**: 2D `x`에 `permute(2,0,1)` 등 차원 오류. 3D 예제 별도 정의.
- **Codex A4-18 (high) line 1145**: RBLN v0.11.2에 `torch.rbln.Event` 있음. 당시 SDK 버전 명시하거나 삭제.
- **Codex A4-17 line 1185**: XPU `record` = barrier 제출 후 event 반환. host 대기 아님.
- **Codex A4-6 line 605**: `TORCH_META_FUNC(mm)` 검증은 사람이 작성. codegen은 연결 wrapper.
- **Codex A4-8 line 708**: `requires_grad=False`면 AutogradMeta "항상 null" 아님.
- **Codex A3-10 line 1493-1517**: .so 그림에 `torch_cuda → torch_cpu` 누락, `USE_CUDA`/`USE_XPU` 조건 없음.
- **Codex A4-21 line 48**: 스택 캡처 환경(commit, 입력, 빌드 옵션) 미기록. Python 3.13.0 경로인데 "3.12 이상"이라 표기(Fable A4-21도 동일).

## 원문 리뷰

<details><summary>Fable 5.1 전문</summary>

# Review: `src/content/lectures/02-eager-mode.mdx` (PyTorch Eager Mode)

검증 방법: 본문 전체(1628행)와 이미지 4장·SVG 1장·Mermaid 6개를 읽고, 기술 주장은 PyTorch **v2.13.0 태그의 실제 소스**(Dispatcher.h, DispatchKeyExtractor.h, Event.h, InlineEvent.h, Generator.h, GeneratorImpl.h, Blas.cpp, CUDABlas.cpp(+v2.2.0/v2.5.0), native_functions.yaml, python_variable.cpp, README.md, pyproject.toml, setup.py, EnvVarForwarding.cmake, .spin/cmds.py 등)를 내려받아 대조했습니다.

## TL;DR

- **Axis 1 (AI slop/용어)**: 대체로 깨끗함. "핵심/바로" 상투구가 10회 이상 반복되고, "매트릭스·프린트" 같은 음차와 PyTorch 공식 용어(C++ Frontend = libtorch API)와 충돌하는 "C++ frontend" 레이블이 문제.
- **Axis 2 (이해도/장황함)**: 구조는 좋으나 redispatch 설명이 4곳에 중복되고(타이밍 서술도 서로 모순), Event record/block 설명이 두 번 거의 그대로 반복됨. boxing/unboxing, intrusive_ptr, XPU/SYCL, VirtualGuardImpl이 정의 없이 등장.
- **Axis 3 (다이어그램)**: High-level 아키텍처 Mermaid가 본문과 불일치(Autograd kernel 노드 없음, backend kernel이 redispatch하는 것처럼 그림). Event 다이어그램은 record만 있고 "소멸" 단계는 본문에 없음. DeviceGuard SVG는 scope 중첩을 device 중첩처럼 그림. 같은 이미지가 두 번 사용됨.
- **Axis 4 (기술 정확성)**: 대부분의 소스 인용(Dispatcher.h:833, 10-shard VariableType, THPVariable_dealloc, README 빌드 요구사항 등)은 v2.13.0과 일치. 틀린 것: `gemm_internal` 레이어가 "v2.13에서 추가"(실제 v2.3~2.5에 이미 존재, 그리고 #0 아래라 스택에 안 보임), `callWithDispatchKeySlowPath`의 역할, "Front-End가 key set을 계산", `recordOnce` 인과 반전, Generator `clone` 시그니처, `DEBUG`의 scikit-build 매핑(2.13은 setuptools), `getDispatchKeySetUnboxed` 인용이 구버전.
- **가장 중요한 수정 3개**: (1) line 48 `gemm_internal` 버전 주장 삭제/수정 + line 334·575의 "처리 후 redispatch"를 line 144와 일치시키기, (2) line 227 High-level Mermaid에 Autograd kernel 노드 추가, (3) Event 절 중복(1134–1143 vs 1179–1204) 제거와 Event 다이어그램에 block 추가.

---

## Axis 1 — AI slop 및 용어

- **[A1-1] [severity: medium] line 249, 441, 455** — 인용: "call stack 표에서 "C++ frontend"로 표시된 부분" → 문제: PyTorch에서 "C++ Frontend"는 libtorch의 `torch::nn`/`torch::optim` API를 가리키는 공식 명칭(docs "The C++ Frontend")이라 `at::_ops::matmul::call`에 이 이름을 붙이면 혼동됨. 표준 용어는 없고, codegen 쪽에서는 "ATen C++ API / `at::_ops` entry (Operators.cpp)"로 부름 → 제안: "op별 C++ 진입점(`at::_ops::*::call`)"으로 통일하고, 첫 등장(line 191)에 "libtorch의 'C++ Frontend'와는 다른 뜻"이라고 한 줄 주석.
- **[A1-2] [severity: low] line 253, 334, 705, 720, 826, 978, 988** — 인용: "이것이 바로 dispatch key set의 개념이며" / "이것이 view의 핵심" / "PyTorch에서 확장성의 핵심은" → 문제: "핵심/바로" 강조 상투구가 본문 전체에서 10회 이상 반복되어 강조 효과가 사라짐 → 제안: 강조 없이 평서문으로. 예: line 334 "여러 key가 동시에 유효할 수 있고, 이 집합이 dispatch key set입니다."; line 705 "view는 이 공유를 이용합니다."
- **[A1-3] [severity: low] line 118, 468** — 인용: "단순히 2D 매트릭스를 곱하는 것이라면" / "2D 매트릭스 곱셈 연산을 dispatch하게 됩니다" → 문제: line 176 등에서는 "행렬곱"을 쓰는데 여기만 음차 "매트릭스" → 제안: "2D 행렬"로 통일.
- **[A1-4] [severity: low] line 40** — 인용: "텐서를 만들어 연산을 수행하면 결과가 나오고, 이를 프린트해 볼 수 있습니다" → 문제: 독자가 이미 아는 내용의 워밍업 문장 + 음차 "프린트" → 제안: 문장 삭제. "무슨 일이 벌어지는지 파악하는 가장 직접적인 방법은 call stack을 보는 것입니다."로 바로 진입.
- **[A1-5] [severity: low] line 164** — 인용: "automated differentiation도 이 코드 생성으로 구현됩니다" → 문제: 표준 용어는 "automatic differentiation" → 제안: "automatic differentiation(autograd)도".
- **[A1-6] [severity: low] line 303** — 인용: "PyTorch internal의 가장 핵심적인 패턴을 형성하는 역할을 하며, ATen을 위한 기술(description)이라고 볼 수 있습니다" → 문제: 내용 없는 필러 문장, "기술(description)"은 어색한 번역투 → 제안: 문장 삭제(앞 문장 "ATen op 정의 및 등록의 기반이 됩니다"로 충분).
- **[A1-7] [severity: low] line 457** — 인용: "여기서 주목할 점은 #27의 `RegisterCompositeImplicitAutograd`입니다." → 문제: 서스펜스용 워밍업 문장; 바로 다음 헤딩이 같은 내용 → 제안: 삭제하고 헤딩을 "#27 `RegisterCompositeImplicitAutograd`: CompositeImplicitAutograd란?"으로.
- **[A1-8] [severity: low] line 714, 1042, 1212** — 인용: "생성 - scratch로 새로 만드는 경우" / "특정한 concrete한 디바이스" / "Nesting된 형태로 사용 가능" → 문제: 영어 단어를 조사만 붙여 쓴 Konglish → 제안: "새로 할당하는 경우", "특정 device", "중첩 사용 가능".
- **[A1-9] [severity: low] line 1140** — 인용: "Record command가 처리될 때까지 대기하라는 **block command**를 stream에 삽입" → 문제: "block command"는 CUDA/SYCL 어느 쪽 표준 용어도 아님(CUDA는 `cudaStreamWaitEvent`, "stream wait"). c10 API 이름이 `block`이라 쓴 것은 이해되나 표준 용어 없음 → 제안: "wait 명령(`cudaStreamWaitEvent`에 해당)을 stream에 삽입"처럼 설명형으로.

## Axis 2 — 이해도 / ELI5 균형 / 장황함

- **[A2-1] [severity: high] line 144** — 인용: "redispatch는 kernel 실행이 끝난 뒤가 아니라 실행 도중에 일어나는 중첩 호출이라는 점이 중요합니다" → 문제: 9문장짜리 단일 문단에 key set 구성·우선순위 선택·redispatch·중첩·스택 깊이가 모두 들어 있어 초심자가 따라가기 어려움 → 제안: 3개 불릿으로 분할: (1) "입력 tensor의 key + thread-local key를 합쳐 dispatch key set을 만든다", (2) "dispatcher는 가장 우선순위 높은 key의 kernel을 부른다", (3) "그 kernel은 실행 도중 자기 key를 뺀 set으로 다시 dispatcher를 부른다(redispatch). 이 중첩이 스택 깊이가 된다."
- **[A2-2] [severity: medium] line 144, 253-258, 334, 575** — 인용: "핵심은 kernel이 실행 도중에 다시 Dispatcher를 호출하여 redispatch한다는 점입니다" → 문제: redispatch가 4곳에서 각각 다른 문장으로 다시 설명되고, 334·575는 144와 타이밍이 모순(A4-2 참조) → 제안: 144(또는 253)를 정본으로 두고 나머지는 "redispatch(앞 절 참조)" 한 줄로.
- **[A2-3] [severity: medium] line 57-60, 976** — 인용: "calling convention의 일부로 **boxing/unboxing 지원**" → 문제: call stack 심볼(`callUnboxedKernelFunction`, `boxing/*.h`)과 vtable 비교표에 boxing/unboxing이 나오지만 정의가 없음 → 제안: line 180(#6-9 설명) 또는 310에 한 줄 추가: "unboxed = C++ 타입 인자를 그대로 받는 호출, boxed = 인자를 `IValue` 스택으로 받는 범용 호출. 대부분의 kernel은 unboxed로 등록되고 boxing wrapper가 둘을 변환".
- **[A2-4] [severity: medium] line 701** — 인용: "`c10::TensorImpl`을 `intrusive_ptr`로 가리키는 얇은 wrapper" → 문제: `intrusive_ptr`가 정의 없이 등장, 이후 view/refcount 설명(720, 754)이 전부 여기에 의존 → 제안: 한 줄 정의: "`intrusive_ptr`: refcount를 별도 control block이 아니라 객체 자신(`intrusive_ptr_target`) 안에 두는 PyTorch식 `shared_ptr`".
- **[A2-5] [severity: medium] line 1048-1055, 1088** — 인용: "Unique한 `c10::Device`는 `gDevicePool`에 들어있는 `sycl::device`와 1:1 관계 (XPU 예시)" → 문제: Runtime 절의 첫 코드 예제가 XPU/SYCL인데 XPU·SYCL·`sycl::queue`가 무엇인지 설명이 없음. CUDA만 아는 독자는 대응 관계를 모름 → 제안: Runtime 절 도입(1028)에 "XPU = Intel GPU backend, SYCL = 그 프로그래밍 모델. `sycl::queue` ≈ CUDA stream, `sycl::event` ≈ CUDA event"를 표로 한 번 제시.
- **[A2-6] [severity: high] line 1134-1143, 1179-1204** — 인용: "Stream과 event의 device type은 같아야 하지만 device index는 다를 수 있음" (1142와 1192에 동일) → 문제: `record`/`block` 설명이 1134–1143과 1182–1196에서 거의 같은 문장으로 두 번 나옴(deadlock 문장 1143·1193도 동일). 슬라이드 분량이 두 배 → 제안: 1134–1143을 삭제하고 "API 상세"만 남기거나, 상세 절을 `<details>`로 접기.
- **[A2-7] [severity: low] line 1094, 1105** — 인용: "`c10::Stream::query()` → `c10::impl::VirtualGuardImpl::queryStream`" → 문제: `VirtualGuardImpl`이 1258에서야 설명되는데 1094부터 call chain에 등장 → 제안: 1094 주석을 "VirtualGuardImpl: device type으로 등록된 DeviceGuardImplInterface 구현체(CUDAGuardImpl 등)를 찾아 호출하는 wrapper"로.
- **[A2-8] [severity: low] line 1145** — 인용: "RBLN: 아직 event 미지원" → 문제: RBLN 약어 정의 없음 → 제안: "Rebellions NPU(RBLN) backend: 아직 event 미지원(2024-12 기준)" 또는 삭제.
- **[A2-9] [severity: medium] line 1334-1355** — 인용: "제거 일정 (2.14 이후):" → 문제: Eager mode 강의에서 빌드 시스템 전환 일정(2.14–2.18 표, spin 설명)이 20행. 독자 결정에 영향 없는 미래 정보 → 제안: "2.13은 setuptools + setup.py, 2.14부터 PEP 517/scikit-build-core 전환 예정(#152276)" 2줄 + 대체 명령 표만 남기고 나머지는 `<details>`.
- **[A2-10] [severity: low] line 343** — 인용: "Call stack이 55단계나 되니 매우 복잡한 구조처럼 보이지만, 상당수는 자동 생성된 wrapper와 반복되는 dispatcher logic입니다" → 문제: 107-108, 114, 265에서 이미 세 번 말한 내용 → 제안: 앞 절 삭제, "개발자가 직접 작성하는 부분은 ...(#25-26)과 ...(#0-4)입니다."로 시작.
- **[A2-11] [severity: low] line 848, 857, 865** — 인용: "**차원의 변경**: 원소의 개수(각 차원 크기의 곱)는 같지만 각 차원의 크기가 다른 경우" → 문제: 같은 표에 든 `transpose`/`permute`는 차원 크기가 달라지지 않고 순서만 바뀜; `reshape`는 "축소"가 아니고 `flatten`도 copy가 날 수 있어 세 분류가 분류 기준과 어긋남 → 제안: 표 하나로 합치고 열을 "shape 변경 / 차원 순서 변경 / 차원 추가·제거 / broadcast"로, 각주로 "`reshape`·`flatten`·`contiguous`는 view 불가 시 copy".
- **[A2-12] [severity: low] line 1482-1489** — 인용: "**`_dynamo`** `_export` `_functorch`" → 문제: 일부 모듈만 굵게 표시했는데 기준 설명이 없음 → 제안: "굵게: 이 강의 시리즈에서 다루는 모듈" 범례 추가 또는 굵기 제거.
- **[A2-13] [severity: low] line 253** — 인용: "이 dispatch → kernel → redispatch의 중첩이 call stack의 depth가 깊어지는 이유입니다." → 문제: 이 덱에서 유일하게 비유가 도움이 될 자리(중첩 호출)에 비유가 없음 → 제안: 한 줄: "web framework의 middleware chain과 같습니다. 각 layer(autograd, backend)가 자기 일을 한 뒤 `next()`를 부르고, 안쪽이 반환하면 마무리 작업을 합니다."

## Axis 3 — 다이어그램

- **[A3-1] [severity: high] line 227-245** — 인용: "DB1 -. redispatch .-> D" → 문제: 본문(255-258)은 *Autograd kernel*이 redispatch해서 device backend kernel로 간다고 하는데, 그림에는 Autograd/kernel 노드가 없고 "Device Backend"가 Dispatcher로 redispatch하는 것으로 그려짐(CUDA mm kernel은 redispatch하지 않음). DB2/DR2는 라벨 없는 중복 노드 → 제안: `FE --> D; D -- "dispatch (Autograd key)" --> AK[Autograd kernel]; AK -. "redispatch (CUDA key)" .-> D; D -- dispatch --> DB[Device backend kernel]; DB --> DR[Device runtime]`. 5노드로 본문 순서와 일치.
- **[A3-2] [severity: low] line 330, 964** — 인용: `<img src="/images/02/slide13_1.png"` / `<img src="/images/02/slide38_1.png"` → 문제: 두 파일은 동일한 그림("Dispatcher: reimplemented vtables")이라 같은 슬라이드가 두 번 나옴 → 제안: 964(vtable 비교표 직전)에만 두고 330에서는 제거하거나 다른 그림 사용.
- **[A3-3] [severity: low] line 687-695** — 인용: `T["at::Tensor"] --> TI["c10::TensorImpl"]` → 문제: 본문(701)은 `at::Tensor → TensorImpl`도 `intrusive_ptr`라고 하는데 그림은 `Storage → StorageImpl` 간선에만 `intrusive_ptr` 라벨 → 제안: `T -->|intrusive_ptr| TI`. 나머지는 적절.
- **[A3-4] fine line 949** — Registration API 그림(def/impl/fallback)이 본문 세 항목과 정확히 대응.
- **[A3-5] [severity: low] line 984** — 인용: `alt="Dispatch key set의 union과 우선순위 선택 과정 다이어그램 (Autograd 위치는 2020년 기준)"` → 문제: 그림의 Global set에 `BackendSelect`가 있으나 본문 어디에도 설명이 없음 → 제안: 996 표의 Global 행에 "`BackendSelect`: `torch.empty`처럼 tensor 입력이 없는 factory op의 backend를 고르는 key" 추가.
- **[A3-6] fine line 1067-1086** — Stream 그림: host가 device별 stream pool의 FIFO에 command를 넣는 구조가 본문(1063-1065)과 일치. 읽기 쉬움.
- **[A3-7] [severity: medium] line 1119-1132** — 인용: "Note over E: 소멸" → 문제: 본문(1117)은 Event의 용도를 "stream 간 dependence 제어"라고 하는데 그림은 record만 보여주고 block/wait이 없음. 마지막 "소멸" 단계는 본문에 없고 사실과도 다름(record 처리 후 event가 소멸되지 않음) → 제안: `participant S2 as Stream 2` 추가, `H->>S2: event.block(S2)`, `Note over S2: record 완료까지 대기` 두 줄 추가, "소멸" 삭제.
- **[A3-8] [severity: medium] line 1215-1220** — 인용: `alt="DeviceGuard nested diagram"` → 문제: SVG가 `device1 ⊃ device2 ⊃ device3` 상자를 중첩해 그려 device가 서로 안에 들어있는 것처럼 보임. 중첩되는 것은 guard의 *scope*(current device 1→2→3)이지 device가 아님. 또 화살표가 오른쪽으로 빠져나가기만 하고 RAII의 요점인 복원(3→2→1)이 없음 → 제안: 상자 라벨을 "scope: current device = 1/2/3"으로, 출구에 "restore → 2 → 1" 화살표 추가.
- **[A3-9] fine line 1493-1514** — .so 의존 그림: 본문과 일치. (nit: `libtorch_cuda.so → libtorch_cpu.so` 링크가 생략됐으나 단순화로 허용.)
- **[A3-10] fine line 1542-1570** — 소스 트리 그림: flowchart로 그려 mindmap 미사용, 노드 14개로 읽기 가능.

## Axis 4 — 기술 정확성

- **[A4-1] [severity: high] line 48** — 인용: "v2.13에서는 cuBLAS 호출 직전에 TunableOp 체크와 backend 선택(cuBLAS/cuBLASLt) 레이어가 추가되어, `gemm<float>` → `gemm_internal<float>` → `gemm_internal_cublas<float>` 순으로 스택이 1~2단 더 깊어집니다" → 문제: (a) `gemm_internal*`은 v2.5.0 `CUDABlas.cpp`에 이미 74회 등장(v2.2.0에는 0회) — TunableOp와 함께 v2.3 무렵 추가된 것이지 2.13의 변화가 아님. snapshot(Python 3.13.0 → 2024-12, ~v2.5)에도 이미 있었음. (b) 이 함수들은 `gemm<float>`(#0) *안에서* 호출되므로 #0에 breakpoint를 건 이상 어느 버전에서도 이 스택에는 나타나지 않음. 신뢰도: high (v2.13.0 CUDABlas.cpp:1585→1391→1133 확인) → 제안: "`gemm<float>` 내부는 v2.3부터 TunableOp/cuBLASLt 선택을 거쳐 `gemm_internal<float>` → `gemm_internal_cublas<float>` → `cublasSgemm`으로 이어집니다. breakpoint를 `cublasSgemm`에 걸면 #0 아래로 2~3단이 더 보입니다."
- **[A4-2] [severity: medium] line 181, 334, 575** — 인용: "처리가 끝나면 다음 key로 redispatch하는 과정을 반복합니다" / "Autograd kernel이 실행된 후, 다음 dispatch key로 재전달" → 문제: line 144의 "실행 도중 중첩 호출"과 모순. 실제로는 `VariableType::mm`이 본체 안에서 `at::redispatch::mm(ks & after_autograd_keyset, ...)`를 호출하고 반환 후 `set_history`를 함(899-936 생성 코드가 그 증거). 신뢰도: high → 제안: "Autograd kernel이 grad_fn을 준비한 뒤 *실행 도중* 자기 key를 뺀 set으로 redispatch하고, 반환값에 history를 기록".
- **[A4-3] [severity: medium] line 188, 197** — 인용: "`c10::Dispatcher::callWithDispatchKeySlowPath` ... dispatch key set에서 최우선 key를 선택하여 해당 kernel 탐색" → 문제: v2.13.0 Dispatcher.h:774-796에서 key set 계산과 `op.lookup(dispatchKeySet)`은 `Dispatcher::call` 안에서 끝나고, `callWithDispatchKeySlowPath`(708행)는 `at::getStepCallbacksUnlessEmpty(FUNCTION)`이 비어있지 않고 op이 observed일 때만 타는 경로로, kernel 호출을 `at::RecordFunction` guard로 감싸는 profiler hook임. snapshot에 이 프레임이 있다는 것은 캡처 환경에 RecordFunction callback(프로파일러 등)이 등록돼 있었다는 뜻. 신뢰도: high → 제안: 역할을 "profiler/RecordFunction callback이 있을 때의 경로 - kernel 호출을 RecordFunction guard로 감쌈(key 선택은 #21에서 이미 완료)"으로.
- **[A4-4] [severity: medium] line 191, 250, 275** — 인용: "Front-End의 역할은 여기까지입니다: Python 인자를 C++ 타입으로 변환하고, dispatch key set을 계산해서 op을 **Dispatcher**에게 전달합니다" → 문제: `at::_ops::mm::call`은 typed handle을 만들어 `Dispatcher::singleton().call(handle, args)`를 부를 뿐이고, key set은 `Dispatcher::call` 내부에서 `dispatchKeyExtractor().getDispatchKeySetUnboxed(args...)`로 계산됨(Dispatcher.h:777-779). 신뢰도: high → 제안: "인자를 C++ 타입으로 변환해 op handle과 함께 `Dispatcher::call`에 넘깁니다. key set 계산은 Dispatcher 안에서 일어납니다." (191, 275의 "dispatch key set 계산 후"도 삭제)
- **[A4-5] [severity: medium] line 1012-1023** — 인용: "if (requiresBitsetPerBackend_) {\n    auto backend_idx = ks.getBackendIndex();" → 문제: 구버전 인용. v2.13.0 DispatchKeyExtractor.h:186-198은 `c10::impl::LocalDispatchKeySet tls = c10::impl::tls_local_dispatch_key_set(); auto backend_idx = ((ks | tls.included_) - tls.excluded_).getBackendIndex();`이고 멤버 이름도 `nonFallthroughKeysPerBackend_`(소문자 t). 또 본문 988의 "local include/exclude와 union"이 코드 어디서 일어나는지(`computeDispatchKeySet` 내부) 설명이 빠짐. 신뢰도: high → 제안: v2.13.0 코드로 교체하고 "2단계: TLS include/exclude set을 합치고 fallthrough key를 제외한 최종 set 계산(`computeDispatchKeySet`)"으로 소제목 수정.
- **[A4-6] [severity: medium] line 1188** — 인용: "`recordOnce(stream)`: Event는 thread-safe하지 않아서 record가 한 번만 호출되도록 보장" → 문제: 인과가 반대. Event.h:80-84: "Calls record() if and only if record() has never been called for this event. Note: because Event is not thread-safe recordOnce() may call record() multiple times if called from multiple threads." 신뢰도: high → 제안: "record가 아직 호출되지 않았을 때만 record. 단 Event가 thread-safe하지 않으므로 여러 thread에서 동시에 부르면 두 번 record될 수 있음."
- **[A4-7] [severity: medium] line 1094, 1100, 1169, 1177** — 인용: "Device specific 구현체와의 연결은 DeviceGuard를 통해 이루어짐" / "결국 DeviceGuard에 의존합니다" → 문제: 연결 고리는 `c10::impl::DeviceGuardImplInterface`(device type별로 registry에 등록된 `CUDAGuardImpl`/`XPUGuardImpl`)이고 `VirtualGuardImpl`은 그것을 type으로 찾아 위임하는 wrapper. RAII 객체인 `DeviceGuard`는 이 interface의 *사용자*이지 의존 대상이 아님. 신뢰도: high (VirtualGuardImpl.h, DeviceGuardImplInterface.h) → 제안: "device type별로 등록된 `DeviceGuardImplInterface` 구현체를 통해" / "`T backend_`(VirtualGuardImpl) → DeviceGuardImplInterface에 위임".
- **[A4-8] [severity: medium] line 1314-1322** — 인용: "`c10::intrusive_ptr<c10::GeneratorImpl> clone(const c10::intrusive_ptr<c10::GeneratorImpl>& generator_state) const`" → 문제: 존재하지 않는 시그니처. v2.13.0 Generator.h:133 `Generator clone() const { return Generator(impl_->clone()); }`, GeneratorImpl은 `clone()` + pure virtual `clone_impl()`. 또 목록이 `GeneratorImpl`의 `set_state(const c10::TensorImpl&)`(GeneratorImpl.h:75-76)와 `Generator`의 `getIntrusivePtr()`(Generator.h:85)를 섞어 놓음(`at::Generator::set_state`는 `const at::Tensor&`). 신뢰도: high → 제안: "`c10::GeneratorImpl` pure virtual" 목록과 "`at::Generator` wrapper(`clone()`, `getIntrusivePtr()`, `set_state(const Tensor&)`, `get_state() -> Tensor`)"로 분리.
- **[A4-9] [severity: medium] line 1414** — 인용: "`pyproject.toml`의 scikit-build override로 CMake build type에 매핑" → 문제: 같은 문서 1334에서 "2.13까지는 setuptools.build_meta"라고 했고, v2.13.0 pyproject.toml:15는 실제로 `build-backend = "setuptools.build_meta"`이며 scikit-build 항목이 없음. `DEBUG`는 setup.py가 처리(setup.py 헤더 4-5행). 신뢰도: high → 제안: "setup.py가 `CMAKE_BUILD_TYPE=Debug`로 매핑(2.14+에서는 pyproject의 scikit-build override 예정)".
- **[A4-10] [severity: low] line 1418** — 인용: "`MAX_JOBS` ... (`CMAKE_BUILD_PARALLEL_LEVEL`로 alias)" → 문제: v2.13.0 `cmake/EnvVarForwarding.cmake`에 MAX_JOBS alias가 없고 setup.py:355-361이 직접 읽음. alias는 2.14 계획일 수 있음 → 제안: "needs verification": "(2.14+ 예정)"으로 표기하거나 괄호 삭제.
- **[A4-11] [severity: low] line 1336-1342, 1353** — 인용: "| 2.18 | `setup.py` 파일 자체가 제거됨 |" → 문제: #152276 이슈 제목("`setup.py develop` command is disappearing soon from `setuptools`")은 확인했으나 2.14–2.18 버전별 일정과 "spin이 `pip install --group dev`로 설치 예정"은 이슈 본문에서 확인하지 못함 → 제안: "needs verification" — 일정을 명시한 PR/RFC 링크를 달고 "예정"임을 표에 명시. (참고: 2.13의 spin 명령이 clean/lint/regenerate/pyrefly뿐이라는 1353의 서술은 `.spin/cmds.py`·pyproject `[tool.spin.commands]`로 확인됨.)
- **[A4-12] [severity: low] line 699, 747** — 인용: "Python의 `torch.tensor`는 내부적으로 `at::Tensor`라는 C++ 객체에 대응되며" / "Python에서 `torch.tensor`가 제거되는 시점에 소멸" → 문제: `torch.tensor`는 factory 함수. 객체의 클래스는 `torch.Tensor`(C++ `THPVariable`, `torch._C.TensorBase`) → 제안: `torch.Tensor`로 수정.
- **[A4-13] [severity: medium] line 831** — 인용: "**TensorIterator**는 View와 분리된 storage를 접근하기 위한 helper입니다" → 문제: TensorIterator의 정의가 아님. 실제 역할은 elementwise/reduction kernel을 위해 broadcast된 출력 shape·type promotion을 계산하고 차원/stride를 coalesce해서, kernel이 non-contiguous·broadcast된 입력의 stride를 직접 다루지 않게 하는 것. 신뢰도: high → 제안: "TensorIterator는 elementwise op용 helper로, broadcast·type promotion·stride 처리를 대신해 kernel은 원소 단위 lambda만 쓰면 되게 합니다(아래 `my_add_cuda`)."
- **[A4-14] [severity: low] line 140** — 인용: "| **Tracing** | `torch.jit.trace` / `torch.compile` 중 vs 아님 |" → 문제: `torch.jit.trace`는 `Tracer` dispatch key를 쓰지만 `torch.compile`(Dynamo)은 bytecode 수준에서 동작하고 AOTAutograd tracing은 FakeTensor/`Python`/`Functionalize` key 경로라 "Tracing key"와 같은 축이 아님. 신뢰도: medium → 제안: "`torch.jit.trace`(Tracer key), functionalization(Functionalize key) 등".
- **[A4-15] [severity: low] line 978** — 인용: "새 dispatch key를 추가하려면 PyTorch core에 패치를 제출해야 합니다" → 문제: out-of-tree backend는 예약된 `PrivateUse1` key(`torch.utils.rename_privateuse1_backend`)로 core 패치 없이 등록 가능 — NPU 청중에게 중요한 예외 → 제안: 문장 끝에 "(단, out-of-tree backend용으로 `PrivateUse1~3` key가 예약되어 있음)" 추가.
- **[A4-16] [severity: low] line 332** — 인용: "Edward Z. Yang(Meta)이 구현한 Dispatcher는" → 문제: c10 dispatcher는 Sebastian Messmer 등 여러 core dev가 구현했고 ezyang은 설명 블로그의 저자. 신뢰도: medium → 제안: "Edward Z. Yang의 블로그 글로 잘 알려진 Dispatcher는".
- **[A4-17] [severity: low] line 418-428, 583-599, 652** — 인용: "SparseCPU, SparseCUDA: _sparse_mm" / "at::cuda::blas::gemm_and_bias<scalar_t>(" → 문제: 2.13 pinning을 표방하지만 인용이 구버전: v2.13.0 native_functions.yaml:4079-4096은 `SparseCPU, SparseCUDA, SparseMPS: _sparse_mm`, `mm.out`에 `MTIA: mm_out_mtia` 포함; `add.Tensor`(536-546)는 `SparseMPS`, `NestedTensorHPU`, `device_check: NoCheck   # TensorIterator` 포함; Blas.cpp:296은 `gemm_and_bias<scalar_t, res_scalar_t>` → 제안: v2.13.0 원문을 그대로 붙여넣고 강조 화살표만 유지.
- **[A4-18] [severity: low] line 1043** — 인용: "Device type이 CPU면 device index는 zero여야 함 (host에 해당)" → 문제: Device.h:181-184 `"CPU device index must be -1 or zero"` → 제안: "-1 또는 0이어야 함".
- **[A4-19] [severity: low] line 1284-1290** — 인용: "| **Stream 동기화** | `queryStream`, `synchronizeStream` |" → 문제: v2.13.0 VirtualGuardImpl.h에는 `synchronizeEvent`, `synchronizeDevice`, `isStreamCapturing`, `getStreamNativeHandle`, `getDeviceCapability`, `elapsedTime`도 있고, 본문 1202가 `synchronizeEvent`를 실제로 사용함 → 제안: Event 행에 `synchronizeEvent`, 기타 행에 `synchronizeDevice`, `elapsedTime` 추가.
- **[A4-20] [severity: low] line 125-126** — 인용: "| 3D 이상 (batch) | `torch.bmm` |" → 문제: `_matmul_impl`(LinearAlgebra.cpp:1995)은 N-D × 2-D를 batch 차원을 접어 `mm`으로 처리하고(folding), 1-D × 2-D도 unsqueeze 후 `mm`; "차원 불일치 시 → broadcast" 행은 모호 → 제안: "N-D × 2-D: batch 차원을 접어 `mm` / 그 외 batch: broadcast 후 `bmm`".
- **[A4-21] [severity: low] line 48, 90** — 인용: "(Python 3.12 이상 환경)" → 문제: 스택 자체가 `python-3.13.0` 경로를 보여줌 → 제안: "Python 3.13.0 conda 빌드 환경".
- **[A4-22] [severity: low] line 1595, 1597** — 인용: "aten이 상속받아 구현" / "`DispatchKeyset`" → 문제: ATen은 c10을 상속하지 않고 사용함; 타입 이름은 `DispatchKeySet` → 제안: "aten이 이 위에 구현됨", `DispatchKeySet`.
- **[A4-23] [severity: low] line 508** — 인용: "Forward 함수 실행 전후에 sanity check 수행" → 문제: 인용된 생성 코드(527-549, 913-930)가 보여주듯 `#ifndef NDEBUG`에서만 수행 → 제안: "(debug 빌드에서만) storage/impl 불변 검사 수행".

### v2.13.0 소스와 대조해 맞음을 확인한 항목 (수정 불필요)

`Dispatcher.h` redispatch 833행(line 48) / VariableType 10 shard(`gen_variable_type.py:940 num_shards=10`, line 894) / `THPVariable_dealloc`이 현재 tp_dealloc(python_variable.cpp:3627, line 751) / README: Python 3.10+, C++20, gcc 11.3.0+, 10 GB, 30–60분, `pip install --group dev`, `install_magma_conda.sh 12.4`(line 1369-1394) / `cmake/EnvVarForwarding.cmake` 존재와 BUILD_/USE_/CMAKE_ 규칙(line 1400-1405) / `TORCH_IMPL_FUNC(mm_out_cuda)`·`addmm_out_cuda_impl` 시그니처(line 619-646) / `InlineEvent` 멤버(line 1158-1175) / `Allocator` API(line 1296-1300) / `get_raw_device`(line 1048) / XPU·CUDA GuardImpl 동작(`ext_oneapi_submit_barrier`, `cudaEventRecord` 전후 `setDevice`, `command_execution_status`, `wait_and_throw`) / `Stream::query`·`wait`(line 1090-1113) / `CUDAStream::query` 본문(line 1225-1239) / `DeviceGuard::reset_device`·`InlineDeviceGuard` 코드(line 1253-1271) / 생성된 `add_Tensor` 코드와 `after_autograd_keyset`(line 899-937) / Python 예제 출력값 4개 모두 손계산 일치(line 775-819) / `CompositeImplicitAutograd: matmul` 등록(line 461-463).

</details>

<details><summary>Codex gpt-6-astra 전문</summary>

문체: 강의 구어체는 무난하지만, 도입부의 반복 질문·과장과 일부 용어 표기를 줄이면 좋습니다.
이해도: 초반 dispatcher 설명과 긴 C++ 예제의 밀도가 높고, kernel·stride의 사전 설명이 부족합니다.
도식: Mermaid 6개, PNG 4개, ThemeImage 1개를 검토했습니다. 특히 아키텍처와 Event 그림은 동작을 오해하게 합니다.
기술: 전체 matmul 추적 방향은 타당하지만 dispatch key, storage 수명, Event와 빌드 버전 설명에 수정이 필요합니다.
우선 수정 3가지: ① alias key와 실제 dispatch 경로 구분 ② view·복사·메모리 반환 조건 교정 ③ Event 완료·대기·소멸 구분.

## Axis 1 — AI 문체와 비표준 용어

- **[A1-1] [severity: medium] line 40** — 인용: "그런데 그 과정에서 실제로 어떤 일이 일어나는지를 파악하는 가장 효과적인 방법 중 하나는 call stack을 확인해 보는 것입니다." → 문제: 24행과 제목의 질문을 반복한 뒤, 독자가 이미 아는 tensor 생성·출력 과정으로 설명을 지연합니다. → 제안: 문단을 “CUDA GEMM 진입점에 breakpoint를 걸고, `torch.matmul(y, z)`가 그곳까지 도달하는 call stack을 확인하겠습니다.”로 줄입니다.

- **[A1-2] [severity: medium] line 107-108** — 인용: "Call depth가 무려 55단계나 됨" → 문제: “무려”, “엄청 복잡한 일이”가 연속되고, 26행의 “호출 깊이의 정체”와 함께 과도한 발견 서사를 만듭니다. → 제안: 두 줄을 “이 snapshot에는 CPython·libc 프레임을 포함해 55개 프레임이 있습니다.”로 바꾸고, 목차의 “정체”는 “구성”으로 바꿉니다.

- **[A1-3] [severity: low] line 118** — 인용: "단순히 2D 매트릭스를 곱하는 것이라면 그냥 곱하면 되지만" → 문제: “그냥 곱하면”은 정보가 없고, “매트릭스”는 다른 부분의 행렬·matrix와 표기가 섞입니다. 419·432·1028행의 “디바이스”도 주로 사용하는 `device`와 불일치합니다. → 제안: “`torch.matmul`은 입력 tensor의 shape에 따라 구현을 선택합니다.”로 줄이고, 행렬은 “행렬”, device는 `device`로 통일합니다.

새로 만들어 낸 고유한 단계명·기구명은 뚜렷하지 않습니다. `CompositeImplicitAutograd`, redispatch, structured kernel은 실제 용어이며, 문제는 아래에 구분한 정의와 적용 범위입니다.

## Axis 2 — 이해도, 비유의 균형, 분량

- **[A2-1] [severity: medium] line 142-144** — 인용: "어떤 구현(kernel)을 실행해야 하는가" → 문제: 이후 Autograd kernel과 CUDA kernel이 같은 수준의 실행 단위처럼 등장하지만, dispatcher에 등록되는 C++ 함수와 GPU에서 실행되는 함수의 차이를 정의하지 않습니다. → 제안: 첫 등장에 “여기서 kernel은 dispatcher에 등록된 연산 구현 함수입니다. Autograd kernel은 CPU에서 그래프 정보를 관리하는 C++ 함수이며, CUDA backend 구현은 필요할 때 GPU kernel을 실행하도록 요청합니다.”를 추가합니다.

- **[A2-2] [severity: medium] line 144-146** — 인용: "redispatch는 kernel 실행이 끝난 뒤가 아니라 실행 도중에 일어나는 중첩 호출이라는 점이 중요합니다." → 문제: key 수집, TLS, 우선순위, masking, 재호출, 반환 후 처리를 한 문단에서 연이어 도입하고 다음 문단이 이를 다시 요약합니다. → 제안: “Autograd 준비 → 안쪽 CUDA 구현 호출 → 결과 반환 → history 기록”의 네 단계로 나누고, “바깥 함수가 안쪽 함수를 호출한 자리에서 기다렸다가 이어 실행하는 구조입니다.”라는 설명 하나만 둡니다.

- **[A2-3] [severity: medium] line 513-557** — 인용: "자동 생성된 Autograd kernel 예제 (old style `add`):" → 문제: 디버그 검사까지 포함한 약 40행의 구버전 코드가 나오고 896–938행에서 같은 구조를 다시 제시합니다. 앞의 55프레임 전체 stack까지 본 초심자에게는 주 실행 흐름보다 C++ 표기가 더 두드러집니다. → 제안: 본문에는 현재 버전의 `compute_requires_grad`·노드 생성·redispatch·`set_history`만 남긴 10–15행 예제를 한 번 싣고, 구버전 코드와 전체 stack은 접힌 참고자료로 옮깁니다.

- **[A2-4] [severity: medium] line 701-708** — 인용: "Stride를 이용해 `tensor[i][j]`를 `data_ptr[i * stride[0] + j * stride[1]]`로 접근" → 문제: stride와 `intrusive_ptr`를 처음 보는 독자에게 포인터식만으로 storage 공유를 설명합니다. 특히 data pointer가 tensor의 첫 원소 기준인지 storage 시작 기준인지 불명확합니다. → 제안: “Storage는 원소를 보관하고 metadata는 읽는 방법을 정합니다.”를 먼저 쓰고, `(2, 3)`의 stride `(3, 1)`이 transpose 후 `(1, 3)`이 되는 작은 예를 추가합니다. 식의 `data_ptr`는 storage offset이 반영된 tensor 시작 주소라고 명시합니다.

- **[A2-5] [severity: medium] line 1181-1204** — 인용: "**다양한 getter들**: `device()`, `device_type()`, `device_index()`, `flag()`, `was_marked_for_recording()`, `eventId()`" → 문제: 이미 설명한 record·block·query·synchronize를 긴 C++ 위임 경로와 XPU/CUDA 구현으로 다시 나열합니다. API별 차이를 배우기 전에 함수명 목록을 따라가야 합니다. → 제안: 본문을 “record: 완료 지점 표시 / block: 다른 stream의 후속 작업 대기 / query: 완료 여부 조회 / synchronize: host 대기” 표로 줄이고, getter·backend별 호출 경로는 접힌 참고자료로 옮깁니다.

## Axis 3 — 모든 도식 검토

Mermaid는 요청대로 소스로 판단했고, PNG와 DeviceGuard의 두 테마 SVG는 직접 열어 확인했습니다. 아래 가독성 평가는 소스 구조·이미지·CSS 기준이며 실제 투사 화면의 측정값은 아닙니다. `mindmap`은 없습니다.

- **[A3-1] [severity: high] line 227-245** — 인용: "DB1 -. redispatch .-> D" → 문제: 본문은 Autograd kernel이 redispatch한다고 설명하지만 그림의 두 kernel은 모두 `Device Backend`입니다. Autograd 계층이 사라져 device backend 간 순환이 기본 경로인 것처럼 보입니다(확신: high). → 제안: `Dispatcher → Autograd kernel → Dispatcher → CUDA backend → CUDA runtime/cuBLAS`로 역할을 구별하고, 재진입 화살표는 Autograd kernel에서 시작하도록 그립니다.

- **[A3-2] [severity: low] line 330** — 인용: "/images/02/slide13_1.png" → 문제: 개념도 용도로 적합하며 table·함수 포인터는 식별 가능합니다. 다만 그림 자체에는 key set과 redispatch 과정이 없습니다. → 제안: “dispatch table 개념도, 역사적 라벨 사용”이라고 표시하고 해당 과정의 근거는 후속 그림으로 연결합니다.

- **[A3-3] [severity: low] line 687-695** — 인용: "S -->|intrusive_ptr| SI["c10::StorageImpl"]" → 문제: 없음. 7개 노드가 TensorImpl·Storage·AutogradMeta 관계를 간결하게 보여주며 본문과 대응합니다. → 제안: 유지하되 일반적인 strided tensor의 구조라는 범위를 표시합니다.

- **[A3-4] [severity: low] line 949** — 인용: "/images/02/slide37_1.png" → 문제: 없음. `def`·`impl`·`fallback` 세 예제가 본문과 같은 순서로 배치되고 구분됩니다. → 제안: 유지합니다.

- **[A3-5] [severity: low] line 964** — 인용: "/images/02/slide38_1.png" → 문제: 없음. table과 vtable 비교를 지원하며 글씨가 식별되지만 330행과 사실상 같은 그림입니다. → 제안: 반복 사용은 가능하되 “operator마다 이 table이 하나씩 있음”을 캡션에 명시합니다.

- **[A3-6] [severity: low] line 984-986** — 인용: "/images/02/slide39_1.png" → 문제: union·exclude·우선순위 선택은 본문과 일치하고 Autograd의 옛 위치도 주석으로 고지했습니다. 여러 입력·비트·주석이 있어 다른 그림보다 밀도는 높습니다. → 제안: 역사적 개념도로 유지하고, CPU·CUDA 입력의 결합 그림이 혼합 device matmul 지원을 뜻하지 않는다고 짧게 표시합니다.

- **[A3-7] [severity: low] line 1067-1086** — 인용: "HOST -- "command 삽입" --> Q1" → 문제: 없음. host의 제출과 device별 stream pool을 5개 작업 노드로 보여주며 FIFO 설명을 지원합니다. → 제안: 유지하고, stream 간 실행 순서는 별도 동기화가 필요하다는 한 줄을 덧붙입니다.

- **[A3-8] [severity: high] line 1119-1132** — 인용: "Note over E: 소멸" → 문제: record 완료는 Event 객체 소멸이 아닙니다. 또한 stream 간 의존성을 설명하는 본문과 달리 대기하는 두 번째 stream이 없습니다(확신: high; [CUDA Event API](https://docs.nvidia.com/cuda/cuda-runtime-api/group__CUDART__EVENT.html)). → 제안: 마지막 표시는 “완료: query() = true”로 바꾸고, producer의 record와 consumer의 block·후속 작업 재개를 그립니다. 객체 파괴는 별도 host 동작으로 분리합니다.

- **[A3-9] [severity: medium] line 1215-1220** — 인용: "alt="DeviceGuard nested diagram"" → 문제: 두 테마 모두 `1 → 2 → 3` 진입만 표시하고 scope 종료 시 `3 → 2 → 1` 복원을 생략합니다. 중첩된 device 상자는 물리적 포함 관계처럼 보이며 11px 라벨도 작습니다. → 제안: 상자를 “current device가 1/2/3인 scope”로 이름 붙이고, 소멸 시점의 두 복원 화살표와 더 큰 라벨을 추가합니다.

- **[A3-10] [severity: medium] line 1493-1517** — 인용: "B --> E[libtorch_xpu.so]:::xpu" → 문제: CUDA/XPU 라이브러리가 모든 빌드에 함께 포함되는 것처럼 보이고, 실제로 존재하는 `torch_cuda → torch_cpu` 의존성도 빠져 있습니다. 11개 노드의 긴 파일명은 기본 60% 폭 제한에서 작아집니다(확신: high; [v2.13 CMake](https://raw.githubusercontent.com/pytorch/pytorch/v2.13.0/caffe2/CMakeLists.txt)). → 제안: “주요 의존성, 빌드 옵션에 따라 포함”이라는 범례와 `USE_CUDA`·`USE_XPU` 조건을 넣고, 해당 의존성을 추가한 뒤 `wide`로 표시합니다.

- **[A3-11] [severity: low] line 1542-1570** — 인용: "root((Source Code))" → 문제: 없음. 14개 노드의 트리이고 `wide`를 사용하며, 본문에 나오는 주요 수작성·생성 코드 경로와 대응합니다. → 제안: 전체 저장소의 완전한 분류가 아니라 주요 경로의 발췌라는 캡션만 추가합니다.

## Axis 4 — 기술적 정확성

가능한 항목은 `v2.13.0` 태그의 공식 소스와 대조했습니다. 이 환경에는 PyTorch가 없어 Python API 실행·CUDA 실행·전체 빌드·codegen 재생성은 하지 않았으며, 775–818행의 수치 출력은 별도 산술 계산으로 일치를 확인했습니다. 894행의 10개 shard와 intrusive pointer 사용은 생성기와 일치하지만, `add`의 정확한 shard 번호와 원래 stack 캡처 환경은 needs verification입니다. [v2.13 생성기](https://github.com/pytorch/pytorch/blob/v2.13.0/tools/autograd/gen_variable_type.py)

- **[A4-1] [severity: high] line 322** — 인용: "dispatch key set에서 CompositeImplicitAutograd 선택 후 kernel 호출" → 문제: `CompositeImplicitAutograd`는 등록에 사용하는 alias key이며 runtime key set에서 직접 선택하지 않습니다. `Autograd`도 alias이고 일반 CUDA tensor 경로에서는 `AutogradCUDA` 같은 runtime key로 처리합니다(확신: high; [v2.13 DispatchKey.h](https://github.com/pytorch/pytorch/blob/v2.13.0/c10/core/DispatchKey.h)). → 제안: “선택된 runtime key의 table entry를 통해 `CompositeImplicitAutograd`에 등록한 matmul 구현을 호출합니다.”로 고치고 142–144·379행도 같은 기준으로 수정합니다.

- **[A4-2] [severity: high] line 250-251** — 인용: "dispatch key set을 계산해서 op을 **Dispatcher**에게 전달합니다." → 문제: 제시한 일반 `matmul::call` 경로의 key set 추출은 Front-End 밖인 `Dispatcher::call` 내부의 `dispatchKeyExtractor().getDispatchKeySetUnboxed(...)`에서 수행합니다. 310행의 설명과도 충돌합니다(확신: high; [v2.13 Dispatcher.h](https://github.com/pytorch/pytorch/blob/v2.13.0/aten/src/ATen/core/dispatch/Dispatcher.h)). → 제안: “Front-End가 operator handle과 인자를 전달하면 Dispatcher가 입력과 thread-local 상태로 key set을 계산합니다.”로 바꾸고 191·275·455행을 함께 고칩니다.

- **[A4-3] [severity: high] line 188** — 인용: "dispatch key set에서 최우선 key를 선택하여 해당 kernel 탐색" → 문제: `callWithDispatchKeySlowPath`에는 이미 찾은 `KernelFunction`이 전달됩니다. 이 함수는 `RecordFunction` 등 관측 callback을 처리하는 경로이며 일반적인 kernel 탐색 단계가 아닙니다(확신: high; [v2.13 Dispatcher.h](https://github.com/pytorch/pytorch/blob/v2.13.0/aten/src/ATen/core/dispatch/Dispatcher.h)). → 제안: 역할을 “선택된 kernel 호출 전후의 profiler/RecordFunction callback 처리”로 고치고 197행에도 적용합니다.

- **[A4-4] [severity: high] line 334** — 인용: "처리가 끝나면 다음 key로 redispatch하는 과정을 반복합니다." → 문제: dispatcher가 kernel 반환 후 다음 key를 자동 실행하는 구조가 아닙니다. 이 덱의 Autograd 예제는 실행 도중 key set을 줄여 재호출하고, 반환 후 history를 기록합니다(확신: high; [v2.13 Dispatcher.h](https://github.com/pytorch/pytorch/blob/v2.13.0/aten/src/ATen/core/dispatch/Dispatcher.h)). → 제안: “Autograd kernel이 자기 실행 도중 처리한 key를 제외한 set으로 redispatch합니다.”로 바꾸고 575행의 “실행된 후”도 수정합니다.

- **[A4-5] [severity: high] line 125-126** — 인용: "| 3D 이상 (batch) | `torch.bmm` |" → 문제: batch 입력도 `should_fold` 조건에 따라 차원을 접어 `mm` 또는 `mv`를 호출합니다. 차원 수가 다르다는 이유만으로 broadcast하는 것도 아니며 행렬의 곱셈 축은 일치해야 합니다(확신: high; [v2.13 _matmul_impl](https://raw.githubusercontent.com/pytorch/pytorch/v2.13.0/aten/src/ATen/native/LinearAlgebra.cpp)). → 제안: “batch 입력: 일반적으로 broadcast 후 bmm, 조건에 따라 reshape 후 mm/mv”로 고치고, broadcast는 batch 차원에 적용한다고 명시합니다.

- **[A4-6] [severity: high] line 605** — 인용: "입력 검증과 output 준비를 담당하는 wrapper는 code generator가 생성하므로" → 문제: wrapper 생성은 맞지만, operator별 shape 검증·출력 metadata 계산을 모두 codegen이 만들어 주는 것은 아닙니다. `TORCH_META_FUNC(mm)`의 차원 검사와 `set_output_raw_strided`는 사람이 작성한 구현입니다(확신: high; [v2.13 mm meta 구현](https://raw.githubusercontent.com/pytorch/pytorch/v2.13.0/aten/src/ATen/native/LinearAlgebra.cpp)). → 제안: “개발자가 meta 함수와 backend impl을 작성하고, codegen이 이들을 연결하며 출력 할당을 처리하는 wrapper를 생성합니다.”로 바꿉니다.

- **[A4-7] [severity: high] line 672** — 인용: "최종적으로 `cublasGemmEx` 또는 `cublasSgemm` 같은 cuBLAS 함수가 호출됩니다." → 문제: 바로 앞에서 보여준 `gemm_and_bias`의 cuBLASLt 경로는 `cublasLtMatmul`을 호출합니다. 마지막 문장이 두 backend의 진입점을 다시 혼합합니다(확신: high; [v2.13 CUDABlas.cpp](https://raw.githubusercontent.com/pytorch/pytorch/v2.13.0/aten/src/ATen/cuda/CUDABlas.cpp)). → 제안: “일반 cuBLAS 경로는 dtype·설정에 따라 `cublasSgemm`·`cublasGemmEx` 등을, cuBLASLt 경로는 `cublasLtMatmul`을 호출합니다.”로 바꿉니다.

- **[A4-8] [severity: medium] line 708** — 인용: "`requires_grad=False`이면 null로 최적화됨" → 문제: null일 수 있다는 최적화를 항상 성립하는 조건으로 표현합니다. 소스는 이미 생성된 AutogradMeta가 기본 상태로 돌아가더라도 null로 만들도록 강제하지 않는다고 명시합니다(확신: high; [v2.13 TensorImpl.h](https://raw.githubusercontent.com/pytorch/pytorch/v2.13.0/c10/core/TensorImpl.h)). → 제안: “autograd metadata가 필요 없으면 null일 수 있습니다. `requires_grad=False`라고 항상 null인 것은 아닙니다.”로 바꿉니다.

- **[A4-9] [severity: high] line 728** — 인용: "metadata와 실제 data는 `at::native::copy_()`로 복제" → 문제: `clone`은 먼저 `empty_strided` 또는 `empty_like`로 출력 metadata와 storage를 준비한 뒤 `copy_`로 값을 복사합니다. `copy_`가 source의 shape·stride·dtype을 destination에 그대로 복제하는 것은 아닙니다(확신: high; [v2.13 clone 구현](https://raw.githubusercontent.com/pytorch/pytorch/v2.13.0/aten/src/ATen/native/TensorFactories.cpp)). → 제안: “출력의 shape·stride·storage를 먼저 준비하고, `copy_`로 원소 값을 복사합니다.”로 수정합니다.

- **[A4-10] [severity: high] line 736** — 인용: "명시적으로 `clone()`을 호출하지 않는 한 대부분 이 경우에 해당" → 문제: `a + b`, `matmul`, advanced indexing 등도 새 storage를 만듭니다. 기존 tensor에서 파생됐다는 사실만으로 view인지 판단할 수 없습니다(확신: high). → 제안: “`view`, 일반 strided tensor의 `transpose`, 기본 slicing 등 view 연산은 storage를 공유합니다. 산술 연산이나 `clone`은 보통 새 storage를 만듭니다.”로 바꿉니다.

- **[A4-11] [severity: high] line 857-863** — 인용: "Storage는 공유하고 metadata만 변경됩니다." → 문제: 이 문장 아래의 `flatten`과 `reshape`는 stride 조건에 따라 copy가 필요합니다. `reshape` 행의 예외만으로 상위 문장의 단정을 해소하지 못하며, `flatten`도 내부에서 reshape를 사용합니다(확신: high; [v2.13 TensorShape.cpp](https://raw.githubusercontent.com/pytorch/pytorch/v2.13.0/aten/src/ATen/native/TensorShape.cpp)). → 제안: “원소 수를 유지하며 차원 수를 줄입니다. `squeeze`는 view이고, `flatten`·`reshape`는 가능한 경우 storage를 공유하고 그렇지 않으면 복사합니다.”로 바꿉니다.

- **[A4-12] [severity: high] line 747-755** — 인용: "Reference count가 0이 되는 시점에 비로소 `StorageImpl`과 실제 device memory가 정리됨" → 문제: `del`은 이름의 참조를 제거할 뿐이고 Python·C++·autograd의 다른 소유자가 수명을 연장할 수 있습니다. CUDA에서는 storage가 놓여도 caching allocator가 메모리를 재사용용으로 보관할 수 있어 GPU 메모리 반환과 동일하지 않습니다(확신: high; [공식 CUDA 메모리 설명](https://raw.githubusercontent.com/pytorch/pytorch/main/docs/source/notes/cuda.md)). → 제안: “마지막 소유 참조가 사라지면 tensor/storage 자원이 해제됩니다. CUDA 메모리는 보통 allocator cache로 반환되어 이후 할당에 재사용됩니다.”로 바꿉니다.

- **[A4-13] [severity: high] line 852-863** — 인용: "`y = x.permute(2, 0, 1)`" → 문제: 표에서 정의한 `x`는 `torch.arange(6).view(2, 3)`인 2D tensor라 이 호출과 `flatten(1, 2)`는 차원 오류가 나고, `reshape(2, 12)`도 원소 수가 맞지 않습니다(확신: high; [v2.13 shape 구현](https://raw.githubusercontent.com/pytorch/pytorch/v2.13.0/aten/src/ATen/native/TensorShape.cpp)). → 제안: 3D 예제에는 `x3 = torch.arange(24).reshape(2, 3, 4)`를 별도로 정의하고 `x3.permute(2, 0, 1)`, `x3.flatten(1, 2)`, `x3.reshape(2, 12)`를 사용합니다. 확장 표에도 크기 1인 축을 가진 입력을 따로 정의합니다.

- **[A4-14] [severity: medium] line 831-845** — 인용: "**TensorIterator**는 View와 분리된 storage를 접근하기 위한 helper입니다:" → 문제: TensorIterator를 storage/view 분리 전용 기구로 잘못 정의합니다. 원소별 연산 등의 반복에서 broadcasting·stride·dtype 처리를 돕는 구성 요소이며 예제의 float lambda도 범용 `torch.add` 구현과 같지 않습니다(확신: high; [공식 TensorIterator.h](https://raw.githubusercontent.com/pytorch/pytorch/main/aten/src/ATen/TensorIterator.h)). → 제안: “TensorIterator는 여러 tensor의 shape·stride를 맞춰 원소별 연산을 순회하도록 돕습니다.”로 바꾸고, 코드는 동일 CUDA device의 float32 입력용 발췌 예제라고 명시합니다.

- **[A4-15] [severity: high] line 1035-1043** — 인용: "Device type이 CPU면 device index는 zero여야 함" → 문제: 실제 검증은 CPU에 `-1`과 `0`을 허용하며, 음수 전체가 아니라 `-1`만 미지정/current 의미로 허용합니다. Python에도 문자열 외에 `torch.device` 객체가 있습니다(확신: high; [v2.13 Device.h](https://github.com/pytorch/pytorch/blob/v2.13.0/c10/core/Device.h)). → 제안: “Python에서는 `torch.device` 또는 device 문자열을 사용합니다. C++ index `-1`은 미지정/current이며, CPU는 `-1` 또는 `0`을 허용합니다.”로 수정합니다.

- **[A4-16] [severity: high] line 1188-1190** — 인용: "Event는 thread-safe하지 않아서 record가 한 번만 호출되도록 보장" → 문제: `recordOnce`는 일반 bool을 확인하고 `record`를 호출할 뿐, lock이나 atomic으로 동시 호출을 보호하지 않습니다. 함수 이름을 thread-safe once 보장으로 해석하면 안 됩니다(확신: high; [공식 InlineEvent.h](https://raw.githubusercontent.com/pytorch/pytorch/main/c10/core/impl/InlineEvent.h), 정확한 v2.13 파일 대조는 needs verification). → 제안: “`recordOnce`는 아직 기록하지 않은 경우에만 기록합니다. 같은 Event에 대한 동시 접근은 별도로 동기화해야 합니다.”로 바꿉니다.

- **[A4-17] [severity: high] line 1185** — 인용: "이전의 command를 모두 처리한 후 `sycl::event`를 선언함" → 문제: barrier 제출이 반환한 `sycl::event` 객체를 즉시 생성하며, 앞선 작업의 완료는 event 완료 조건입니다. 현재 문장은 record 호출이 host에서 완료를 기다리는 것처럼 읽힙니다(확신: high; [v2.13 XPUGuardImpl.h](https://github.com/pytorch/pytorch/blob/v2.13.0/c10/xpu/impl/XPUGuardImpl.h)). → 제안: “queue에 barrier를 제출하고 반환된 `sycl::event`를 저장합니다. 이 event는 앞서 제출한 작업이 끝나면 완료됩니다.”로 바꿉니다.

- **[A4-18] [severity: high] line 1145** — 인용: "RBLN: 아직 event 미지원" → 문제: 공식 RBLN v0.11.2 문서에는 `torch.rbln.Event`와 `record`·`wait`·`query`·`synchronize`가 명시되어 있어 버전 없는 미지원 단정은 맞지 않습니다(확신: high, 문서 기준; [RBLN v0.11.2 API](https://docs.rbln.ai/v0.11.2/software/rbln_pytorch/api.html)). → 제안: 삭제하거나 “RBLN v0.11.2는 Event를 제공하며 timing·IPC 등 지원 범위에 제한이 있습니다.”로 교체합니다. 2024년 당시 상태를 뜻했다면 당시 SDK 버전을 명시합니다.

- **[A4-19] [severity: high] line 1312-1327** — 인용: "`c10::intrusive_ptr<c10::GeneratorImpl> clone(const c10::intrusive_ptr<c10::GeneratorImpl>& generator_state) const`" → 문제: 이 `clone` signature는 두 계층 어느 쪽과도 맞지 않습니다. `at::Generator::clone()`은 `Generator`, `c10::GeneratorImpl::clone()`은 intrusive pointer를 반환하며 둘 다 인자를 받지 않고, 표는 두 계층의 API를 혼합합니다(확신: high; [v2.13 Generator.h](https://raw.githubusercontent.com/pytorch/pytorch/v2.13.0/aten/src/ATen/core/Generator.h), [GeneratorImpl.h](https://raw.githubusercontent.com/pytorch/pytorch/v2.13.0/c10/core/GeneratorImpl.h)). → 제안: 표를 wrapper와 backend interface로 나누고 정확한 무인자 `clone()`을 적습니다. offset 메서드는 모든 backend가 지원하는 기능이 아니라는 조건도 붙입니다.

- **[A4-20] [severity: high] line 1414-1418** — 인용: "`pyproject.toml`의 scikit-build override로 CMake build type에 매핑" → 문제: v2.13의 backend는 `setuptools.build_meta`여서 이 설명은 1334행과 충돌하며, `MAX_JOBS`도 2.13에서는 Python helper가 읽어 `cmake --build ... -j`로 전달합니다(확신: high; [v2.13 pyproject](https://raw.githubusercontent.com/pytorch/pytorch/v2.13.0/pyproject.toml), [빌드 helper](https://raw.githubusercontent.com/pytorch/pytorch/v2.13.0/tools/setup_helpers/cmake.py)). → 제안: 이 표를 2.13 동작으로 고치고 scikit-build 설명은 “2.14+”로 분리합니다. 재현용 clone 명령에도 `--branch v2.13.0`을 넣고 문서·소스 링크의 `stable`·`main`을 해당 버전으로 고정합니다.

- **[A4-21] [severity: medium] line 48** — 인용: "표에 등장하는 심볼 이름·파일 경로·전체 dispatch 흐름은 그대로 유효하지만" → 문제: 주요 흐름은 타당하지만 원본 PyTorch commit·빌드 옵션·입력·codegen 산출물 없이 모든 심볼과 생성 파일 경로까지 유효하다고 단정하기 어렵습니다. 특히 55라는 깊이는 build·최적화·관측 callback에 의존하고, 제시된 Python 경로는 구체적으로 3.13.0입니다(확신: medium, needs verification). → 제안: 캡처 commit, `torch.__version__`, 입력 shape/dtype/device/`requires_grad`, debugger·빌드 옵션을 첨부하고, “과거 빌드 snapshot이며 2.13에서도 주요 역할과 경로는 대응한다. 생성 파일명과 프레임 수는 재현 빌드에서 확인해야 한다.”로 범위를 제한합니다.

</details>
