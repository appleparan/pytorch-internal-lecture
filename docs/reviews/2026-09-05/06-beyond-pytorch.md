# Review: 06-beyond-pytorch.mdx (2026-09-05)

리뷰어: Claude Fable 5.1 (서브에이전트) + OpenAI Codex `gpt-6-astra`.
대상: `src/content/lectures/06-beyond-pytorch.mdx` (1042행). 읽기 전용 리뷰, 수정 없음.

## TL;DR

- **AI slop / 용어**: 중간. 서스펜스형 도입("진짜 이유는", "이 그래프 한 장을 설명하기 위해서", "진짜 전장", "엔진의 심장"), "결국" 8회·"즉" 13회·"~셈입니다" 5회, vLLM 절의 반복 hedge closer("~에 따라 달라집니다/~뜻은 아닙니다" 6곳), 32행 "답부터 먼저 드리면(어디까지나 개인적인 생각이지만…)". 비표준 용어: "GPU-Aware 알고리즘"(표준은 IO-aware), "Main Model"(target model), "Counting Dots", "유효 곱셈(effective multiplication)", "Block Programming Model" 대문자 고유명사화. 두 리뷰어 일치.
- **이해도**: 대체로 좋음. 221행 `U R A HELP CHAPP` 깨진 예시(그림은 "You are a helpful chatbot"). Q/K/V 역할·shape 미설명. Self-attention 4단계가 4회 반복. 정의 없는 약어(MMA, WGMMA, GMEM/SMEM, SLO, TP/PP/EP, MoE). online softmax 점화식의 기호(prime, k, m/d/o) 정의 부족. 정리 절이 agenda·결론과 3중 반복. 두 리뷰어 일치.
- **다이어그램**: **가장 손볼 영역**. 두 리뷰어 완전 일치 high 4건: (1) `slide07_2.png`(Causal)가 `slide06_1.png`(Non-causal)와 **md5 동일 파일**. (2) speculative decoding alt 2개가 실제 그림(18_1=전체 과정, 18_2=autoregressive baseline)과 뒤바뀜. (3) `slide20_2.png` alt는 "tiling 구조"인데 실제는 GPT-2 attention 시간 막대그래프. (4) `slide42_1.png`는 "최적화 기법 개요"가 아니라 Model Support 슬라이드, `slide43_x` 4장은 본문에서 다루지 않은 prefix caching/chunked prefill/dynamic SD/multi-LoRA. 그 외 공통: slide13_1은 그래프가 아니라 Wulf&McKee 논문 첫 페이지이고 출처 링크가 15_1의 것, slide35/36 Triton 그림 alt·출처 불일치, slide24_1 "Grid = 연산기" 오류, 카드 ①~④ 순서가 slide06_2(내적→softmax→αV)와 다름, KV block 그림 block_size=4 vs 본문 16.
- **정확성**: 수치(KV cache 6.7GB, H100 ~295 FLOPs/byte, intensity≈B, online softmax recurrence)는 양쪽 검증 통과. 공통 high: 345행 continuous batching을 "layer 단계마다"로 설명(실제는 iteration/decode step 단위), 782행 "Programming Guide 수준 = 10%"(그림은 30–50% fp32, 10%는 vanilla), 370행 speculative decoding에서 거절 지점의 교정 토큰 생성 누락(greedy 한정 미명시), 390행 "N 두 배면 메모리·시간 4배"(KV cache는 O(N)), 462행 Grid 정의, 737행 FA4 "v3 대비 2–3배"(논문은 B200에서 cuDNN 대비 1.3×, Triton 대비 2.7×), 679/721행 FA1 utilization "25%"(논문은 25–40%).
- Codex만 잡은: 404행 "최종 결과만 한 번 DRAM에"(FA1은 K/V block마다 O·통계량 갱신), 552–605행 "메모리를 세 번 읽어야"(순차 baseline 설명이지 HBM 횟수 아님), 607행 점화식에 scaling·causal 범위 없음, 927–937행 "PyTorch만 지원하면 vLLM 동작"(platform plugin·attention backend 필요), 900행 running 큐 = decode 아님(chunked prefill 포함), 1024행 HBM read 하한은 dense·full attention 가정 명시 필요, 3행 강의일 2025 vs 2026 자료 혼재.
- Fable만 잡은: 653/751행 `[^cublas]`, `[^simt]` 고아 footnote, 725행 "FA v1은 생짜 CUDA"(Apex FMHA/CUTLASS 2.x 기반), 784행 "NVIDIA만 호출 가능"(cuBLAS는 누구나 호출; SASS 작성이 비공개), 434행 PagedAttention을 "attention 효율 기법"(메모리 관리 기법, 커널은 20–26% 느림), 298행 TPS→TPOT/ITL, 838행 CUDA Tile C++ 13.3 needs verification(Codex는 13.3 문서 링크 제시).

## 두 리뷰어가 일치한 항목 (우선 수정 후보)

| line | 문제 | 제안 |
|---|---|---|
| 22-34 | 도입 자기서술·동의 추정·질문 3개·목차 중복 | 두 문장으로 축약 |
| 113-149 | Q/K/V 역할 미설명, 4단계 4회 반복, 카드 ②③ 순서가 그림과 다름 | 역할 한 줄 정의, 115행 삭제, 카드를 "내적/scale → softmax → αV 합산 → 출력" |
| 174 | slide07_2 = slide06_1 동일 파일 | 하삼각 causal 그림으로 교체. "현재+이전 토큰" |
| 198, 269 | "진짜 이유는", "이 그래프 한 장을 설명하기 위해서" | 사실부터 |
| 221 | `U R A HELP CHAPP` | `You are a helpful chatbot`, 두 번째 토큰 `are` |
| 294 | "유효 곱셈", MFU 이름 안 밝힘 | 계산 기준 명시, "MFU" |
| 321-331 | slide13_1 = 논문 첫 페이지, 출처가 15_1 것 | alt/출처 재배치 |
| 345 | continuous batching "layer 단계마다" | iteration(decode step) 단위 |
| 364, 370-373 | "Main Model", 거절 시 교정 토큰 누락 | target model. "거절 위치에서 target이 토큰 하나 확정(그림 'Glitters') → 재draft". greedy 한정 명시 |
| 377-380 | speculative 그림 alt 2개 뒤바뀜 | 18_2=autoregressive baseline, 18_1=전체 과정 |
| 390 | "N 두 배 → 메모리·시간 4배" | 누적 시간 O(N²), KV cache O(N) |
| 408-411 | slide20_2 alt "tiling 구조" | 실제는 GPT-2 시간 막대그래프(≈17ms vs 2ms) |
| 431-434 | logical block = 전체 주소 공간으로 설명, block table 미설명 | 요청별 block table 한 줄 |
| 454 | "GPU-Aware 알고리즘" | IO-aware |
| 460-469 | "Grid = 연산기 집합", block당 20MB/19TB/s 오독 | Grid = thread block 집합. 합산 vs block/SM 한도 구분 |
| 489-492 | tiling.gif alt "입력 재사용·곱누적" | 실제는 출력 셀의 thread/block/grid 분할 |
| 561-563 | "같은 항이 빠지므로", "saturate" | 공통 인자 e⁻ᵐ 상쇄, exp overflow → inf/NaN |
| 607-621 | 점화식: o₀′ 초기값 없음, 기호 정의 부족 | o₀′=0, m/d/o 정의, 예시 한 줄 |
| 679-731 | FA1 "25%", "Removal of non-matmuls", MMA/WGMMA/TMA 무정의 | 25–40%(A100), "fewer non-matmul FLOPs", 약어 풀이 |
| 737 | FA4 "v3 대비 2–3배" | 논문대로 cuDNN 1.3×/Triton 2.7× (B200). Hot Chips 출처 needs verification |
| 755-764 | slide32_1/2 alt "SIMT 아키텍처" | "CPU/GPU 자원 배분", "세대별 추가 기능" |
| 782-784 | "Programming Guide 수준 10%" | Vanilla 1–10%, Guide 30–50%(fp32), CUTLASS 80–90%, cuBLAS 90%+(tf32) |
| 803-810 | Triton 그림 alt·출처 | 35_1=논문 Fig.3(thread vs block), 36_1=역할 비교표, SemiAnalysis 인용 출처 |
| 864-876 | slide42_1 = Model Support, 43_x 4장 본문 미언급·h-32 축소 | 이동 + 각 한 문장 + 한 장씩 |
| 880, 917-945 | TP/PP/EP/MoE 무정의, hedge closer 반복 | 약어 풀이, hedge는 도입에 한 번 |
| 906-911 | engine loop 글씨 작음, KV block 그림 block_size=4 vs 16, CPU metadata | 확대, 캡션 명시 |
| 963-971 | 정리 절 3중 반복, "결국" 3회 | 969·971만 |
| 997 | "Counting Dots" | "행렬곱 FLOPs 세는 법: 내적 개수 × 2" |
| 1007 | transformer-diagram.png 기호(N, B)가 본문과 충돌, FLOPs 없음 | 기호 차이 명시, alt 축소 |

## 한쪽만 제기한 항목 (검토 필요)

- **Codex A4-5 (high) line 404/483/489**: "최종 결과만 한 번 DRAM에" → FA1 Algorithm 1은 K/V block마다 Q·O·통계량 read/write. 줄이는 것은 N×N 행렬 materialization.
- **Codex A4-7 (high) line 552-605**: "메모리 세 번 읽기"는 순차 baseline 설명. 행이 SRAM에 들어가면 1 pass.
- **Codex A4-4 (high) line 282-291**: "Prefill은 이미 이상적" → compute-bound ≠ peak 달성. 985–989행 시간도 이상적 하한으로 표시.
- **Codex A4-12 (high) line 927-937**: "PyTorch만 지원하면 vLLM 동작" → platform plugin·worker·attention backend 구현 필요. 888행도 조건.
- **Codex A4-13/14 line 884/943**: Transformers backend도 compile 적용. fallback은 호환 모델에 한정.
- **Codex A4-16 line 900**: running 큐에 chunked prefill 포함(v0.10.1 소스).
- **Codex A4-17 line 1024-1032**: HBM read 하한은 dense·full attention·1토큰 가정. MoE/sliding window 예외.
- **Codex A4-15 line 3-13**: 강의일 2025-02-05인데 2026 자료 혼재 → "내용 갱신일"과 기준 버전 명시.
- **Codex A3-4 line 305**: vllm-anatomy-pd.png h-32로 판독 불가, engine core/worker/NIXL 미설명. Fable도 NIXL 언급 없음 지적(low).
- **Fable A4-10 line 653/751**: `[^cublas]`, `[^simt]` 참조 없음.
- **Fable A4-4 line 725/673**: FA v1 = Apex FMHA(CUTLASS 2.x) 기반, "생짜 CUDA" 아님.
- **Fable A4-3 line 784**: cuBLAS는 누구나 호출. NVIDIA만 가능한 건 SASS 작성. DeepGEMM 등 최근 사례.
- **Fable A4-17 line 434**: PagedAttention은 메모리 관리 기법. 커널은 contiguous 대비 20–26% 느림.
- **Fable A4-16 line 298**: "TTFT와 TPS" → TTFT와 TPOT(ITL).
- **Fable A4-11 line 607/611**: 점화식은 Zihao Ye 노트 형태(매 스텝 정규화). 실제 FA는 마지막에 한 번 나눔. 출처 추가.
- **Fable A4-14 line 384/917/919/945**: 2026년 자료(DSpark, Qwen3-0.6B GB200 50%, Transformers backend 범위) needs verification.
- **Fable A2-15 line 42**: `⌐ 오늘의 초점 ¬` 논리 부정 기호 오용.

## 원문 리뷰

<details><summary>Fable 5.1 전문</summary>

# Review: `src/content/lectures/06-beyond-pytorch.mdx` (Week 6, Beyond PyTorch)

## TL;DR

- **Axis 1 (AI slop/용어)**: 중간. 문장 자체는 강의체로 괜찮으나 "결국"(8회)·"즉"(13회)·"~셈입니다"(5회), 서스펜스형 도입("진짜 이유는", "이 그래프 한 장을 설명하기 위해서"), 그리고 vLLM 절의 반복적 hedge 마무리("~에 따라 달라집니다 / ~뜻은 아닙니다")가 눈에 띔. 비표준 용어는 "GPU-Aware 알고리즘"(→ IO-aware), "Main Model"(→ target model), "Counting Dots" 정도.
- **Axis 2 (이해도/장황함)**: 대체로 좋음. 단, `U R A HELP CHAPP`(line 221)처럼 깨진 예시, 정의 없는 약어(MMA·WGMMA·SLO·TP/PP/EP 등), Self-attention 절과 정리 절의 3중 반복이 문제.
- **Axis 3 (다이어그램)**: 가장 손볼 곳. **Causal Attention 그림(slide07_2)이 Non-causal "it" 그림(slide06_1)과 바이트 단위로 동일**(md5 일치). 그 외 alt/캡션이 실제 이미지와 다른 곳 5건(slide18_1/2, slide20_2, slide42_1, slide43_x, slide35/36).
- **Axis 4 (기술 정확성)**: 수식·바이트 계산(KV cache 6.7GB, H100 ~300 FLOPs/byte, intensity≈B)은 모두 맞음. 사실 오류는 continuous batching을 "layer 단위" 스케줄링으로 설명한 것(line 345), CUDA Programming Guide 수준 코드를 "10%"라고 한 것(슬라이드는 30–50%), CUDA "Grid"를 연산기 집합으로 정의한 것, FA v1을 "생짜 CUDA"로 설명한 것, 참조되지 않는 각주 2개(`[^cublas]`, `[^simt]`).

**가장 중요한 수정 3가지**: (1) slide07_2.png 교체(현재 non-causal 그림과 동일 파일), (2) line 345 continuous batching = iteration(decode step)-level scheduling으로 정정, (3) 이미지-alt 불일치 5건과 line 782 "10%" 수치 정정.

---

## Axis 1 — AI slop과 비표준 용어

- **[A1-1] [severity: medium] line 269** — 인용: "사실 지금까지 Self-Attention → Causal/Non-Causal → Prefill/Decode를 차례로 빌드업해 온 것은 이 그래프 한 장을 설명하기 위해서라고 봐도 무방합니다" → 문제: 서스펜스형 도입 + 전음차용("빌드업"). 요점(Roofline이 무엇인지)이 두 문장 뒤에 나옴 → 제안: "Prefill과 Decode의 차이는 Roofline 그래프 한 장으로 정리됩니다."로 바로 시작.
- **[A1-2] [severity: medium] line 198** — 인용: "앞에서 LLM 이야기, 그리고 Prefill·Decode 이야기를 길게 한 진짜 이유는 두 단계가 서로 다른 계산적 특성을 가진다는 점을 짚기 위해서입니다" → 문제: "진짜 이유는" 류의 자기서술 전환 → 제안: "두 단계는 계산 특성이 다릅니다. 시간축에 펼치면 다음과 같습니다."
- **[A1-3] [severity: low] line 291** — 인용: "즉 LLM 추론 최적화의 진짜 전장은 Decode 단계입니다" → 문제: 극적 프레이밍("진짜 전장") → 제안: "따라서 최적화 대상은 Decode 단계입니다."
- **[A1-4] [severity: low] line 532** — 인용: "중간에 끼어 있는 softmax가 진짜 골치 아픈 부분입니다 ... 곧 Flash Attention의 핵심 기술적 챌린지입니다" → 문제: "진짜/핵심/챌린지" 강조어 중첩. 같은 패턴이 line 796 "~가 핵심입니다", 806 "Triton의 핵심은" → 제안: "softmax는 N개 값 전체를 봐야 하므로 tiling이 어렵습니다. 이를 푸는 것이 online softmax입니다(다음 절)."
- **[A1-5] [severity: low] line 721** — 인용: "알고리즘적 재구성은 끝났는데, 정작 GPU의 자원을 다 끌어쓰지는 못한 셈입니다" → 문제: "정작 ... 셈입니다" 패턴. "~셈입니다"가 line 318, 721, 737, 929, 989에 반복 → 제안: "알고리즘은 바뀌었지만 GPU utilization은 25–40%에 그쳤습니다." 나머지도 단정문으로.
- **[A1-6] [severity: low] line 898** — 인용: "엔진의 심장은 단순한 루프입니다" → 문제: 수사적 비유 → 제안: "엔진 코어는 schedule → forward → postprocess 세 단계를 반복하는 루프입니다."
- **[A1-7] [severity: low] line 1020** — 인용: "Prefill이 Compute Bound이고 한 토큰씩 처리하는 Decode가 Memory Bound인 이유가 이 한 줄에 담겨 있습니다" → 문제: 마무리 수사 → 제안: 문장 삭제(앞 문장 "임계값을 넘기려면 수백 개 토큰을 한 번에 처리해야 한다"가 이미 결론).
- **[A1-8] [severity: low] line 277** — 인용: "컴퓨터를 (1) 메모리에서 데이터를 읽고 쓰는 비용 + (2) 가져온 데이터로 실제 연산을 수행하는 비용 두 가지로만 나눠" → 문제: 인라인 (1)(2) 열거 → 제안: "컴퓨터를 메모리 접근 비용과 연산 비용, 두 가지로만 모델링했을 때".
- **[A1-9] [severity: medium] line 969-971** — 인용: "결국 오늘 강조할 내용은 ... 결국 LLM 추론 스택은 ... 결국 성능의 관건입니다" → 문제: 두 문단에 "결국" 3회(파일 전체 8회, "즉" 13회) → 제안: 969 "오늘의 요점은 ~", 971 "도입 그림으로 돌아가면 LLM 추론 스택은 ~이고, 추론 특화 반도체는 이 스택 전체를 받쳐야 합니다."로 "결국" 제거.
- **[A1-10] [severity: medium] line 743, 834, 880, 917, 919, 945** — 인용: "어떤 backend가 기본으로 선택되는지는 framework version, GPU architecture, dtype과 attention 형태에 따라 달라집니다" → 문제: 여섯 문단이 모두 "~에 따라 다르므로 ... 뜻은 아닙니다 / 확인해야 합니다"로 끝나는 hedge 클로저. 한 번이면 충분하고, 반복되면 LLM 문체로 읽힘 → 제안: 743·834·919·945의 마지막 문장은 삭제하고, vLLM 절 도입(880)에 "기능별 지원 범위는 model·hardware에 따라 다릅니다" 한 문장만 남김.
- **[A1-11] [severity: low] line 760, 425, 269, 989, 737** — 인용: "깨끗한 SIMT 아키텍쳐" / "처리량이 바운드됩니다" / "터닝 포인트" / "자원 밸런스" → 문제: 전음차용·오탈자. 덱은 다른 곳에서 영어 표기(bound, turning point)를 씀 → 제안: "아키텍처", "처리량이 제한됩니다", "turning point(변곡점)", "자원 balance".
- **[A1-12] [severity: medium] line 454** — 인용: "Flash Attention과 GPU-Aware 알고리즘" → 문제: FlashAttention 논문의 용어는 **IO-aware**. "GPU-aware"는 MPI 문맥(GPU-aware MPI)에서 다른 뜻으로 쓰임 → 제안: "Flash Attention과 IO-Aware 알고리즘".
- **[A1-13] [severity: medium] line 364** — 인용: "**큰 모델(Main Model)** 로 그 초안이 맞는지 검증만 한다" → 문제: 표준 용어는 draft model / **target model**(Leviathan et al., Chen et al.). "Main Model"은 인용한 그림(slide18_1)의 표기일 뿐 → 제안: "큰 모델(Target Model)"로 통일하고 그림 표기와 다름을 괄호로 표시.
- **[A1-14] [severity: low] line 997** — 인용: "Counting Dots: 행렬곱의 FLOPs 세는 법" → 문제: 표준 용어 없음. 출처(JAX Scaling Book)에도 이 제목은 없음 → 제안: "행렬곱의 FLOPs 세는 법: 내적 개수 × 2"로 제목 교체.
- **[A1-15] [severity: low] line 806** — 인용: "Triton의 핵심은 **Block Programming Model**입니다" → 문제: Triton 논문/문서 표기는 "blocked program", "tile-level programming". 완전한 오용은 아니나 고유명사처럼 대문자 강조할 용어는 아님 → 제안: "Triton은 thread가 아니라 block(tile) 단위로 프로그램을 쓰게 합니다."

## Axis 2 — 이해도, ELI5 균형, 장황함

- **[A2-1] [severity: high] line 221** — 인용: "예를 들어 프롬프트가 `U R A HELP CHAPP`라면, 두 번째 토큰 `R`를 처리할 때" → 문제: 깨진 예시(음성 전사 오류로 보임). 아래 그림(prefill-vs-decode.png)의 프롬프트는 "You are a helpful chatbot" → 제안: "`You are a helpful chatbot`라면, 두 번째 토큰 `are`를 처리할 때 `You`의 다음 토큰이 무엇인지는 이미 정해져 있고" 로 교체.
- **[A2-2] [severity: medium] line 213** — 인용: "TPS의 미묘한 점은 매 스텝마다 같은 모델을 그대로 돌린다는 점입니다" → 문제: 문장이 뜻을 전달하지 못함(같은 모델을 돌리는 것이 왜 "미묘"한지 불명) → 제안: "매 스텝 같은 weight를 읽지만 attention이 봐야 하는 KV는 토큰마다 늘어나므로, 뒤로 갈수록 스텝당 시간이 조금씩 늘어 TPS가 서서히 떨어집니다."
- **[A2-3] [severity: medium] line 113-120** — 인용: "그다음 새로운 representation을 만들고자 하는 단어의 query와, 모든 단어의 key를 곱해 attention score를 만들고" → 문제: 113(수식 설명) → 115(그림 설명) → 119-120(요약) → 136-149(카드 ①~④)로 같은 4단계가 네 번 반복 → 제안: 115 문단 삭제, 119-120 요약과 카드만 남김.
- **[A2-4] [severity: medium] line 294** — 인용: "프로세서가 그 관점에서 얼마나 빠르게 처리하는지를 따로 측정하는 별도 용어가 있습니다" → 문제: 용어를 안 밝힘 → 제안: "MFU(Model FLOPs Utilization)라는 별도 지표가 있습니다."
- **[A2-5] [severity: medium] line 725, 731, 733, 349, 300, 880, 917** — 인용: "하드웨어 구조(warp[^warp], MMA 등)" / "비동기 Tensor Core 연산(WGMMA)" / "GMEM↔SMEM" / "latency SLO" / "TP/PP/EP" / "MoE 지원" → 문제: 정의 없는 약어. 대상 독자(내부 지식 없음)에게 MMA·WGMMA·SLO·EP는 낯섦 → 제안: 첫 등장 시 괄호 풀이: MMA(matrix multiply-accumulate 명령), WGMMA(warp-group 단위 MMA), GMEM/SMEM(global/shared memory), SLO(service level objective), TP/PP/EP(tensor/pipeline/expert parallelism), MoE(Mixture of Experts).
- **[A2-6] [severity: low] line 458** — 인용: "그것을 **Custom Op**으로 wrap해서 PyTorch 레벨에 다시 노출시켜야 합니다" → 문제: Custom Op이 이 덱에서 정의된 적 없음 → 제안: "(`torch.library`로 등록하는 custom op, Week 2 참고)" 한 구절 추가.
- **[A2-7] [severity: low] line 341** — 인용: "지금까지는 request 하나를 기준으로 이야기했습니다. 서빙에서는 여러 사용자의 request가 서로 다른 시점에 도착하고" → 문제: 8문장 단락, 절반으로 줄여도 내용 유지됨 → 제안: "단일 request의 Decode는 weight 전체를 읽고 토큰 하나만 계산합니다. 같은 스텝에 다른 request의 토큰을 함께 처리하면 weight를 한 번 읽어 $B$개 request에 재사용하므로 intensity가 $B$배가 됩니다. Request 사이에는 의존성이 없어 묶는 데 제약도 없습니다. 남는 문제는 어떻게 묶을 것인가, 즉 스케줄링입니다."
- **[A2-8] [severity: low] line 884** — 인용: "Dynamo는 forward가 실행하는 PyTorch 연산을 트레이싱할 뿐 코드의 출처를 가리지 않으므로, vLLM의 native 구현에도 그대로 적용됩니다" → 문제: 7문장이 한 단락에 밀집. 인용 문장은 앞 문장의 부연이라 없어도 됨 → 제안: 인용 문장 삭제, "Model을 처음 실행할 때 ~" 이후를 별도 단락으로 분리.
- **[A2-9] [severity: low] line 917** — 인용: "이 수치는 모든 model과 hardware에 일반화되는 값이 아니라 해당 benchmark 결과입니다. 강의 시점에는 dense model에서 기본 사용되고 MoE 지원은 opt-in 상태이므로 적용 범위도 함께 확인해야 합니다" → 문제: 이중 hedge → 제안: "(Qwen3-0.6B·GB200 벤치마크 기준 throughput 50%+; dense model 기본, MoE는 opt-in)" 한 괄호로 축약.
- **[A2-10] [severity: medium] line 963-971** — 인용: "여기까지가 오늘 준비한 내용입니다. 흐름을 다시 한 번 짚어 보면" → 문제: 정리 절이 85-104의 agenda와 969-971의 결론을 다시 서술해 3중 반복. 965·967은 agenda의 재진술 → 제안: 963-967 삭제하고 969·971 두 단락만 남김(A1-9 수정 적용).
- **[A2-11] [severity: low] line 602-603** — 인용: "새 값이 들어와 $m_i$가 업데이트되면, 이전 max로 스케일해 두었던 누적 분모를 새 max에 맞게 다시 보정한다" → 문제: online softmax의 rescale이 처음 나오는 곳인데 직관 설명이 없음. 이 덱에서 비유가 필요한 몇 안 되는 지점 → 제안: 한 문장 추가: "기준 환율이 바뀔 때 지금까지의 합계를 새 환율로 한 번에 재환산하는 것과 같습니다. 곱해 주는 계수가 $e^{m_{i-1}-m_i}$입니다."
- **[A2-12] [severity: low] line 284** — 인용: "Prefill에서 `I like my cat`처럼 4개 토큰을 횡적으로 동시에 처리할 때 ... Decode에서 `lot` 한 토큰을 만들 때는" → 문제: 이 예시는 231의 `<PrefillDecodeDiagram />` 내용인데 본문이 그것을 밝히지 않아 갑자기 등장한 것으로 읽힘 → 제안: "앞의 인터랙티브 다이어그램의 예시(`I like my cat` → `a lot`)로 보면".
- **[A2-13] [severity: low] line 561** — 인용: "이 한계를 한 번 넘어 saturate되면 그 시점에서 정확도를 영구적으로 잃어버립니다" → 문제: 부동소수점은 saturate하지 않고 overflow해 `inf`가 되며, 이어지는 나눗셈에서 `NaN`이 됨. 초보 독자가 정수 saturate와 혼동 → 제안: "$e^{x}$가 표현 범위를 넘으면 `inf`가 되고(fp32는 $x>88$, fp16은 $x>11$ 근처), 분모까지 `inf`가 되어 결과가 `NaN`이 됩니다."
- **[A2-14] [severity: low] line 1010, 1040** — 인용: "All the Transformer Math You Need to Know (How to Scale Your Model, JAX Scaling Book)" → 문제: 같은 링크가 두 번 → 제안: 1040 삭제.
- **[A2-15] [severity: low] line 42** — 인용: "⌐ 오늘의 초점 ¬" → 문제: 꺾쇠 의도로 보이나 `⌐`/`¬`(논리 부정 기호)라 이상하게 렌더링 → 제안: "▶ 오늘의 초점" 또는 CSS border만 사용.

## Axis 3 — 다이어그램이 설명을 뒷받침하는가

문제 없는 것(한 줄씩):
- line 126 `slide06_1.png` — "it" attention 시각화, 본문·캡션과 일치.
- line 131 `slide06_2.png` — $x_1$이 query인 scaled dot-product 흐름, 카드 ①~④와 순서 일치.
- line 184 `<Mermaid>` — Model/Data → Train → Weights → Prefill/Decode. 7노드, 교차 없음. 장식적이지만 무해.
- line 200 `slide09_1.png` — Intel NPU 타임라인, 본문 204와 일치.
- line 251 `nvidia-kv-cache.gif` — No/With KV cache 비교 애니메이션, 254와 일치.
- line 352 `slide17_1.png` — Individual/Dynamic/Continuous batching 슬롯 비교, 일치.
- line 393 `slide19_1.png` — packed-sequence causal mask, O(N²) 성장 설명에 적합.
- line 408 `slide20_1.png` — HBM 왕복 vs fused, 402-404와 일치.
- line 437 `slide21_1.png` — PagedAttention logical/physical block + block table, 431-434와 일치.
- line 447 `slide22_1.png`, line 469 `slide24_1.png`, line 475 `slide27_1.png`, line 492 `tiling.gif`, line 503/508 `fusion-*.png`, line 763 `slide32_2.png`, line 771 `slide33_1.png`, line 852 `inference-engines-*.png`, line 906/910 `vllm-anatomy-*.png`, line 934 `slide44_1.png`, line 1007 `transformer-diagram.png` — 모두 본문과 일치.

문제:
- **[A3-1] [severity: high] line 174** — 인용: `<img src="/images/06/slide07_2.png" alt="Causal Attention: 이전 단어만 고려하는 단방향 attention 구조"` → 문제: `slide07_2.png`는 `slide06_1.png`와 **바이트 단위로 동일 파일**(md5 `aa42d59f...`). 즉 "Causal Attention" 자리에 non-causal "it" 그림이 들어가 있어, 163의 "오른쪽 그림처럼 Causal Attention에서는"이 거짓이 됨. 게다가 왼쪽 `slide07_1.png`("The dog told them ... barking")는 화살표가 앞선 토큰에서만 들어와 오히려 causal처럼 보임 → 제안: slide07_2를 실제 causal(하삼각 mask 또는 좌→우 단방향 화살표) 그림으로 교체하고, slide07_1은 양방향 화살표가 있는 non-causal 그림인지 원 출처(Why Self-Attention 논문 Fig.)를 확인.
- **[A3-2] [severity: high] line 377-380** — 인용: `alt="Speculative Decoding: 작은 Draft 모델이 여러 토큰의 초안을 빠르게 생성하는 단계"` / `alt="Speculative Decoding: 큰 Main 모델이 draft 토큰들을 한 번의 forward pass로 검증하는 단계"` → 문제: 실제 slide18_1은 draft→검증→거절→target이 "Glitters" 생성까지 **전체 과정** 한 장이고, slide18_2는 **autoregressive baseline**(forward pass 1~4가 토큰을 하나씩 쌓는 그림)임. alt가 두 그림 모두와 불일치 → 제안: 18_2를 왼쪽에 두고 alt "기존 autoregressive decoding: forward pass마다 토큰 하나", 18_1 alt "Speculative decoding: draft 5토큰 → target 한 번의 forward로 검증, 3번째에서 거절 후 target이 'Glitters' 생성".
- **[A3-3] [severity: high] line 411** — 인용: `alt="Flash Attention의 tiling 구조: 타일 단위로 on-chip SRAM에 올려 계산하고 결과만 DRAM에 내보내는 방식"` → 문제: `slide20_2.png`는 tiling 구조도가 아니라 FlashAttention 논문 Fig.1 우측의 **GPT-2 attention 시간 막대그래프**(PyTorch: Matmul/Mask/Softmax/Dropout/Matmul ≈17ms vs Fused kernel ≈2ms) → 제안: alt를 "GPT-2 attention 실행 시간: PyTorch 개별 op 합 ≈17ms vs FlashAttention fused kernel ≈2ms"로 바꾸고, 404 끝에 "오른쪽 그래프처럼 GPT-2 attention이 약 7배 빨라집니다"를 붙여 그림을 본문에 연결.
- **[A3-4] [severity: medium] line 864** — 인용: `alt="vLLM에 반영된 주요 최적화 기법 개요"` → 문제: `slide42_1.png`는 "Model Support"(Transformer/MoE/multimodal/SSM/embedding/reward, Llama 3 day-1, Pixtral·Qwen2-VL) 슬라이드. 최적화 기법 개요가 아님 → 제안: alt "vLLM의 model support 범위" + 본문에 "지원 모델 폭" 한 문장, 또는 이미지 제거.
- **[A3-5] [severity: medium] line 867-876** — 인용: "앞서 다룬 중요한 최적화 기술들은 대부분 vLLM에 반영되어 있습니다." / `alt="vLLM에 반영된 최적화 기법 (1/4)"` → 문제: 네 장의 실제 내용은 (1) Hash-based automatic prefix caching, (2) Chunked prefill(Sarathi-Serve), (3) Dynamic speculative decoding(goodput 논문), (4) Multi-LoRA serving. 이 중 "앞서 다룬" 것은 speculative decoding 하나뿐이고 prefix caching·chunked prefill·multi-LoRA는 덱에서 처음 등장 → 제안: 867을 "vLLM에는 이 강의에서 다룬 것 외에도 prefix caching, chunked prefill, dynamic speculative decoding, multi-LoRA 같은 서빙 기법이 들어 있습니다"로 바꾸고 alt 4개를 각 제목으로. 출처(슬라이드 우하단 페이지 20/22/25/26 — vLLM 팀 발표자료)도 명시.
- **[A3-6] [severity: medium] line 803, 810** — 인용: `alt="OpenAI Triton: NVIDIA의 closed-source 소프트웨어 moat에 대한 오픈소스 대안 커널 프로그래밍 언어"` / `alt="Triton의 Block Programming Model과 CUDA 사이의 semantic gap을 컴파일러가 메우는 구조"` → 문제: `slide35_1.png`는 Triton 논문 Fig.3(CUDA thread grid vs Triton Range 블록 비교)이고, `slide36_1.png`는 "CUDA vs Triton" 표(Memory/Parallelism/Tensor Core/Vectorization…)임. 800의 moat 인용문과 무관하며 출처도 없음 → 제안: slide35_1은 806 "Block Programming Model" 문단 옆으로 옮기고 alt "CUDA(thread 단위) vs Triton(block/range 단위) 프로그래밍 모델 — Triton 논문 Fig.3"; slide36_1 alt "CUDA vs Triton: 메모리·병렬성·Tensor Core·vectorization을 누가 담당하는가 비교표"; 800 인용문 출처(SemiAnalysis, "How Nvidia's CUDA Monopoly in Machine Learning Is Breaking", 2023) 추가.
- **[A3-7] [severity: medium] line 229** — 인용: "Prefill은 수직(레이어 간) + 우상향(KV 전달) 의존성만 있어 같은 레이어 안의 모든 토큰을 가로로 병렬 처리할 수 있는 반면" → 문제: 바로 위 `prefill-vs-decode.png`(FlashInfer 블로그)에는 레이어가 없음. Query 행 → KV-Cache 행 화살표뿐. "수직(레이어 간)" 설명은 231의 `<PrefillDecodeDiagram />`에 해당 → 제안: 229를 "그림의 화살표는 attention입니다. Prefill은 모든 query가 한 번에 자기 이전 KV를 보고, Decode는 새 토큰 하나가 누적된 KV 전체를 봅니다"로 바꾸고, 레이어 설명은 231 아래로 이동.
- **[A3-8] [severity: medium] line 321, 324, 331** — 인용: `alt="Memory Wall: 프로세서 연산 성능과 메모리 대역폭 향상 속도의 격차를 보여주는 그래프"` / "> 출처: AI and Memory Wall" → 문제: `slide13_1.png`는 그래프가 아니라 Wulf & McKee(1994/95) 논문 **첫 페이지 캡처**이고, 그 아래 출처(AI and Memory Wall, Gholami)는 실제로는 `slide15_1.png`(HW FLOPS 60000×/20yr vs DRAM BW 100×)의 출처임. slide15_1에는 출처가 없음 → 제안: slide13_1 alt "Wulf & McKee, 'Hitting the Memory Wall'(1995) 첫 페이지"; 324 출처를 331 아래로 이동.
- **[A3-9] [severity: medium] line 777, 782** — 인용: "일반적인 프로그래머가 CUDA Programming Guide만 보고 짠 코드 - GPU 활용도 약 10% 수준" → 문제: 인용한 그림 자체가 Vanilla **1–10% fp32 peak**, CUDA Programming Guide(+coalesce, +shared memory) **30–50% fp32 peak**, CUTLASS 80–90% **tf32** peak, cuBLAS >90% tf32 peak로 적혀 있음. 본문이 그림과 다름. 또 fp32 peak와 tf32 peak를 섞어 비교하는 그림임을 본문이 안 밝힘 → 제안: "Vanilla 1–10%, Programming Guide 수준 30–50%(fp32 peak 기준), CUTLASS 80–90%, cuBLAS 90%+(tf32 peak 기준)".
- **[A3-10] [severity: low] line 272** — 인용: `alt="LLM 추론의 Roofline 분석 그래프: Memory Bound 영역의 Decode와 Compute Bound 영역의 Prefill"` → 문제: 그림(A6000 FP16 roofline, turning point ≈200 OPs/byte)에는 Prefill/Decode 점이 없음 → 제안: alt "Roofline 모델 예시(NVIDIA A6000, FP16): 왼쪽 사선이 memory-bound, 오른쪽 수평선이 compute-bound".
- **[A3-11] [severity: low] line 759-760** — 인용: `alt="CUDA가 가정한 깨끗한 SIMT GPU 아키텍처"` / "CUDA가 가정한, 깨끗한 SIMT 아키텍쳐" → 문제: 이미지는 CUDA Programming Guide의 **CPU vs GPU** 비교 그림(Control/ALU/Cache/DRAM vs 코어 격자). SIMT 자체를 보여주지는 않음 → 제안: 캡션 "CPU와 대비되는 GPU: 제어 로직 대신 단순 연산기를 대량 배치(CUDA Programming Guide)".
- **[A3-12] [severity: low] line 305** — 인용: `vllm-anatomy-pd.png` → 문제: 그림은 KV 전송 backend로 **NIXL**과 "KV connector(scheduler/worker role)"를 보여주는데 본문 300은 "NVLink·RDMA"만 언급 → 제안: 300 끝에 "vLLM에서는 KV connector가 NIXL 같은 전송 라이브러리로 이를 수행합니다(아래 그림)".
- **[A3-13] [severity: low] line 910** — 인용: `alt="vLLM KV cache manager가 고정 크기 블록 단위로 KV cache를 할당·관리하는 구조"` → 문제: 그림은 `block_size = 4` 예시, 본문 902는 "기본 16토큰" → 제안: 캡션에 "(그림은 block_size=4 예시)" 추가.
- **[A3-14] [severity: low] line 257** — 인용: `nvidia-kv-cache-append.png` → 문제: 그림에 quantization/dequant 화살표가 있는데 본문은 263에서야 KV 양자화를 언급 → 제안: 259 캡션에 "(그림의 quant/dequant는 NVFP4 KV cache 문맥, 아래 설명)" 추가.

## Axis 4 — 기술 정확성

검증해서 맞는 것: line 209 TPOT 정의, 423 KV cache 계산(LLaMA-13B: 2×2B×40×128×40 = 0.8 MB/token → 8K ≈ 6.7 GB, weight 26 GB), 427 vLLM 논문 20.4–38.2%, 617-618 online softmax recurrence, 731 FA2-on-Hopper ~35%·FA3 ~75%, 902 block_size 기본 16, 943 `--model-impl transformers`, 995 H100 bf16 ≈ 989 TFLOPS / 3.35 TB/s ≈ 295 FLOPs/byte, 1014-1017 intensity ≈ B, 1024 attention은 배치로 구제되지 않음, 1029 하한식.

- **[A4-1] [severity: high] line 345** — 인용: "아이디어는 각 layer 단계마다 동적으로 끼어들어, 같은 순서에 있는 토큰들을 그때그때 묶어 병렬로 처리하는 것입니다" → 문제: Orca의 continuous batching은 **iteration-level scheduling**(decode 스텝 = 전체 layer forward 한 번이 끝날 때마다 request를 넣고 뺌)이고, **selective batching**으로 서로 다른 위치의 토큰을 함께 묶습니다. "layer 단계마다", "같은 순서(위치)의 토큰만" 모두 사실과 다름 (confidence: high) → 제안: "아이디어는 request 단위가 아니라 decode 스텝(iteration) 단위로 스케줄링하는 것입니다. 스텝이 끝날 때마다 끝난 request는 빼고 대기 중인 request를 넣어, 시퀀스 길이나 위치가 달라도 한 배치로 묶습니다."
- **[A4-2] [severity: high] line 782-784** — 인용: "CUDA Programming Guide만 보고 짠 코드 - GPU 활용도 약 10% 수준" → 문제: A3-9 참조. 인용 슬라이드는 30–50%(fp32 peak). 10%는 Vanilla 수치 (confidence: high, 그림이 곧 근거) → 제안: A3-9의 수치로 교체.
- **[A4-3] [severity: medium] line 784** — 인용: "그래서 진짜 100%에 가까운 성능을 내려면 NVIDIA만 쓸 수 있는 그 비공개 구현을 호출해야 합니다" → 문제: cuBLAS는 누구나 호출할 수 있음. NVIDIA만 할 수 있는 것은 SASS 레벨로 **작성**하는 것. 또 2025년 이후 DeepGEMM(DeepSeek)·CUTLASS 3.x가 일부 shape에서 cuBLAS와 동급이라 "cuBLAS에만 반영" 단정은 오래된 그림(2023) 기준 (confidence: high/medium) → 제안: "이 마지막 10%는 SASS 수준 최적화(register bank conflict, control code)로, 공개 도구로는 표현되지 않아 사실상 NVIDIA가 작성한 cuBLAS를 호출하게 됩니다. (2023년 기준 그림이며, 최근 DeepGEMM 등은 일부 shape에서 cuBLAS와 동급입니다.)"
- **[A4-4] [severity: medium] line 725, 673** — 인용: "FlashAttention v2부터는 생짜 CUDA 대신 CUTLASS를 활용해" / 카드 "NVIDIA CUDA" → 문제: FA1 커널은 NVIDIA Apex의 FMHA 구현(CUTLASS 2.x 기반)을 확장한 것. FA2는 CUTLASS 3.x/CuTe로 재작성. "v1 = 생짜 CUDA"는 부정확 (confidence: medium) → 제안: "v1은 Apex FMHA(CUTLASS 2.x) 기반, v2는 CUTLASS 3.x·CuTe로 재작성해 warp 분할과 non-matmul 연산을 줄였습니다." 카드 v1 표기는 "CUDA / Apex FMHA".
- **[A4-5] [severity: low] line 679, 721** — 인용: "~25% utilization" / "GPU utilization은 약 25% 수준에 그쳤습니다" → 문제: FA2 논문은 FA1이 A100에서 "25–40% of theoretical max FLOPs/s", FA2는 "up to 73%"(50–73%) (confidence: high) → 제안: "25–40%", v2는 "50–73%".
- **[A4-6] [severity: medium] line 737** — 인용: "그 결과 Blackwell에서 v3 대비 2–3배 빠른 attention을 달성해, attention이 같은 크기의 행렬곱에 가까운 속도로 돌게 되었습니다" → 문제: FA3는 Hopper 전용(wgmma/TMA)이라 Blackwell에서 "v3 대비"는 같은 칩 비교가 아님. Hot Chips 2025 발표 수치는 B200 FA4 ≈1.6 PFLOPS vs H100 FA3 ≈0.74 PFLOPS로 HW 세대 차이가 포함된 ≈2.2×. "행렬곱에 가까운 속도"도 근거 필요 (confidence: medium; **needs verification** — arXiv 2603.05451 본문에서 비교 기준(같은 B200 위 cuDNN/Triton인지, H100 FA3인지) 확인) → 제안: 비교 기준을 명시: "B200에서 FA4는 cuDNN attention 대비 ~1.2×, H100의 FA3 대비(칩 세대 차이 포함) ~2×".
- **[A4-7] [severity: medium] line 390** — 인용: "즉 시퀀스 길이 $N$이 두 배가 되면 Attention에 들어가는 메모리와 시간이 4배로 늘어나는 구조입니다" → 문제: KV cache를 쓰는 decode에서 메모리는 $O(N)$(KV cache), $O(N^2)$인 것은 전체 생성 과정의 누적 연산 시간과, non-fused prefill의 score matrix뿐 (confidence: high) → 제안: "시간(누적 연산)은 4배, prefill에서 score 행렬을 materialize하면 그 메모리도 4배가 됩니다. (KV cache 자체는 $N$에 비례합니다.)"
- **[A4-8] [severity: medium] line 462** — 인용: "**Grid** - 대규모로 병렬 처리할 수 있는 연산기들의 집합" → 문제: CUDA에서 grid는 커널 한 번 launch에 속한 **thread block들의 집합**(소프트웨어 개념). 연산기(SM/CUDA core)가 아님. 인용 그림(slide24_1)도 "Grid 0 → Block(0,0)…"으로 그려져 있음 (confidence: high) → 제안: "**Grid / Block** - 커널 하나가 띄우는 thread block들의 집합. 각 block이 SM 하나 위에서 실행되고 자기 shared memory를 가짐".
- **[A4-9] [severity: medium] line 370-371** — 인용: "모든 토큰이 큰 모델의 예측과 일치 → 전부 accept" / "중간 어딘가에서 불일치 → 그 지점 이전까지만 accept, 이후 토큰은 폐기하고 그 지점부터 다시 draft" → 문제: greedy일 때만 맞는 단순화. 샘플링에서는 modified rejection sampling으로 확률적으로 accept하고, 거절 지점에서는 target의 보정 분포에서 토큰 하나를 **추가로** 뽑아 매 라운드 최소 1토큰이 보장됨. 바로 아래 그림(slide18_1)이 정확히 그 "Glitters" 토큰을 보여주는데 본문에 없음 (confidence: high) → 제안: 371에 "거절된 자리에서는 큰 모델이 자기 분포로 토큰 하나를 대신 뽑으므로(그림의 'Glitters'), 한 라운드에 최소 1토큰은 항상 진척됩니다. 샘플링 시에는 일치/불일치 대신 확률적 accept(rejection sampling)를 씁니다."
- **[A4-10] [severity: medium] line 653, 751** — 인용: "[^cublas]: NVIDIA가 제공하는 비공개 소스 BLAS 구현으로" / "[^simt]: Single Instruction Multiple Threads." → 문제: 두 각주 정의가 본문 어디에서도 `[^cublas]`, `[^simt]`로 참조되지 않음(grep 결과 정의 줄만 존재). remark-gfm은 참조 없는 각주를 렌더링에서 버리거나 고아 항목으로 남김 → 제안: 664 "cuBLAS" 또는 784 "cuBLAS"에 `[^cublas]`, 755 "SIMT 아키텍처"에 `[^simt]` 부착. 그러면 각주가 `## GPU 아키텍처의 진화` 절 아래(751)가 아니라 실제 첫 등장 근처에 놓이도록 정의 위치도 이동.
- **[A4-11] [severity: low] line 607, 611** — 인용: "초기값은 $m_0 = -\infty$, $d_0' = 0$입니다" / "Algorithm FlashAttention" → 문제: $o_0' = 0$ 초기값 누락. 또 이 recurrence(매 스텝 $d_i'$로 나눔)는 Zihao Ye의 "From Online Softmax to FlashAttention" 노트의 형태이고, 실제 FlashAttention은 정규화되지 않은 $\tilde{o}$와 $l$을 유지하다 마지막에 한 번 나눔 (confidence: high) → 제안: 초기값에 $o_0' = 0$ 추가, 제목을 "Algorithm: online-softmax attention (한 row, column 하나씩)"로, 출처(Zihao Ye 노트) 추가.
- **[A4-12] [severity: low] line 583, 590** — 인용: "$\sum_{j=1}^{V} e^{x_j}$" → 문제: 본문(540, 548)은 $N$개 입력을 쓰는데 카드 수식은 $V$(vocab) 사용. 표기 불일치 → 제안: $V \to N$.
- **[A4-13] [severity: low] line 838** — 인용: "CUDA 13.1에는 CUDA Tile programming model과 Python DSL인 cuTile이 추가되었습니다(C++ 지원은 CUDA 13.3부터)" → 문제: cuTile Python이 CUDA 13.1(2025-12)에 나온 것은 맞으나 C++ 프론트엔드 릴리스 버전은 확인 필요 (**needs verification** — NVIDIA CUDA Tile 문서/릴리스 노트 확인) → 제안: 확인 전까지 괄호를 "(C++ 프론트엔드는 이후 버전에서 추가)"로 완화.
- **[A4-14] [severity: low] line 384, 917, 919, 945** — 인용: "DeepSeek의 [DSpark](https://arxiv.org/abs/2607.05147)" / "Qwen3-0.6B·GB200 구성에서는 throughput이 50% 이상" / "2026년 기준 일부 architecture는 Transformers backend로만 지원" → 문제: 2026년 자료들이라 내 지식으로 검증 불가 (**needs verification** — 각 링크의 실제 제목·수치와 대조; 특히 DSpark 논문 제목과 "confidence-scheduled verification" 표현이 논문 용어인지) → 제안: 검증 전까지 수치는 링크 옆 괄호로만 두고 본문 단정 표현은 줄임.
- **[A4-15] [severity: low] line 743** — 인용: "vLLM, SGLang과 TensorRT-LLM 등에 integration되어 있습니다" → 문제: FlashInfer 논문(2501.01005)이 명시한 integration은 MLC-LLM·SGLang·vLLM. TensorRT-LLM 통합은 2025년 이후 일부 커널(sampling, MLA 등) 수준으로 알고 있음 (**needs verification**) → 제안: "vLLM, SGLang, MLC-LLM 등".
- **[A4-16] [severity: low] line 298** — 인용: "TTFT와 TPS라는 두 지표를 한 머신 위에서 동시에 최적화하기가 구조적으로 어렵다는 뜻입니다" → 문제: 방금 설명한 문제(Decode 토큰 간격이 튐)는 ITL/TPOT 지표. TPS는 throughput → 제안: "TTFT와 TPOT(ITL)".
- **[A4-17] [severity: low] line 434** — 인용: "Flash Attention과 함께 긴 시퀀스의 attention을 효율적으로 처리하는 대표적인 기법으로 널리 쓰입니다" → 문제: PagedAttention은 KV **메모리 관리** 기법이며, 커널 자체는 contiguous 대비 20–26% 느리다고 vLLM 논문이 밝힘. "attention을 효율적으로 처리"는 오해 소지 → 제안: "Flash Attention이 연산·HBM 트래픽을, Paged Attention이 KV 메모리 낭비를 줄이는, 서로 다른 축의 기법입니다."
- **[A4-18] [severity: low] line 219** — 인용: "linear layer + classification을 거쳐 다음 단어를 고르는 과정" → 문제: 표준 용어는 LM head(unembedding linear) + sampling/argmax. "classification"은 어색 → 제안: "LM head(linear)를 거쳐 다음 토큰을 sampling하는 과정".

</details>

<details><summary>Codex gpt-6-astra 전문</summary>

축 1: 자기서술과 과장된 연결문을 줄이면 좋아집니다. 축 2: Q·K·V의 역할, block 매핑, GPU 약어에 설명이 더 필요합니다.  
축 3: 이미지와 본문이 다른 사례가 여러 곳 있습니다. 축 4: 기본 방향은 타당하지만 scheduling 단위, 메모리 복잡도, 성능 비교에 중요한 오류가 있습니다.  
우선 수정 1: Causal Attention 그림을 교체하고 현재 토큰도 참조한다는 점을 명시하세요.  
우선 수정 2: Continuous batching을 layer 단위가 아닌 model iteration 단위로 설명하세요.  
우선 수정 3: Decode의 누적 연산량·KV 저장량·HBM 전송량을 구분하고, Roofline의 이상적 상한을 실제 활용률로 단정하지 마세요.

## 축 1 — AI식 문체와 비표준 용어

- **[A1-1] [severity: medium] line 32** — 인용: "답부터 먼저 드리면(어디까지나 개인적인 생각이지만 많은 분들도 비슷하게 보실 거라 생각합니다)" → 문제: 결론 앞의 긴 단서와 근거 없는 동의 추정이 요점을 늦춥니다. 뒤의 ‘큰 그림’, ‘중요한’, ‘구심점’도 같은 중요성을 반복합니다. → 제안: “LLM 추론에는 PyTorch 외에도 공개 모델, 모델 배포 도구, 커널 구현과 서빙 엔진이 필요합니다.”로 시작하세요.

- **[A1-2] [severity: medium] line 198** — 인용: "앞에서 LLM 이야기, 그리고 Prefill·Decode 이야기를 길게 한 진짜 이유는" → 문제: 앞서 설명한 이유를 다시 해설하는 자기서술입니다. 269행의 ‘이 그래프 한 장을 설명하기 위해서’도 같은 패턴입니다. → 제안: “Prefill과 Decode는 계산 특성이 다릅니다. 시간축에서 두 단계를 비교해 봅시다.”로 줄이고, 269행은 “Roofline으로 계산량과 메모리 전송량의 관계를 살펴봅시다.”로 시작하세요.

- **[A1-3] [severity: medium] line 294** — 인용: "유효 곱셈(effective multiplication)" → 문제: 설명 없이 정식 성능지표명처럼 제시하지만, 여기서 뜻하는 연산 수의 기준을 확인할 수 없습니다. Sparse 실행의 실제 FLOPs와 dense-equivalent FLOPs 중 무엇을 말하는지도 모호합니다. → 제안: “0을 건너뛴 실제 연산 수와 같은 크기의 dense 연산 수를 구분해 측정합니다.”로 기술하세요. 이 설명 전체를 대신하는 단일 표준 용어는 없으므로 명칭을 만들기보다 계산 기준을 적으세요.

- **[A1-4] [severity: low] line 723-725** — 인용: "v2: CUTLASS로 warp 파티셔닝 개선" → 문제: 바로 아래에서는 ‘warp 단위 분할(warp partitioning)’을 쓰는데 제목만 음역합니다. 901행의 ‘패딩 없는 배칭’도 같은 문장에 나오는 `padding` 및 기존 `batching` 표기와 다릅니다. → 제안: 제목은 “v2: warp 단위 작업 분할 개선”, 901행 소제목은 “Padding 없는 batching”으로 통일하세요.

## 축 2 — 이해도, 비유와 분량

- **[A2-1] [severity: medium] line 22-34** — 인용: "PyTorch만으로는 해결되지 않는 영역이 분명히 존재하고" → 문제: 참여 회사 관점, 세 질문, 생태계 소개, 결론 예고가 연달아 나오며 같은 주장을 반복합니다. 89–104행의 긴 목차까지 합치면 본론 전에 상당한 읽기 부담이 생깁니다. → 제안: “AI 가속기가 LLM 추론을 지원하려면 PyTorch 외에 무엇이 필요할까요? Decode의 병목을 살펴보고, 커널 구현과 서빙 엔진이 이를 어떻게 줄이는지 알아봅니다.”로 도입을 줄이고 세 질문과 상세 목차 중 하나만 남기세요.

- **[A2-2] [severity: medium] line 113-120** — 인용: "K(Key), Q(Query), V(Value)" → 문제: 이름을 풀어 썼지만 각 값의 역할과 shape은 설명하지 않아 이후 내적·softmax·가중합을 따라가기 어렵습니다. ‘잘 알려져 있듯이’도 요구한 독자의 배경지식보다 높게 잡습니다. → 제안: “Q는 찾을 정보의 특징, K는 비교할 특징, V는 모아 올 정보입니다. 한 head에서 Q·K·V는 토큰마다 하나씩 있는 벡터이며, Q·K의 길이가 d이면 QKᵀ는 N×N 점수표가 됩니다.”를 먼저 넣으세요. 이 짧은 역할 설명이면 추가 비유를 겹칠 필요는 없습니다.

- **[A2-3] [severity: medium] line 431-434** — 인용: "충분히 많은 request × 충분히 긴 시퀀스를 다 담을 수 있다고 *논리적으로만* 가정한 큰 주소 공간" → 문제: 개별 logical block을 전체 주소 공간으로 설명하며 추상화 수준이 섞입니다. 그림의 핵심인 요청별 block table도 본문에서 설명하지 않습니다. → 제안: “Logical block은 한 요청의 연속된 토큰 묶음입니다. Block table이 논리 번호를 실제 GPU block 번호로 바꿉니다. 그림에서는 논리 0·1·2가 실제 7·1·3에 대응합니다.”로 바꾸세요. [PagedAttention 논문 §4](https://arxiv.org/html/2309.06180v1)

- **[A2-4] [severity: medium] line 725-733** — 인용: "비동기 Tensor Core 연산(WGMMA)" → 문제: MMA·WGMMA가 정의되지 않고, TMA 각주도 GMEM·SMEM이라는 새 약어로 풀이됩니다. 뒤 강의 참조만으로는 현재 설명을 이해하기 어렵고, 880행의 TP/PP/EP도 같은 문제입니다. → 제안: “MMA는 행렬 곱·누적, WGMMA는 여러 warp가 협력하는 행렬 곱·누적 명령입니다. TMA는 global memory와 shared memory 사이의 데이터 복사를 돕습니다.”를 넣고, TP/PP/EP는 각각 tensor/pipeline/expert parallelism으로 풀어 쓰세요.

- **[A2-5] [severity: medium] line 607-640** — 인용: "$d_i', o_i'$를 $e^{m_{i-1}-m_i}$로 rescale" → 문제: 프라임 기호, 고정 query 인덱스 k, 누적 분모와 누적 출력의 의미가 충분히 정의되지 않은 채 긴 점화식이 등장합니다. 오른쪽 설명도 보정한다는 말을 반복하여 왜 보정하는지 설명하지 못합니다. → 제안: “m은 지금까지의 최대 점수, d는 그 기준으로 계산한 지수합, o는 지금까지의 정규화된 value 가중평균”이라고 정의하세요. 이어 “최대 점수가 1에서 3으로 바뀌면 기존 지수합에 e⁻²를 곱해 기준을 맞춥니다.”라는 한 예를 넣으세요.

## 축 3 — 도식과 본문의 일치

`<img>` 41개와 `<Mermaid>` 1개를 확인했습니다. PNG는 원본을 열었고 GIF는 KV cache의 주요 변화 프레임과 tiling의 전체 5프레임을 확인했습니다. 가독성 평가는 이미지 해상도와 MDX의 지정 크기를 기준으로 했으며, 브라우저에서 실제 투사 화면을 렌더링한 평가는 아닙니다.

- **[A3-1] [severity: high] line 131-149** — 인용: "② 단어별로 $qk$와 $v$를 곱함" → 문제: `slide06_2.png`는 내적 → softmax → αV → 합산 순서인데, 설명 카드는 ②에서 V를 곱한 다음 ③에서 softmax를 적용합니다. 또한 α는 정규화된 가중치이며 value 벡터와의 곱은 스칼라 배율 적용입니다. → 제안: 카드를 “① 내적·스케일링으로 점수 계산 → ② softmax로 가중치 α 계산 → ③ 각 value에 α를 곱해 합산 → ④ 출력 벡터”로 고치세요. 그림에서 생략된 1/√d도 명시하세요. [PyTorch 2.13 SDPA 소스](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/nn/functional.py#L5904)

- **[A3-2] [severity: high] line 169-176** — 인용: "Causal Attention: 이전 단어만 고려하는 단방향 attention 구조" → 문제: 오른쪽 `slide07_2.png`는 126행의 non-causal 이미지와 파일 해시까지 같으며, ‘it’이 뒤의 마침표를 참조하는 선이 있습니다. ‘이전 단어만’도 현재 위치를 포함하는 causal mask와 다릅니다. → 제안: 현재 위치와 이전 위치만 연결한 하삼각 도식으로 교체하고 본문 163행과 캡션을 “현재 토큰과 이전 토큰만 참조”로 고치세요. 왼쪽 `slide07_1.png`의 양방향 연결은 non-causal 설명에 맞습니다. [PyTorch 2.13 causal mask 구현](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/nn/functional.py#L5919)

- **[A3-3] [severity: medium] line 251** — 인용: "/images/06/nvidia-kv-cache.gif" → 문제: 재계산 영역과 cache 재사용 영역의 비교는 유용하지만, 그림은 `(QKᵀ)V = Attention Result`로 표시해 scaling·softmax가 없는 식을 완전한 attention처럼 보이게 합니다. → 제안: “계산할 행의 수를 비교한 그림이며 scaling·softmax는 생략했습니다.”라는 캡션을 넣으세요. 실제 계산 순서는 257행 그림과 연결해 설명하면 됩니다.

- **[A3-4] [severity: high] line 305** — 인용: "/images/06/vllm-anatomy-pd.png" → 문제: Prefill → KV 전송 → Decode의 기전은 맞지만, 긴 세로 그림을 높이 32rem으로 줄이면 중첩 컴포넌트와 손글씨를 읽기 어렵습니다. 아직 설명하지 않은 engine core·worker·NIXL까지 있어 PD 분리의 요점이 묻힙니다. → 제안: 본문에는 “Prefill instance → KV cache 전송 → Decode instance”의 세 상자만 사용하고 원본은 확대 가능한 참고 그림으로 옮기세요.

- **[A3-5] [severity: medium] line 321-331** — 인용: "Memory Wall: 프로세서 연산 성능과 메모리 대역폭 향상 속도의 격차를 보여주는 그래프" → 문제: `slide13_1.png`는 그래프가 아니라 Wulf·McKee 논문 첫 페이지이며 연결된 출처는 다른 2024년 논문입니다. 실제 추세 그래프인 `slide15_1.png`도 면적당 ‘Computing Density’가 아니라 정규화된 peak FLOP/s·메모리/연결 대역폭을 비교합니다. → 제안: 첫 이미지의 alt·출처를 원 논문에 맞추고, 두 번째는 “Peak 연산 처리량과 메모리·interconnect 대역폭의 증가 추세”로 설명하세요. 작은 논문 본문 대신 제목과 해당 주장만 보여주세요.

- **[A3-6] [severity: high] line 377-380** — 인용: "Speculative Decoding: 큰 Main 모델이 draft 토큰들을 한 번의 forward pass로 검증하는 단계" → 문제: 이 alt의 `slide18_2.png`는 실제로 일반 autoregressive 생성 그림입니다. `slide18_1.png`에는 draft와 검증이 모두 들어 있으며, 거절 뒤 main model이 나머지를 계속 생성하는 그림도 본문의 재-draft 루프와 다릅니다. → 제안: 두 이미지를 ‘일반 생성’과 ‘Speculative 생성’의 비교로 배치하고, speculative 쪽은 “거절 위치의 교정 토큰 생성 → 다시 draft”로 고치세요. 높이 12rem의 복잡한 그림은 확대하거나 단순화하세요.

- **[A3-7] [severity: high] line 408-411** — 인용: "Flash Attention의 tiling 구조: 타일 단위로 on-chip SRAM에 올려 계산하고 결과만 DRAM에 내보내는 방식" → 문제: `slide20_2.png`는 tiling 도식이 아니라 GPT-2 attention 시간 막대그래프이며 dropout까지 포함합니다. `slide20_1.png`는 이미 기존/FlashAttention을 모두 비교하고, m·l·O의 중간 read/write를 보여 주어 ‘최종 결과만 한 번’이라는 본문과도 다릅니다. → 제안: 첫 그림을 크게 보여 주고 해당 버전의 입출력을 설명하세요. 두 번째는 ‘논문 당시 baseline 대비 측정 예시’로 명시하거나 제거하고, 현재 PyTorch SDPA 전체의 성능 비교로 읽히지 않게 하세요.

- **[A3-8] [severity: high] line 460-469** — 인용: "Grid 연산기, DRAM, 온칩 Shared Memory 구조" → 문제: Grid는 하드웨어 연산기 집합이 아니라 한 kernel launch의 thread block 집합입니다. `slide24_1.png`의 ‘Per-block shared memory’ 바로 밑에 20 MB·19 TB/s를 적으면 한 block의 자원으로 오독하며, A100의 실제 block당 shared memory 상한은 163 KB입니다. → 제안: Grid와 이를 실행하는 SM을 구분하고, 합산 용량·대역폭과 block/SM별 한도를 분리 표기하세요. 80 GB·1.5 TB/s 조합의 정확한 GPU SKU도 **needs verification**입니다. [CUDA 프로그래밍 모델](https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/programming-model.html), [A100 메모리 한도](https://docs.nvidia.com/cuda/ampere-tuning-guide/index.html)

- **[A3-9] [severity: medium] line 489-492** — 인용: "Tiled Matrix Multiplication 애니메이션: 결과 행렬을 타일 단위로 쪼개 입력 조각을 재사용하며 곱·누적하는 과정" → 문제: `tiling.gif`의 5프레임은 output 셀을 thread·block·grid에 대응시키는 과정만 보여 줍니다. 입력 tile을 읽어 shared memory에서 재사용하거나 곱·누적하는 장면은 없습니다. → 제안: alt를 “출력 행렬의 thread·block·grid 분할”로 고치고, 입력 A·B의 tile 이동과 C 누적을 보여 주는 별도 그림을 추가하세요.

- **[A3-10] [severity: medium] line 755-764** — 인용: "CUDA가 가정한, 깨끗한 SIMT 아키텍쳐" → 문제: `slide32_1.png`는 CPU/GPU의 자원 배분을 단순화한 비교이며 CUDA의 시대별 아키텍처를 보여 주지 않습니다. `slide32_2.png`는 세대별 기능 목록으로, 큰 물음표와 미설명 DPX·SHMEM이 있어 실제 구조 변화의 설명으로는 부족합니다. → 제안: 왼쪽은 “CPU/GPU의 개략적 자원 배분”, 오른쪽은 “세대별 추가 기능”으로 이름을 맞추고, 본문에서 설명한 Tensor Core·비동기 복사·비동기 연산만 강조하세요.

- **[A3-11] [severity: high] line 864-876** — 인용: "vLLM에 반영된 주요 최적화 기법 개요" → 문제: `slide42_1.png`는 최적화 구조가 아닌 모델 지원 목록입니다. 이어지는 `slide43_1/2/3/4.png`는 각각 prefix caching·chunked prefill·dynamic speculative decoding·Multi-LoRA인데, 네 장을 높이 8rem으로 축소해 읽기 어렵고 마지막 LoRA 도식은 다중 adapter 서빙이 아닌 학습 초기화를 보여 줍니다. → 제안: 모델 지원 그림은 해당 절로 옮기고 네 최적화는 이름과 한 문장으로 소개한 뒤 한 번에 한 장씩 보여 주세요. Multi-LoRA는 요청별 adapter 선택 그림으로 바꾸고, 연구 제안과 해당 vLLM 버전의 구현 범위를 구분하세요.

- **[A3-12] [severity: medium] line 906-911** — 인용: "블록 단위로 관리되는 KV cache (Paged Attention의 구현)" → 문제: `vllm-anatomy-engine_loop.png`의 순서는 본문과 맞지만 위쪽 입력 metadata까지 높이 24rem에 넣어 글씨가 작습니다. `vllm-anatomy-kv_cache_blocks.png`는 GPU의 KV 값이 아니라 CPU의 block metadata·free queue이며, 그림의 block size=4와 본문의 기본 16도 설명 없이 다릅니다. → 제안: 루프 부분을 확대하고, 두 번째 캡션은 “CPU의 KV block 관리 정보; 예시는 block size=4”로 바꾸세요. GPU KV 저장소로의 매핑을 덧붙이면 구현 설명을 직접 뒷받침합니다.

- **[A3-13] [severity: medium] line 1007** — 인용: "Transformer 한 layer를 구성하는 모든 행렬곱의 shape과 파라미터·FLOPs를 정리한 다이어그램" → 문제: `transformer-diagram.png`는 shape와 기호표를 제공하지만 파라미터 수·FLOPs의 계산 결과는 적혀 있지 않습니다. 그림의 N은 query head 수이고 B는 sequence batch여서 앞의 N=sequence length, 뒤의 B=처리 토큰 수와 충돌하며 작은 shape 글씨도 읽기 어렵습니다. → 제안: 기호 차이를 명시하고 attention/MLP를 나눠 확대하세요. 각 부분에 직접 계산한 FLOPs·파라미터 수를 붙이거나 alt를 “Transformer layer의 행렬곱 shape”로 좁히세요.

위 문제 항목에 포함되지 않은 도식은 각각 다음과 같습니다. 가독성은 핵심 라벨과 연결을 읽는 용도로 판단했습니다.

| line | 도식 | 판정 |
|---|---|---|
| 126 | `slide06_1.png` | 적절 — ‘it’의 non-causal 참조 관계를 직접 보여 줍니다. |
| 169 | `slide07_1.png` | 적절 — 앞뒤 위치를 참조하는 양방향 연결이 non-causal 설명에 맞습니다. |
| 184–194 | Mermaid `graph LR` | 적절 — 같은 학습 weight에서 Prefill·Decode가 나오는 관계가 본문과 일치합니다. 7개 노드이며 교차선·mindmap이 없습니다. |
| 200 | `slide09_1.png` | 적절 — 로딩, 첫 추론, 반복 추론의 순서와 token 시간 구간이 맞습니다. 서버 TTFT 전체를 나타내는 그림은 아닙니다. |
| 225 | `prefill-vs-decode.png` | 적절 — Prefill의 여러 query와 Decode의 단일 query가 참조하는 KV 범위를 비교합니다. 레이어 시간축은 231행의 별도 컴포넌트입니다. |
| 257 | `nvidia-kv-cache-append.png` | 적절 — 새 K·V append와 retrieve 경로가 있으며 scaling·softmax 순서도 맞습니다. 양자화 예시임을 본문 263행이 보완합니다. |
| 272 | `slide12_1.png` | 적절 — Roofline의 두 영역과 경계를 보여 줍니다. 원 그림은 A6000 FP16의 예시이며 Prefill·Decode 측정점 자체는 없습니다. |
| 352 | `slide17_1.png` | 적절 — 요청 종료 후 빈 슬롯을 채우는 차이를 보여 줍니다. 잘못된 layer 단위 설명은 A4-1에서 지적합니다. |
| 393 | `slide19_1.png` | 적절 — causal mask의 하삼각 관계를 보여 줍니다. KV 저장량이 O(N²)이라는 근거로 사용할 수는 없습니다. |
| 437 | `slide21_1.png` | 적절 — logical block → block table → physical block의 매핑과 마지막 block의 빈 슬롯이 명확합니다. |
| 447 | `slide22_1.png` | 적절 — dense → sparse → sparse INT8 변화가 모델 경량화 설명을 뒷받침합니다. |
| 475 | `slide27_1.png` | 적절 — QKᵀ → mask → softmax → AV의 순서와 기본 shape가 맞습니다. Scaling 생략은 517행 수식과 함께 안내하세요. |
| 503 | `fusion-multi.png` | 적절 — 연산별 중간 결과의 메모리 왕복을 간단한 형태 변화로 보여 줍니다. |
| 508 | `fusion-fused.png` | 적절 — 중간 결과를 유지하여 왕복을 줄이는 구조가 대응 그림과 일치합니다. |
| 771 | `slide33_1.png` | 적절 — block·warp·thread tile의 계층과 memory/register 관계를 보여 줍니다. CUDA core GEMM 예시라는 범위로 읽으면 됩니다. |
| 777 | `How_Difficult_It_Is_to_Optimize_a_GEMM_Kernel.png` | 적절 — 최적화 단계와 수치가 읽힙니다. 본문의 수치 오독은 A4-11에서 별도로 지적합니다. |
| 803 | `slide35_1.png` | 적절 — CUDA thread와 Triton의 block 배열 표현을 비교하여 본문의 추상화 차이를 보조합니다. |
| 810 | `slide36_1.png` | 적절 — CUDA/Triton의 개발자·compiler 역할 비교표입니다. 실제 lowering 과정의 도식은 아닙니다. |
| 852 | `inference-engines-and-servers-architecture.png` | 적절 — 요청 처리, batching, model 실행, 응답과 server/engine 포함 관계가 맞습니다. |
| 934 | `slide44_1.png` | 적절 — PyTorch를 공통 인터페이스로 삼는 전략을 보여 줍니다. 자동 하드웨어 지원을 증명하지는 않습니다(A4-12). |

## 축 4 — 기술적 정확성

확신도는 각 항목에 표시했습니다. 이 파일에는 실행 가능한 Python/CUDA 코드 블록이나 dispatcher·autograd·FSDP의 상세 call stack은 없으며, API명·vLLM 경로·의사코드·수식을 검토했습니다. 대상 파일 자체에는 PyTorch 2.13 문서 링크가 없어, SDPA는 `v2.13.0` 소스로 확인했습니다.

- **[A4-1] [severity: high] line 345** — 인용: "각 layer 단계마다 동적으로 끼어들어" → 문제: Continuous batching은 일반적으로 model iteration 경계에서 batch를 재구성합니다. Orca도 전체 모델의 한 iteration을 실행하는 iteration-level scheduling을 제안하며, 임의 layer에서 새 요청을 끼워 넣는 방식이 아닙니다(확신도: high). → 제안: “모델을 한 스텝 실행할 때마다 완료된 요청을 빼고 새 요청을 넣어 다음 batch를 구성합니다.”로 교체하세요. [Orca 원 논문 설명](https://www.usenix.org/conference/osdi22/presentation/yu)

- **[A4-2] [severity: high] line 370-373** — 인용: "그 지점 이전까지만 accept, 이후 토큰은 폐기하고 그 지점부터 다시 draft" → 문제: 거절 위치의 교정 토큰 생성이 빠져 있어 그대로 따르면 같은 후보를 계속 거절할 수 있습니다. 또한 예측 token의 일치 비교는 greedy 설명이며, sampling에서는 target/draft 확률에 따른 수락과 잔여분포 sampling이 필요합니다(확신도: high). → 제안: greedy 예제라고 명시하고 “거절 위치에서 target의 토큰을 확정한 뒤 다시 draft한다. 전부 수락하면 추가 target 토큰도 생성할 수 있다”를 넣으세요. 확률 sampling은 분포를 보존하는 별도 수락 규칙이 있다고 덧붙이세요. [Speculative decoding 원 논문](https://arxiv.org/abs/2211.17192)

- **[A4-3] [severity: high] line 390** — 인용: "시퀀스 길이 $N$이 두 배가 되면 Attention에 들어가는 메모리와 시간이 4배로 늘어나는 구조" → 문제: N번 Decode의 누적 attention 연산량 O(N²)에서 동시에 필요한 메모리도 O(N²)라는 결론은 나오지 않습니다. KV cache는 길이에 선형이고 한 Decode step의 score도 O(N)이며, N×N score 저장은 모든 query를 함께 계산하는 비융합 구현의 경우입니다(확신도: high). → 제안: “Attention의 누적 연산량은 O(N²)이지만 KV cache 저장량은 O(N)입니다. Prefill에서 N×N score를 저장하는 구현은 O(N²) 중간 메모리를 사용합니다.”로 구분하세요. [Transformer 추론 비용](https://jax-ml.github.io/scaling-book/inference/)

- **[A4-4] [severity: high] line 282-291** — 인용: "Prefill은 이미 이상적인 상황이고" → 문제: Prefill/Decode의 병목은 shape·batch·dtype·kernel에 따라 달라지며, Compute Bound 영역에 있다는 사실이 peak 활용률 달성을 뜻하지 않습니다. Arithmetic intensity도 workload와 구현의 메모리 전송량에 의존하므로 ‘알고리즘의 고유 특성’이나 토큰 4개에서 정확히 4배라는 설명은 조건이 빠졌습니다(확신도: high). → 제안: “충분히 긴 Prefill의 큰 행렬곱은 compute-bound, 작은 batch Decode는 memory-bound가 되기 쉽습니다. Weight 읽기가 지배적이면 여러 토큰 처리로 intensity가 대략 비례 증가합니다.”로 바꾸고, 985–989행의 peak 기반 시간도 이상적인 하한 추정으로 표시하세요. [Roofline의 가정과 한계](https://jax-ml.github.io/scaling-book/roofline/)

- **[A4-5] [severity: high] line 404** — 인용: "최종 결과만 한 번 DRAM에 내보냅니다" → 문제: FlashAttention 전체에 대한 보장으로 읽히지만 v1 원 논문의 Algorithm 1은 K/V block마다 Q·O 및 통계량을 읽고 O를 갱신해 씁니다. 줄이는 것은 N×N score/probability 행렬의 materialization이며 모든 입력·출력의 단 한 번 접근은 아닙니다(확신도: high). → 제안: “Score와 softmax 중간 행렬 전체를 HBM에 저장하지 않고 tile별로 출력과 통계량을 갱신해 HBM 트래픽을 줄입니다.”로 바꾸고 483·489행에도 같은 범위를 적용하세요. [FlashAttention Algorithm 1 및 IO 분석](https://arxiv.org/html/2205.14135v2)

- **[A4-6] [severity: medium] line 561-563** — 인용: "분자와 분모에 같은 항이 빠지므로 결과는 변하지 않으면서" → 문제: 분자·분모에서 같은 값을 빼는 것이 아니라 각각에 공통 인자 e⁻ᵐ이 곱해져 상쇄됩니다. 앞의 ‘saturate’도 보통 부동소수점 exp overflow가 `inf`가 되는 현상과 구분해야 합니다(확신도: high). → 제안: “모든 logit에서 m=max(x)를 빼면 분자와 분모에 e⁻ᵐ이 곱해져 비율은 같습니다. 이는 exp의 overflow를 방지합니다.”로 고치세요. 실제 부동소수점에서는 underflow로 0도 나올 수 있으므로 `(0,1]`는 실수 연산 기준이라고 명시하세요.

- **[A4-7] [severity: high] line 552-605** — 인용: "메모리를 세 번이나 읽어야 한다는 큰 오버헤드가 생깁니다" → 문제: 2-pass/3-pass는 중간값을 유지하지 않는 순차 구현의 설명이지 HBM을 반드시 그 횟수만큼 읽는다는 뜻은 아닙니다. Online normalizer도 softmax 벡터 전체를 곧바로 단일 pass에 확정하는 것은 아니며, FlashAttention은 정규화된 가중합까지 함께 누적합니다(확신도: high). → 제안: “순차 baseline은 max·sum·출력 단계를 분리합니다. 행이 SRAM에 들어가면 입력을 한 번 읽고 처리할 수 있습니다. FlashAttention은 online 통계와 value 가중합을 함께 누적해 score 저장을 피합니다.”로 구분하세요. [Triton fused softmax](https://triton-lang.org/main/getting-started/tutorials/02-fused-softmax.html), [Online normalizer 논문](https://arxiv.org/abs/1805.02867)

- **[A4-8] [severity: high] line 607-621** — 인용: "$x_i \leftarrow Q[k,:]\, K^{T}[:, i]$" → 문제: 517행의 scaled attention 수식과 달리 scaling이 없고 causal 범위도 없어 이대로는 unscaled non-causal attention입니다. 또한 첫 반복에서 읽는 o₀′의 초기값이 빠졌습니다(확신도: high). → 제안: `o₀′=0`을 추가하고 `xᵢ=qₖ·kᵢ/√dₖ`, causal이면 `i≤k`로 명시하세요. 스케일링·mask를 생략한 교육용 코드라면 그 가정을 먼저 적으세요. 나머지 recurrence는 o₀′를 초기화한 수치 예제에서 직접 softmax 가중합과 일치했습니다.

- **[A4-9] [severity: medium] line 679-731** — 인용: "Removal of non-matmuls" → 문제: FlashAttention-2는 softmax 등 non-matmul 연산을 없애지 않고 줄입니다. 또한 v1·v2·v3 활용률은 서로 다른 GPU·정밀도·shape의 측정치를 포함하므로 구현 도구만 바꾸어 얻는 보편적 비율처럼 나열하면 오해합니다(확신도: high). → 제안: “Fewer non-matmul FLOPs; sequence 축 병렬화; warp 간 통신 감소”로 고치고 수치에는 “v1 25–40%, v2 50–73%: A100 논문 실험 / v3 최대 75%: H100 FP16 실험”처럼 조건을 붙이세요. [FA2 논문](https://arxiv.org/abs/2307.08691), [FA3 논문](https://arxiv.org/abs/2407.08608)

- **[A4-10] [severity: high] line 715-737** — 인용: "그 결과 Blackwell에서 v3 대비 2–3배 빠른 attention을 달성해" → 문제: 인용한 FA4 논문의 B200 BF16 비교는 최대 cuDNN 9.13 대비 1.3배, Triton 대비 2.7배이며 FA3 대비 수치가 아닙니다. exp도 SFU를 전부 대체한 것이 아니라 일부를 FMA 다항식으로 계산하고 나머지는 MUFU를 사용합니다(확신도: high). → 제안: 카드와 본문의 비교 대상을 논문대로 수정하고 “exp 일부를 FMA 연산으로 분산한다”로 고치세요. ‘Hot Chips 2025 최초 공개’는 해당 발표의 공식 자료 연결이 추가로 필요합니다(**needs verification**, 확신도: medium). [FA4 논문 §3.1.3·§5](https://arxiv.org/html/2603.05451v1)

- **[A4-11] [severity: high] line 782-784** — 인용: "일반적인 프로그래머가 CUDA Programming Guide만 보고 짠 코드 - GPU 활용도 약 10% 수준" → 문제: 바로 위 그림은 vanilla 1–10% FP32, Programming Guide 30–50% FP32, CUTLASS 80–90% TF32를 제시하므로 본문이 범주와 peak 기준을 섞었습니다. 이 자료만으로 마지막 10%가 반드시 비공개 최적화 때문이거나 cuBLAS만이 peak에 접근한다고 결론 낼 수 없습니다(수치 오독 확신도: high; 비공개 원인 추정: needs verification). → 제안: FP32/TF32 기준을 보존해 그림을 설명하고 “cuBLAS는 이 사례의 강한 기준 구현이며, 성능 차이의 원인은 별도 분석이 필요합니다.”로 끝내세요.

- **[A4-12] [severity: high] line 927-937** — 인용: "하드웨어 다양성에 대한 대응은 PyTorch 레이어를 통해 위임하는 셈입니다" → 문제: PyTorch만 지원하면 vLLM이 동작하도록 해 준다는 앞 문장들은 같은 절 후반의 platform·attention·KV·통신 구현 요구와 충돌합니다. 실제 plugin 인터페이스에도 worker·cache·attention backend 구현이 요구됩니다(확신도: high). → 제안: “vLLM은 PyTorch를 공통 tensor·실행 인터페이스로 사용합니다. 하드웨어 지원에는 추가로 vLLM platform plugin과 필요한 kernel·통신 구현이 필요합니다.”로 통합하고 888행의 ‘백엔드만 잘 받쳐 두면’도 조건을 붙이세요. [vLLM hardware plugin 구현 지침](https://docs.vllm.ai/en/latest/design/plugin_system/)

- **[A4-13] [severity: medium] line 884** — 인용: "Compile 대상은 Transformers의 modeling 코드가 아니라 vLLM 자체 model 구현입니다" → 문제: native model 경로의 설명을 모든 경로로 일반화합니다. 뒤의 Transformers backend 역시 `torch.compile`과 CUDA Graphs를 사용하므로 모델 코드 출처로 compile 대상을 구분하면 모순입니다(확신도: high). → 제안: “Native 경로에서는 vLLM 자체 model 구현을 compile합니다. Transformers backend에서는 해당 backend로 통합된 Transformers 구현에도 compile을 적용할 수 있습니다.”로 범위를 명시하세요. [Transformers backend의 compilation 지원](https://huggingface.co/blog/native-speed-vllm-transformers-backend)

- **[A4-14] [severity: medium] line 943** — 인용: "이때 vLLM은 **Transformers backend**로 자동으로 넘어갑니다(fallback)" → 문제: Native 목록에 없는 임의 모델이 모두 자동 실행되는 것은 아닙니다. Transformers backend의 attention 인터페이스 및 모델 구조 호환 조건을 만족해야 합니다(확신도: high). → 제안: “Native 구현이 없고 Transformers backend와 호환되는 모델이면 자동 fallback합니다. 그 외에는 모델 통합이 추가로 필요합니다.”로 고치고 `--model-impl transformers`도 호환성 검사를 우회하지 않는다고 명시하세요. [vLLM 지원 모델·호환 조건](https://docs.vllm.ai/en/latest/models/supported_models/)

- **[A4-15] [severity: medium] line 3-13** — 인용: "PyTorch + NPU 온라인 모임 #6 | 2025-02-05" → 문제: 강의 날짜는 2025년인데 본문에는 2026년 자료와 ‘강의 시점’의 기본 동작이 섞여 있어 재현 기준을 알 수 없습니다. 최신 기능 자체는 확인되지만, 예를 들어 MRV2의 dense 기본화는 인용한 2026-03-24 최초 발표가 아니라 이후 v0.25.0 관련 자료가 뒷받침합니다(확신도: high). → 제안: 원 강의일을 보존하고 별도의 ‘내용 갱신일’과 PyTorch·vLLM·CUDA 기준 버전을 적으세요. 917행 기본값에는 [v0.25.0 관련 공식 자료](https://github.com/vllm-project/vllm-project.github.io/blob/main/_posts/2026-07-23-glm-5.2-nvfp4-b300-pd.md), 838행에는 [CUDA Tile C++ 13.3 문서](https://docs.nvidia.com/cuda/cuda-tile-cpp-api-reference/general_principles.html)를 연결하세요.

- **[A4-16] [severity: medium] line 900** — 인용: "running 큐에 있는 요청들의 decode 토큰을 먼저 배정하고" → 문제: `running`에는 Decode뿐 아니라 이전 step에서 시작한 chunked prefill 요청도 있습니다. V1 scheduler는 요청 상태의 미계산 토큰 수를 배정하므로 `running=decode`, `waiting=prefill`로 일대일 대응하지 않습니다(확신도: high, v0.10.1 소스 확인). → 제안: “진행 중인 요청의 아직 계산하지 않은 토큰을 먼저 배정하고, 남은 예산으로 대기 요청을 받아들입니다. 진행 중인 요청에는 chunked prefill도 포함됩니다.”로 고치세요. [V1 scheduler 소스](https://github.com/vllm-project/vllm/blob/v0.10.1/vllm/v1/core/sched/scheduler.py)

- **[A4-17] [severity: medium] line 1024-1032** — 인용: "매 스텝 모델 weight 전체와 배치에 담긴 KV cache 전체를 HBM에서 읽어야 하므로" → 문제: 이 하한은 dense·full attention, HBM에 있는 working set, 일반적인 한 토큰 Decode라는 가정에서 유용합니다. MoE는 활성 expert만 사용하고 sliding-window attention은 KV의 일부만 참조하며 cache residency·prefix 공유·speculation에 따라서도 읽는 양이 달라져 보편 법칙으로 쓰면 안 됩니다(확신도: high). → 제안: 가정을 먼저 적고 일반식은 `T_step ≥ 실제 HBM read bytes / peak bandwidth`로 두세요. 시퀀스 길이가 다르면 KV 항은 `Σᵣ KV_bytes(r)`이며, 263행의 ‘전체’와 254행의 ‘append-only’에도 full-attention의 기본 설명이라는 범위를 붙이세요. [Transformer 추론의 비용 가정](https://jax-ml.github.io/scaling-book/inference/)

검산상 문제가 없었던 주요 수치: 423행의 KV 저장량은 MHA 40 heads × head dimension 128 × 40 layers × K/V × 2 bytes × 8192 tokens = **6,710,886,400 bytes ≈ 6.7 GB**이며 batch 4는 약 26.84 GB입니다. 이는 8K 저장량을 가정한 계산으로, 원본 모델의 context 지원 여부와는 별개입니다. 1014–1017행의 bf16 matmul intensity 식도 ‘입출력을 한 번씩 전송’한다는 이상적 모델과 명시된 `B ≪ D,F` 조건에서 맞습니다. 995행의 약 300 FLOPs/byte는 **H100 SXM의 dense BF16 Tensor Core 기준**으로 약 989 TFLOP/s ÷ 3.35 TB/s ≈ 295이며 SKU·sparsity 기준을 덧붙이면 됩니다. [NVIDIA H100 사양](https://www.nvidia.com/en-eu/data-center/h100/)

</details>
