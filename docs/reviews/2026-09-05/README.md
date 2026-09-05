# Lecture review 2026-09-05 (Fable 5.1 + Codex gpt-6-astra)

`src/content/lectures/*.mdx` 7개를 두 리뷰어가 독립적으로 읽고 네 축(AI slop·용어 / 이해도·ELI5·장황함 / 다이어그램 / 기술 정확성)으로 평가한 결과. 강의별 문서는 TL;DR → 두 리뷰어 일치 항목 표 → 한쪽만 제기한 항목 → 원문 리뷰 전문(접힘) 순서.

리뷰 절차: 동일 프롬프트(`PROMPT.md` 기준)로 강의당 Fable 서브에이전트 1개 + `codex exec --sandbox workspace-write` 1개를 병렬 실행. 양쪽이 엇갈린 항목 중 두 건(`accumulated_recompile_limit` 범위, `cos().cos()` 분기 예제)은 v2.13.0 소스와 산술로 직접 확인해 Codex 판정을 채택.

| 강의 | 문서 | 가장 급한 수정 |
|---|---|---|
| 01 | [01-technical-background.md](01-technical-background.md) | NumPy≠pybind11(212), CUDA=PTX/SASS 프로그래밍 모델(380), `torch.compile`=AOT(228), 313–328 역사 절이 Dynamo와 미연결, 60행 define-by-run 대응 뒤집힘 |
| 02 | [02-eager-mode.md](02-eager-mode.md) | 아키텍처 Mermaid에 Autograd kernel 없음(227), `callWithDispatchKeySlowPath` 역할(188), Front-End가 key set 계산(191), `gemm_internal` 버전 주장(48), Event 절 중복·다이어그램(1119/1134), view 표의 차원 오류(852) |
| 03 | [03-graph-mode.md](03-graph-mode.md) | Dynamo 루프 6중 반복(390–563), `cos().cos()` 예제 분기 안 바뀜(323), `accumulated_recompile_limit`는 code object 단위(536), frame 안에 eval loop(380), Loop-level IR→Triton(570) |
| 04 | [04-automatic-differentiation.md](04-automatic-differentiation.md) | fake tensor 불확실(418)·FX→C++ object(571)·D/E 순서(787) 세 메커니즘 오류, "normalization" 11곳, 파이프라인 8회·lazy 9회 반복, Baydin 표 `h-28`, Mermaid에 backward Node 이름 |
| 05 | [05-distributed-programming.md](05-distributed-programming.md) | **예제 코드 결과가 틀림**(484 local rank 슬라이스, 520 `.to(device)` 누락), `set_device` lazy init(541), `--node_rank` 무시(362), torchrun 순서(386), NCCL `wait()` 의미(554), TorchrunVisualizer 순서 반전 |
| 06 | [06-beyond-pytorch.md](06-beyond-pytorch.md) | Causal 그림 = Non-causal 그림 동일 파일(174), 이미지 alt 불일치 5건(377/408/864/321/803), continuous batching "layer 단위"(345), "Programming Guide 10%"(782), FA4 "v3 대비 2–3배"(737), `U R A HELP CHAPP`(221) |
| 07 | [07-cpu-gpu-npu.md](07-cpu-gpu-npu.md) | slide16_1 = slide17_1 동일 파일(193/205), loop_vliw SVG 스케줄 오류(566), "SW로는 iteration별 레지스터 표현 불가"(418), SIMT 정의(837), Occupancy 정의(856), "공짜가 아닙니다"(856), 1992 vs 1994 논문(666) |

## 강의 전체에 걸친 패턴

- **동일 이미지 파일 2회 사용**: 06(slide06_1=slide07_2), 07(slide16_1=slide17_1), 02(slide13_1=slide38_1). 앞 두 건은 잘못된 그림이 들어간 것.
- **고아 footnote**(정의만 있고 참조 없음): 05 `[^arithmetic-intensity]`, 06 `[^cublas]` `[^simt]`, 07 `[^mbarrier]` `[^cta]`. remark가 렌더링하지 않음.
- **논문 첫 페이지 캡처를 메커니즘 그림 자리에**: 01 Fisher, 03 Rotenberg, 06 Wulf&McKee, 07 Rau·Park·Wulf&McKee.
- **AI 문체 상투구**: "핵심" "바로" "즉" "결국" "정리하면" "이것이 바로 ~" "진짜 이유는" "자연스러운 의문" "비밀은". 07의 "공짜가 아닙니다"는 명시적 금지 패턴.
- **음차 vs 영문 혼용**: 트랜스포메이션/랭귀지/코스 그레인(01), 매트릭스/프린트/디바이스(02), 컨트롤 플로우 그래프/상징 실행(03), 랑데뷰·랑데부(05), 빌드업/아키텍쳐(06), 인스트럭션/데이터 플로우/시퀀셜(07).
- **버전 고정 불일치**: 2.13을 표방하지만 구버전 인용(02 native_functions.yaml/Blas.cpp/DispatchKeyExtractor, 03 `stable` 링크, 04 `TypeDefault.cpp`·Python 3.8+).
- **강의일(2024–2025)과 2026년 자료 혼재**: 01 TorchScript deprecated, 06 FA4/DSpark/vLLM 0.25, 02 빌드 전환 일정. "내용 갱신일" 명시 필요.

## 리뷰어 간 성향 차이 (다음 리뷰 참고)

- Fable은 v2.13.0 소스 파일을 직접 내려받아 대조한 항목이 많고(02, 03, 05), Codex는 웹 검색으로 공식 문서·논문 링크를 붙임. 둘 다 이미지 파일을 열어 md5까지 확인함.
- Codex가 코드 예제의 실행 가능성(변수 미정의, 차원 오류, 분기 안 바뀜)을 더 꼼꼼히 잡음. Fable이 "검증 통과"로 표시한 03-536행은 틀렸음.
- Fable은 반복·중복 위치를 행 번호로 열거하는 데 강하고, Codex는 개념 정의 누락(kernel, Q/K/V, ISA) 지적이 많음.
