# Review: 07-cpu-gpu-npu.mdx (2026-09-05)

리뷰어: Claude Fable 5.1 (서브에이전트) + OpenAI Codex `gpt-6-astra`.
대상: `src/content/lectures/07-cpu-gpu-npu.mdx` (1110행). 읽기 전용 리뷰, 수정 없음.

## TL;DR

- **AI slop / 용어**: medium. 856행에 금지 패턴 "공짜가 아닙니다" 그대로 존재. 서스펜스형 예고("자연스러운 의문이 듭니다", "비밀은 ~에 있습니다", "결정적인 한 가지 문제")가 8곳, "바로" 26회·"즉" 22회·"결국" 16회·"결정적" 9회. 비표준 용어 4개: "Reservation Table"(OOO 문맥에서 오용, MRT와 혼동), "HW Pipelining"(표준은 dynamic scheduling), "Extreme VLIW"(표준은 CGRA, 그림 자체가 CGRA라 명시), "Loop-Level / Thread-Level Pipelining"(강의 자체 프레임). 두 리뷰어 일치.
- **이해도**: medium. OOO 3단계·"6~7개 중 하나가 branch"·"Multithreading이 Memory Wall 해법"이 각 2~4회 반복. GEMM 절(1022–1089)은 warp-group, epilogue(정의보다 먼저 사용), persistent kernel, TMA multicast, Hilbert curve, II, MRT가 정의 없이 등장. 두 리뷰어 일치.
- **다이어그램**: **high**. (1) `slide16_1.png`와 `slide17_1.png`가 바이트 단위 동일 파일이며 둘 다 hazard/branch를 보여주지 않는 일반 datapath. (2) `loop_vliw` SVG는 `lw`가 빠지고 레지스터 재사용 때문에 그려진 스케줄이 틀린 결과를 냄. (3) slide33_1은 본문이 인용한 1994 논문이 아니라 1992 논문. (4) slide24_4 DFG는 루프 코드와 무관한 일반 예. (5) slide07_1은 무어의 법칙과 무관한 OOO 블록도. (6) slide15_1은 MIPS가 아니라 RISC-V datapath. 두 리뷰어 완전 일치. Codex는 추가로 blackwell_gemm_pipeline(1058)의 k가 K축 조각인지 출력 tile인지 미정의라 K축이면 k−1 epilogue가 불가능하다고 지적(high).
- **정확성**: 수치(H100 자원, roofline 295/281, TMEM 128×512×32bit, tcgen05, 5+49×2=103, matmul worklog 11단계)는 양쪽 모두 검증 통과. 개념 오류 공통 high: (a) 418행 "소프트웨어로는 iteration마다 다른 레지스터를 표현할 수 없다" — unrolling/modulo variable expansion, rotating register로 가능. VLIW가 이 문제를 어떻게 푸는지 설명 자체가 없음. (b) 837행 SIMT 정의(latency hiding이 아니라 thread별 PC/분기 + divergence mask). (c) 856행 Occupancy는 비율(resident/max), 절대 수 아님. (d) 1104행 latency hiding ≡ bandwidth 활용은 동치 아님.
- Codex만 잡은 high: 81행 무어의 법칙 "18개월"(2년), 605–660행 vertical/horizontal microcode를 RISC/VLIW ISA에 1:1 대응시킨 것, 1012행 "GPU는 HW가 작업 분할"(tile/thread/block 분할은 SW), 968–973행 "NPU는 모든 동작이 DMA 명시" 과장, 734행 systolic array vs VLIW를 배타적 선택지로.
- Fable만 잡은: 1044–1048행 고아 footnote(`[^mbarrier]`, `[^cta]`) 미참조, 1040행 "Blackwell이 SW pipeline을 HW 지원"(TMEM·single-thread MMA 추가일 뿐), 673행 "거의 모든 컴파일러가 Iterative MS"(LLVM/GCC는 Swing MS), 1075행 matmul worklog 원저자(Pranjal Shankhdhar) 크레딧 누락.

## 두 리뷰어가 일치한 항목 (우선 수정 후보)

| line | 문제 | 제안 |
|---|---|---|
| 79 | slide07_1 = OOO 블록도, 무어의 법칙 아님 | alt/본문 수정 또는 교체 |
| 90 | "점진적으로 빌드업" 메타 설명 | 삭제 |
| 121, 178 등 | "인스트럭션" 음차, "데이터 플로우", "시퀀셜", "트레이드오프" | 영문/한글 하나로 통일 |
| 176 | "MIPS 5-Stage" 제목, 그림은 RISC-V | RISC-V로 |
| 193 / 205 | slide16_1 = slide17_1 동일 파일, hazard/branch 미표시 | forwarding 경로 그림, branch bubble 그림으로 각각 교체 |
| 211/233/289 | "6~7개 중 하나가 branch" 3회 | 1회만 |
| 266-280 | 절 정리 5중(도입·표·한 줄·메타·예고) | 표 + 한 문장만 |
| 296-328 | 어셈블리 루프 의미 미설명, "unroll" 오용 | Python 대응식 추가, "두 iteration의 dynamic trace" |
| 416-420 / 485 | "SW로는 표현 불가" | unrolling(MVE)·rotating register 설명 한 단락 추가. 한계는 ISA 레지스터 수 |
| 472 | slide24_4 DFG가 루프와 무관 | 루프 7개 노드 DAG로 교체 |
| 480-481 | "분기가 사라진 직선 코드", "topological order로 동시 실행" | 분기는 검증됨. "의존 경로 없는 명령어" |
| 501-572 | loop_pipeline·loop_vliw SVG: `lw` 누락, 레지스터 충돌, 캡션 "3개" 불일치 | 동일 예제로 재작성, iteration별 레지스터, prologue/kernel/epilogue |
| 520/537/684 | "Reservation Table" | OOO는 Reservation Station/Issue Queue, RAT |
| 541-559 | OOO 3단계 4번째 재서술 + 그림 재삽입 | 두 문장으로 축약 |
| 666 | slide33_1은 1992 MICRO-25 논문 | 1994 논문으로 교체 또는 캡션 수정 |
| 682-684 | II/MRT 무정의, 두 그림이 다른 예제 | "II = 다음 iteration 시작 간격", 예제 다름 명시 |
| 686-704 | "Extreme VLIW" | CGRA로. slide35_3 논문 첫 페이지 삭제 |
| 742-750 | "Thread-Level Pipelining" | TLP / hardware multithreading |
| 786-799 | Memory Wall 보조 그림·SMT 그림 설명 없음 | 41_2 삭제/이동, SMT·coarse/fine-grained 두 문장 추가 |
| 790-794, 804/808 | 연속 문장 중복 | 각 1문장 |
| 837 | SIMT = latency hiding 특화 이름 | thread별 PC·분기, divergence mask, warp 단위 발행 |
| 856-858 | "공짜가 아닙니다", Occupancy = 절대 수, 255 vs 256 | 사실부터. "resident/max 비율, 8/64=12.5%" |
| 876 | slide47_1 "FLOPS" → 실제 Int8 TOPS + sparsity | alt/본문 수정 |
| 905 | slide49_1 위치·alt(overhead가 아니라 메커니즘) | 850행으로 이동 |
| 962-969 | NPU 메모리 계층 L1/L2 DMA 출발·도착 미표시 | 화살표 + 한 문장 정의 |
| 979-997 | 두 NPU SVG 유닛명 불일치, 큐 라벨 없음, "4 MB" 근거 없음 | 통일, 라벨, 출처 |
| 1022-1056 | epilogue 사용 후 정의, warp-group/MMA/tile 무정의 | 정의를 1030 절 첫머리로 |
| 1044-1048 | `[^mbarrier]`, `[^cta]` 참조 없음 | 본문에 참조 삽입 |
| 1077-1089 | persistent kernel/cluster/multicast/Hilbert 무정의 | 각주 3개 |
| 1104 | latency hiding ≡ bandwidth 활용 | 인과(Little's law)로 |

## 한쪽만 제기한 항목 (검토 필요)

- **Codex A4-1 (high) line 81**: 무어의 법칙 "18개월마다" → 약 2년.
- **Codex A4-5 (high) line 605-660**: microcode vertical/horizontal 구분을 RISC/VLIW ISA 양분에 그대로 적용. VLIW도 decode함.
- **Codex A4-6 (high) line 734-737**: systolic array와 VLIW는 다른 층위. Tensor Core 내부 = systolic은 needs verification.
- **Codex A4-9 (high) line 968-973**: "모든 동작 DMA 명시, 정적 scheduling" 과장. 비동기 완료 동기화 존재. GPU도 SW-managed SMEM.
- **Codex A4-10 (high) line 1012**: 표 "작업 분할: GPU=HW 동적" → tile/block 분할은 SW. HW는 배치·scheduling.
- **Codex A3-16 (high) line 1058**: pipeline 그림의 k 정의(K-step vs 출력 tile). K-step이면 k−1 epilogue 불가.
- **Codex A4-11/13 line 1026, 890**: "Tensor Core 10배", "L2 ~5.5TB/s 실측" 조건·출처 없음. HBM 3.35TB/s는 SXM 한정.
- **Codex A3-10 line 821**: slide44_1의 "Deep pipelines (hundreds of stages)" needs verification.
- **Fable A4-4 line 1040**: "Blackwell이 HW 차원에서 직접 지원" → SW 구조 그대로, TMEM·single-thread issue 추가.
- **Fable A4-6 line 563/713**: VLIW가 branch prediction을 "버릴 수 있다" → Itanium은 정교한 predictor 보유.
- **Fable A4-7 line 673**: "거의 모든 컴파일러가 Iterative MS" → LLVM MachinePipeliner/GCC는 Swing MS.
- **Fable A4-8 line 1075**: worklog 원저자 Pranjal Shankhdhar 크레딧. Codex도 "재인용" 언급.
- **Fable A4-2 line 414**: "(논리적) 레지스터" → renaming은 물리 레지스터 매핑. 487행과 모순.
- **Fable A4-12 line 771**: Dennard scaling 붕괴 설명(전압 하한·leakage) 모호.
- **Fable A2-9 line 858**: Little's law 한 줄(600ns × 3.35TB/s ≈ 2MB in-flight)로 Occupancy와 roofline 연결 제안.

## 출처 검증 (2026-09-05)

검증 방법: `curl -sL`로 PDF 원문 다운로드 후 `pdftotext -layout`로 본문 추출(Rau MICRO-25 논문, Intel PDF, TI C6000 PDF), NVIDIA/GCC/CUTLASS/H100 문서 페이지는 `curl`+`WebFetch` 병행, 논문 서지사항은 `WebSearch`로 원문 출판사(ACM/IEEE/Springer/dblp) 대조, Gordić·Pranjal 블로그는 `curl`로 원문 HTML을 받아 `python3 -re`로 본문 텍스트를 추출해 표 수치를 직접 대조. 429/403 응답은 `sleep 10` 후 1회 재시도. 이 문서는 PyTorch 소스/디스패처 인용이 없어(Codex 자백, line 332) `torch/*` 파일:줄 인용 검증 대상은 없음.

| # | 인용 위치 | 출처 | 접근 | 판정 | 근거 (인용/줄 번호) |
|---|---|---|---|---|---|
| 1 | 병합요약 L10, L33, L78 (Fable TL;DR) | slide33_1 = "1994 논문"이 아니라 "1992 논문"(암묵적 서지 인용) | 200 (PDF) | 지지 | rau_micro25.pdf 본문: "Code Generation Schema for Modulo Scheduled Loops / B. Ramakrishna Rau, Michael S. Schlansker, P. P. Tirumalai" + "0-8186-3175-9/92 ⓒ1992 IEEE"(줄 74) → MICRO-25(1992) 확인. WebSearch로 "MICRO-25, Portland, Dec 1992, pp.158-169" 재확인 |
| 2 | 병합요약 L13, L63 | Pranjal Shankhdhar 크레딧 누락 주장 | 200 | 지지 | Gordić 블로그 원문: "I highly recommend Pranjal's excellent blog post... I'll be following kernels from his worklog... Pranjal managed to outperform cuBLAS SOTA — hitting ~107% of cuBLAS" → Gordić 본인은 명시적으로 크레딧하는데, 강의 인용문(1075행)은 "Aleksa Gordić이 정리한"만 쓰고 원저자 Pranjal을 안 씀 |
| 3 | Fable Axis3 "문제없는것" L157 (slide48_1) | Gholami et al., "AI and Memory Wall" | 200 | 지지 | arXiv 2403.14123 초록/요약: "Peak compute has increased by 60,000x over the past 20 years, as opposed to 100x for DRAM" — 본문 882행 "60000x vs 100x/20yrs" 수치와 정확히 일치 |
| 4 | Fable A3-4 L169 | Rau·Schlansker·Tirumalai, "Code Generation Schema for Modulo Scheduled Loops", MICRO-25, 1992 | 200 (PDF) | 지지 | 위 #1과 동일 근거. 저자·제목·연도(1992)·"논문 첫 페이지"라는 이미지 성격까지 일치 |
| 5 | Fable A3-7 L175 | Park et al., "Edge-centric Modulo Scheduling for CGRAs", **CASES 2008** | 200 | 불일치(서지 오류) | WebSearch: "Edge-centric modulo scheduling for coarse-grained reconfigurable architectures" (H. Park, K. Fan, S. Mahlke, T. Oh, H. Kim, H. Kim), **Proceedings of PACT '08 (17th Int'l Conf. on Parallel Architectures and Compilation Techniques)**, pp.166-176 — 논문은 실재하고 저자·제목·주제(CGRA modulo scheduling)는 맞지만 학회명이 CASES가 아니라 **PACT**임(Fable 리뷰 자체의 서지 오류) |
| 6 | Fable A3-11 L183 | Wulf & McKee, "Hitting the Memory Wall" (1994) | 200 | 부분지지 | WebSearch: UVA CS 기술보고서(1994)로 처음 배포, 정식 학술지 게재는 ACM SIGARCH Computer Architecture News Vol.23 No.1 (**1995**). "1994"는 원 tech report 연도로는 맞으나 정식 출판 연도는 1995 |
| 7 | Fable Axis4 검증통과 L197 (Rau 1994 MICRO-27) | Rau, "Iterative Modulo Scheduling", MICRO-27, 1994 | 200 | 지지 | WebSearch: "Iterative modulo scheduling: an algorithm for software pipelining loops", Proceedings of the 27th Annual International Symposium on Microarchitecture(MICRO-27), San Jose, pp.63-74 (1994). HP tech report 사본(HPL-94-115.pdf)도 확인됨 |
| 8 | Fable Axis4 검증통과 L197 (Tomasulo 1967) | Tomasulo, 1967, IBM 360/91 | 200 | 지지 | WebSearch: "An Efficient Algorithm for Exploiting Multiple Arithmetic Units", IBM J. Res. Dev. Vol.11 No.1, pp.25-33 (Jan 1967) — "System/360 Model 91"의 floating-point unit 대상, register renaming·reservation station·CDB 도입을 설명 |
| 9 | Fable A4-7 L211 | LLVM MachinePipeliner / GCC SMS는 Swing Modulo Scheduling(Llosa et al. 1996) 기반 | 200 | 지지 | GCC 문서(`-fmodulo-sched`): "Perform **swing modulo scheduling** immediately before the first scheduling pass..." / WebSearch: LLVM `MachinePipeliner`는 `SwingSchedulerDAG` 클래스로 구현되며 Llosa, González, Ayguadé, Valero, "Swing module scheduling: a lifetime-sensitive approach", PACT 1996 기반임을 확인 |
| 10 | Fable A4-8 L213 | Pranjal Shankhdhar, "Outperforming cuBLAS on H100: a Worklog"(2024-12), 11단계 수치·107% | 200 | 지지 | `cudaforfun.substack.com` 원문: 저자 Pranjal Shankhdhar, kernel 1→11 TFLOP/s = 32/317/423/498/**610**(2-consumer 단계, 뒤에 631로 추가 개선됨)/660/704/734/747/758/764, "hitting ~107% of cuBLAS" 확인. Gordić 요약표는 "610"만 인용(631 단계는 생략) — 강의가 인용한 Gordić 표와는 정확히 일치 |
| 11 | Codex A3-5 L274 | https://www.cs.princeton.edu/courses/archive/fall99/cs597d/restricted/papers/rau_micro25.pdf | 200 (직접 PDF, 12p) | 지지 | `pdftotext` 결과 1행: "Code Generation Schema for Modulo Scheduled Loops / B. Ramakrishna Rau, Michael S. Schlansker, P. P. Tirumalai / Hewlett Packard Laboratories" + "1992 IEEE" 저작권 표시 — Codex 주장(1992년 논문, Rau의 다른 논문)과 정확히 일치 |
| 12 | Codex A3-16 L296 | https://docs.nvidia.com/cutlass/latest/media/docs/cpp/efficient_gemm.html | 200 | 지지 | 페이지 본문: "one iteration of this loop is one 'stage'"로 k가 K축 reduction step임을 명시. 반면 persistent Ping-Pong 커널은 "epilogue of one consumer warp group to be overlapped with the math operations of the **other** consumer warp group"라고 해 epilogue 중첩은 K-step이 아니라 **출력 tile 간**에 일어남 — Codex가 지적한 "k가 K-step인지 출력 tile인지 애매하다"는 구분이 CUTLASS 문서에도 실제로 존재함을 뒷받침 |
| 13 | Codex A4-1 L334 | https://www.intel.com/.../intel-labs-multi-core-revolution-paper.pdf (무어의 법칙 ~2년) | 403 (재시도 후에도 403) | 접근불가(403) | `curl` 1차 403, `sleep 10` 후 재시도도 403(Akamai "Access Denied", Reference #18.cf354317...) — 내용 확인 불가. 다만 "2년마다 2배"라는 무어의 법칙 표준 서술 자체는 별도 검증 없이도 통용되는 정설(참고용) |
| 14 | Codex A4-3 L338 | https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html#index-fmodulo-sched | 200 | 지지 | 문서 원문: "Perform swing modulo scheduling immediately before the first scheduling pass. This pass looks at innermost loops and reorders their instructions by overlapping different iterations." → GCC가 Iterative MS가 아니라 Swing MS를 쓴다는 Codex 주장과 일치 |
| 15 | Codex A4-5 L342 | https://software-dl.ti.com/trainingTTO/.../op6000_student_guide_v1.51.pdf (TI C6000 VLIW decode) | 200 (PDF) | 지지 | `pdftotext` 결과(4283-4296행): "Decode (D-Stage)... During the DP phase, the CPU intelligently routes... to one of the eight functional units **where the instruction is decoded**" — VLIW(TI C6x)도 명령어를 decode한다는 Codex 주장과 일치 |
| 16 | Codex A4-6 L344 | https://docs.jax.dev/en/latest/pallas/tpu/details.html (TPU systolic array) | 429(1차), 429(재시도) | 접근불가(429) | `curl`·`WebFetch` 모두 1차 429, `sleep 10` 후 재시도도 429 — 내용 확인 불가 |
| 17 | Codex A4-7 L346 | https://docs.nvidia.com/cuda/parallel-thread-execution/#simt-architecture | 200 | 지지 | PTX ISA 문서 "3.1 A Set of SIMT Multiprocessors": "A key difference is that SIMD vector organizations expose the SIMD width to the software, whereas SIMT instructions specify the execution and branching behavior of a single thread"·"each scalar thread executes independently with its own instruction address and register state"·분기 시 "disabling threads that are not on that path" — latency hiding가 아니라 per-thread PC/분기가 SIMT의 정의라는 Codex/Fable 주장과 정확히 일치 |
| 18 | Codex A4-8 L348 (①) | https://docs.nvidia.com/cuda/archive/11.4.4/cuda-occupancy-calculator/index.html | 200 | 지지 | 원문: "The multiprocessor occupancy is **the ratio of active warps to the maximum number of warps** supported on a multiprocessor" — Occupancy가 절대 수가 아니라 비율이라는 주장과 일치 |
| 19 | Codex A4-8 L348 (②) | https://docs.nvidia.com/cuda/hopper-tuning-guide/index.html#occupancy | 200 | 지지 | 원문: "The maximum number of registers per thread is **255**"·"maximum number of concurrent warps per SM remains... 64" — 강의의 255(256 아님)·64 warp 상한과 정확히 일치 |
| 20 | Codex A4-9 L350 (①, jax.dev 중복) | https://docs.jax.dev/en/latest/pallas/tpu/details.html | 429(1차), 429(재시도) | 접근불가(429) | #16과 동일 URL, 동일하게 429 |
| 21 | Codex A4-9 L350 (②) | https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/async-copies.html | 200 | 지지 | 원문: "LDGSTS must provide a signal when the operation is complete... can use shared memory barriers or pipelines"·TMA는 "barrier how many transactions(tx) are expected to arrive" — 비동기 완료 동기화(barrier/transaction count)가 존재한다는 Codex 주장과 일치 |
| 22 | Codex A4-10 L352 | https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/programming-model.html | 200 | 지지 | 원문: 커널 launch 시 "execution configuration which specifies the grid and thread block dimensions"는 프로그래머가 지정, 하드웨어는 "All threads of a thread block are executed in a single SM"로 배치만 담당 — 작업 분할(tile/thread/block)은 SW, 배치는 HW라는 Codex 주장과 일치 |
| 23 | Codex A4-13 L358 | https://www.nvidia.com/en-us/data-center/h100/ | 200 | 지지 | 스펙표: H100 SXM = "3.35TB/s", H100 NVL(PCIe 계열) = "3.9TB/s" — 3.35TB/s가 SXM 전용 수치이고 다른 폼팩터와 다르다는 Codex 주장과 일치 |
| 24 | Codex 마무리 L360 (①) | https://docs.nvidia.com/cuda/hopper-tuning-guide/index.html#tensor-memory-accelerator | 200 | 지지 | 원문: "TMA allows applications to transfer 1D and up to 5D tensors **between global memory and shared memory, in both directions**" — 강의 본문 TMA 설명과 일치 |
| 25 | Codex 마무리 L360 (②) | https://docs.nvidia.com/cuda/parallel-thread-execution/#tensorcore-5th-generation-family-instructions | 200 | 지지 | PTX 원문: "The instruction tcgen05.mma has **single thread semantics**... a single thread issuing the tcgen05.mma will result in the initiation of the whole matrix multiply"·".cta_group::2 Issue from a single thread from the CTA-Pair"·tcgen05.commit은 "**mbarrier based completion mechanism**" — 강의의 single-thread issue/`cta_group::2`/mbarrier 서술과 정확히 일치 |
| 26 | Codex 마무리 L362 | https://www.aleksagordic.com/blog/matmul | 200 | 지지 | 원문 표: "317 Increase output tile size / 423 Pipeline... / 498 Tile growth... / 610 Persistent kernels / 660 Faster PTX barriers / 704 Clusters; TMA multicast / 734 Micro-optimizations / 747 TMA async stores / 758 Hilbert-curve scheduling / 764" — 강의 1079-1089행의 32→317→423→498→610→660→704→734→747→758→764 순서와 정확히 일치. "~107% of cuBLAS"도 확인 |
| 27 | Fable A1-5 L94 (부기) | "Reservation Station"(Tomasulo) 용어 귀속 | 200 | 지지 | Tomasulo 1967 논문의 핵심 혁신 중 하나가 "reservation stations for all execution units"(WebSearch 요약) — Reservation Station을 Tomasulo 알고리즘의 용어로 부르는 것은 정확함 |

### 요약
- 총 27건: 지지 23 / 부분지지 1 / 불일치 1 / 무관 0 / 접근불가 3(같은 URL 두 개, 총 접근시도 2개 도메인: Intel PDF 1건, jax.dev TPU 문서 2회 인용)
- **#5 (Fable A3-7, CASES 2008)**: 실제 학회는 PACT 2008이 아니라 **PACT '08**(CASES 아님). Park et al. 논문 자체의 존재·주제·저자는 맞으나, 리뷰가 붙인 학회명이 틀렸으므로 review 문서 자체를 "CASES 2008" → "PACT 2008"로 정정 필요.
- **#6 (Fable A3-11, Wulf & McKee "1994")**: UVA 기술보고서 연도는 1994가 맞지만, 흔히 인용되는 ACM SIGARCH 정식 게재는 1995. 각주/캡션에 "1994년 기술보고서(1995년 ACM 게재)"로 쓰면 더 정확.
- **#13, #16, #20 (접근불가)**: Intel PDF(403)와 docs.jax.dev TPU 페이지(429, 2회 인용)는 이번 세션에서 내용을 확인하지 못했음. 다만 이 인용들이 뒷받침하는 핵심 주장(무어의 법칙 2년 주기는 정설, TPU MXU가 systolic array라는 것도 일반적으로 알려진 사실)은 다른 독립 출처로 대체 검증 가능하니, 리뷰 판정 자체를 낮출 근거는 아님 — 재확인이 필요하면 접근 가능한 시점에 재시도 권장.
- 나머지 23건은 모두 원문과 정확히 일치(지지)하며, 특히 PTX SIMT/occupancy/tcgen05 정의, GCC/LLVM Swing MS, CUDA 프로그래밍 모델의 SW 작업분할, H100 SXM 3.35TB/s 한정, Gordić↔Pranjal 크레딧 관계 등 두 리뷰어의 기술 정확성 지적은 모두 1차 문서로 뒷받침됨.

## 원문 리뷰

<details><summary>Fable 5.1 전문</summary>

# Review: `src/content/lectures/07-cpu-gpu-npu.mdx` (Week 7: CPU / GPU / NPU)

## TL;DR

- **Axis 1 (AI slop/용어)**: medium. 서사형 예고 문장("여기서 자연스러운 의문이 듭니다", "비밀은 ~에 있습니다")과 "바로"(26회)·"즉"(22회)·"결국"(16회)·"결정적"(9회)이 과다하고, 856행에 금지 패턴 "공짜가 아닙니다"가 그대로 있음. "Reservation Table", "HW Pipelining", "Extreme VLIW" 등 비표준 용어 3건.
- **Axis 2 (이해도/장황함)**: medium. OOO→VLIW 구간에서 같은 내용(OOO 3단계, "6~7개 중 하나가 branch", "Multithreading이 Memory Wall 해법")이 2~3회 반복. 마지막 GEMM 절은 정의 없이 쓰이는 용어(warp-group, epilogue 선행 사용, persistent kernel, TMA multicast, Hilbert curve)가 많아 대상 독자가 따라가기 어려움.
- **Axis 3 (다이어그램)**: **high**. `slide16_1.png`와 `slide17_1.png`가 바이트 단위로 동일한 파일이며 둘 다 hazard/branch를 보여주지 않는 일반 5-stage datapath. `loop_vliw` SVG는 `lw`가 빠지고 레지스터 재사용 때문에 그려진 스케줄이 틀림. `slide33_1`은 본문이 인용한 1994 논문이 아니라 1992 논문. Mermaid 블록은 없음.
- **Axis 4 (기술 정확성)**: 수치(H100 register/SMEM/L2/HBM, roofline 295/281 FLOPs/byte, TMEM 128×512×32bit, tcgen05 semantics)는 검증 결과 정확. 문제는 개념 쪽: (a) "소프트웨어로는 iteration마다 다른 레지스터를 표현할 수 없다"(418)는 과장이고 VLIW가 false dependency를 어떻게 푸는지(modulo variable expansion / rotating register) 설명이 아예 없음, (b) SIMT 정의(837)가 틀림, (c) Blackwell이 SW pipeline을 "하드웨어 차원에서 직접 지원"(1040)한다는 서술은 과장.
- **가장 중요한 수정 3개**: ① 193/205행 중복 이미지 교체, ② 416–420행 + `loop_vliw` SVG를 함께 고쳐 VLIW의 레지스터 문제 해결법(unrolling/MVE, rotating registers) 한 단락 추가, ③ 1044–1048행 고아 footnote(`[^mbarrier]`, `[^cta]`) 참조 연결 및 GEMM 절 용어 정의.

---

## Axis 1 — AI slop and invented terminology

- **[A1-1] [severity: high] line 856** — 인용: "\"갈아 끼울 Warp이 충분히 많다\"는 전제는 공짜가 아닙니다." → 문제: 금지 패턴("공짜는 아닙니다")과 동일한 극적 프레이밍. → 제안: "Warp을 많이 올리려면 하드웨어 자원이 필요합니다. SM이 동시에 유지할 수 있는 in-flight Warp 수를 **Occupancy**라고 부르며, …"로 바로 사실부터 시작.

- **[A1-2] [severity: medium] line 485** — 인용: "여기서 자연스러운 의문이 듭니다. … 비밀은 하드웨어가 ISA로 노출된 것보다 훨씬 많은 레지스터를 실제로 가지고 있다는 점에 있습니다." → 문제: 서스펜스형 예고 + "비밀은". 같은 형식이 77("한 가지 자연스러운 질문이 생깁니다"), 162("한 가지 짚어볼 만한 점이 있습니다"), 332, 418("결정적인 한 가지 문제가 있습니다"), 512("흥미로운 점은"), 647, 656("진짜 결정적 차이")에서 반복. → 제안: 예고 문장을 삭제하고 사실 문장으로 시작. 예: "하드웨어는 ISA가 노출하는 것보다 훨씬 많은 레지스터를 가지고 있습니다."

- **[A1-3] [severity: medium] line 660** — 인용: "즉 인코딩 방식의 선택은 단순한 비트 배치 문제가 아니라, 하드웨어와 소프트웨어 사이의 책임을 어디에서 끊을 것인가라는 설계 철학의 선택입니다." → 문제: "단순히 ~가 아니라 … 철학" 패턴. 같은 절 656–660이 이미 한 말을 세 문장으로 반복. → 제안: 656–660을 두 문장으로 축약: "Horizontal encoding은 각 비트가 어느 유닛에 연결되는지가 ISA에 드러나므로 컴파일러가 하드웨어 구조를 알아야 합니다. Vertical encoding은 디코더가 그 디테일을 흡수합니다. 앞의 ①/② 접근이 정확히 이 차이입니다."

- **[A1-4] [severity: medium] line 783** — 인용: "문제는 현대 프로세서에서 가장 큰 성능 병목이 바로 이 오프칩 메모리(DRAM)에 접근할 때의 Bandwidth와 Latency라는 점입니다. … 결국 프로세서 설계의 과제는 한 줄로 요약됩니다." → 문제: 한 단락에 "바로"×2, "결국", "한 줄로 요약". 파일 전체에 "바로" 26회, "즉" 22회, "결국" 16회, "핵심" 13회, "결정적" 9회. → 제안: 강조 부사를 절반 이하로 줄이고, "한 줄로 요약됩니다/한 줄로 줄이면"(274, 783, 829) 같은 closer는 각 절당 최대 1회.

- **[A1-5] [severity: medium] line 520** — 인용: "**Reservation Station / Reservation Table** - 각 명령어가 어떤 Physical Register의 값을 기다리고 있는지 태깅해 두는 테이블." → 문제: "Reservation Table"은 OOO 용어가 아니라 modulo scheduling의 MRT(Modulo Reservation Table) 용어. 537, 684에서도 OOO 자료구조로 "Reservation Table"을 씀. → 제안: OOO 쪽은 "Reservation Station"(Tomasulo) 하나로 통일하고, "Renaming Table"은 "Register Alias Table(RAT) / rename map"으로 표기.

- **[A1-6] [severity: medium] line 931-941** — 인용: "HW Pipelining … SW Pipelining" (2×2 표 행 라벨) → 문제: "SW pipelining"은 표준어지만 "HW pipelining"은 OOO를 가리키는 용어로 존재하지 않음. 표준 대비는 dynamic scheduling vs static scheduling. → 제안: 행 라벨을 "동적 스케줄링 (HW)" / "정적 스케줄링 (SW, software pipelining)"으로.

- **[A1-7] [severity: medium] line 686-694** — 인용: "Reconfigurable Architecture (Extreme VLIW)" → 문제: 자체 고안 용어. 690–692의 이미지 자체가 "CGRA (Coarse-Grained Reconfigurable Architecture)"라고 명시하고 있음. 표준 용어가 존재함. → 제안: 제목을 "CGRA (Coarse-Grained Reconfigurable Architecture)"로 바꾸고, 본문에서 "VLIW의 정적 스케줄링 계보를 공간 축(FU 배열)까지 확장한 것"으로 설명. "Extreme VLIW"는 괄호 속 비유로만 남김.

- **[A1-8] [severity: low] line 283 / 742** — 인용: "## Loop-Level Pipelining" / "## Thread-Level Pipelining: CPU의 전환" → 문제: "Loop-level pipelining", "Thread-level pipelining"은 강의 자체의 프레이밍이지 표준어가 아님(표준: software pipelining / ILP, TLP·multithreading). 원 강의 구조이므로 유지는 가능하나 독자가 검색해도 안 나옴. → 제안: 24행 소개에 한 문장 추가: "교과서 용어로는 각각 pipelining(ILP), software pipelining/dynamic scheduling, multithreading(TLP)에 해당합니다."

- **[A1-9] [severity: low] line 121, 178, 187, 207, 244** — 인용: "인스트럭션 메모리", "ISA(인스트럭션 셋)", "인스트럭션 디코드(ID)" → 문제: 같은 문서에서 "Instruction Fetch/Decode"(121–125)는 영문, 본문은 음차. → 제안: "instruction memory", "instruction decode"로 통일.

- **[A1-10] [severity: low] line 492, 516, 518, 523** — 인용: "데이터-플로우 그래프", "데이터 플로우 그래프" → 문제: 481행은 "data-flow graph(DAG)", 이후는 음차, 표기도 2종. 495 "시퀀셜 코드", 595 "시퀀셜한", 735 "프로그래머빌리티", 1026 "트레이드오프"(858은 trade-off)도 같은 문제. → 제안: 영문 "data-flow graph", "sequential", "programmability", "trade-off"로 통일.

## Axis 2 — Comprehensibility, ELI5 balance, verbosity

- **[A2-1] [severity: high] line 416-420** — 인용: "따라서 소프트웨어(컴파일러나 어셈블리)가 \"iteration마다 다른 레지스터를 써라\"라고 표현할 방법 자체가 없습니다." → 문제: 이 문장이 OOO/VLIW 분기의 전제인데, 이후 VLIW 절(539–684)은 VLIW가 이 false dependency를 **어떻게** 푸는지 한 번도 말하지 않음. 독자는 "표현이 안 된다면서 컴파일러가 어떻게 겹치지?"에서 막힘. → 제안: 563행 뒤에 한 단락: "레지스터 문제는 컴파일러가 루프를 unroll해 iteration마다 다른 architectural register를 배정(modulo variable expansion)하거나, Cydra-5·Itanium처럼 ISA에 rotating register file을 두어 해결합니다. 즉 ISA 레지스터 수가 허용하는 범위에서 SW도 renaming을 표현할 수 있습니다."

- **[A2-2] [severity: medium] line 541-559** — 인용: "#### 다시 보는 OOO의 Loop Pipeline, 그리고 그 비용 … 하드웨어 안에서 매 cycle 다음과 같은 일을 동시에 해내고 있었습니다." → 문제: 480–492, 520–523, 533–537에서 이미 세 번 설명한 OOO 3단계를 네 번째로 재서술하고 같은 SVG(loop_pipeline)를 두 번째로 삽입. → 제안: 소절을 두 문장으로 축약: "OOO는 branch prediction, renaming, 동적 data-flow graph 유지를 모두 하드웨어가 매 cycle 수행합니다. 명령어 윈도우를 키울수록 이 장치와 misprediction rollback 비용이 커집니다." 그림 재삽입 삭제.

- **[A2-3] [severity: medium] line 211, 233, 289** — 인용: "Integer program 기준으로 보통 6~7개 명령어 중 하나가 Branch이기 때문에" → 문제: 동일 사실이 211, 233("6~7개 명령어 중 하나는 Branch일 정도입니다"), 289("6~7개 명령어 중 하나꼴로")에서 3회 반복. → 제안: 211에서 한 번만 말하고 233·289는 "앞서 본 것처럼 branch는 빈번하므로"로 참조.

- **[A2-4] [severity: medium] line 790-794** — 인용: "이 Memory Wall을 가장 효과적으로 풀어내는 방법으로 잘 알려진 것이 바로 **Multithreading** 입니다." / "앞에서 말한 것처럼, Memory Wall 문제를 가장 효과적으로 풀어낼 수 있는 방법 중 하나가 Multithreading입니다." → 문제: 연속된 두 문장이 같은 말. 804/808("2000년대에 … 큰 변화" 2회), 744/746(도입 문단 2회)도 동일 패턴. → 제안: 각 쌍에서 한 문장 삭제. 792 소절은 799 한 문장 + 그림만 남기고, 그림이 보여주는 SMT/coarse·fine-grained를 설명하는 두 문장을 추가(아래 A3-13 참조).

- **[A2-5] [severity: medium] line 1022, 1036, 1056** — 인용: "load·MMA·epilogue를 overlap합니다" (1022) … "여기서 **epilogue**를 먼저 정의해 두겠습니다." (1056) → 문제: epilogue를 1022, 1036에서 먼저 쓰고 1056에서 "먼저 정의"한다고 함. 순서가 뒤집혀 있음. mainloop도 1056에서 정의 없이 등장. → 제안: 1056의 정의 단락을 1030 소절 첫머리로 이동: "GEMM kernel은 A·B tile을 반복 load해 accumulator에 누적하는 mainloop와, 결과를 정렬·후처리해 GMEM에 쓰는 epilogue로 나뉩니다."

- **[A2-6] [severity: medium] line 1077-1089** — 인용: "| Persistent kernel | Store latency를 다음 tile 연산으로 숨김 | 660 |" … "| Cluster + TMA multicast | SM 간 중복 로드 제거 | 734 |" … "| Hilbert curve 스케줄링 | L2 locality 개선 | 764 |" → 문제: persistent kernel, thread block cluster, TMA multicast, Hilbert curve가 이 deck 어디에도 정의되지 않음. 대상 독자(PyTorch 사용자)는 표의 절반을 이해할 수 없음. → 제안: 표 아래에 각주 3개: persistent kernel(SM 수만큼 CTA를 띄워 tile을 순회), cluster/multicast(인접 SM들이 같은 tile을 한 번만 GMEM에서 읽어 공유), Hilbert curve(tile 순회 순서를 공간 채움 곡선으로 바꿔 L2 재사용 증가).

- **[A2-7] [severity: medium] line 1036** — 인용: "Warp 또는 warp-group에 load, MMA, epilogue 같은 역할을 나누고" → 문제: "warp-group"(Hopper: 연속 4개 warp = 128 thread, `wgmma`의 발행 단위) 미정의. 1044의 `wgmma`도 정의 없음. → 제안: 괄호 추가: "warp-group(Hopper에서 연속된 4개 Warp, 128 thread; `wgmma` MMA 명령의 발행 단위)".

- **[A2-8] [severity: medium] line 969** — 인용: "위 그림 좌측의 L1 DMA / L2 DMA stack 이 그것입니다." → 문제: L1 DMA와 L2 DMA가 각각 어느 계층 사이를 옮기는지 어디에도 없음. 그림상 위치(Interconnect 옆 / Memory Wall 옆)로 추측해야 함. → 제안: "L2 DMA는 DRAM ↔ 온칩 scratchpad, L1 DMA는 scratchpad ↔ 각 Compute Unit의 로컬 버퍼 사이를 옮깁니다"처럼 한 문장 정의.

- **[A2-9] [severity: medium] line 856-858** — 인용: "결국 Occupancy는 **Latency Hiding의 예산**입니다." → 문제: 좋은 비유지만 "왜" 예산인지 정량적 직관이 없음. Little's law 한 줄이면 이 절과 893의 roofline이 연결됨. → 제안: 858에 추가: "HBM latency ~600ns × 3.35TB/s ≈ 2MB가 항상 in-flight여야 bandwidth가 포화됩니다(Little's law). 그 outstanding load를 만들어 내는 주체가 ready Warp이므로, Warp 수가 곧 latency hiding 예산입니다."

- **[A2-10] [severity: low] line 826** — 인용: "한 GPU 안에서 수천~수만 개 스레드가 동시에 in-flight 상태로 존재합니다." → 문제: "in-flight"가 여기서 처음 등장, 정의 없음(이후 846, 852, 856, 864에서 계속 사용). → 제안: "in-flight(발행되었지만 아직 끝나지 않은 상태)" 괄호 정의.

- **[A2-11] [severity: low] line 276** — 인용: "Data Hazard와 Control Hazard(Branch)를 점점 더 정교한 하드웨어 장치" → 문제: "Control Hazard"는 이 줄에서 처음 나오는데 앞 절에서는 "Branch Latency 문제"로만 불렀음. → 제안: 203행에서 "Branch 명령어입니다(교과서 용어로 Control Hazard)"로 먼저 소개.

- **[A2-12] [severity: low] line 382** — 인용: "아래 그림이 보여주는 것이 바로 이 중첩 실행입니다." → 문제: 그림(338–380)은 이 문장 **위**에 있음. → 제안: "위 그림이".

- **[A2-13] [severity: low] line 326** — 인용: "오른쪽은 그 루프를 실제로 풀어서(unroll) 순차 실행했을 때의 모습입니다." → 문제: unrolling은 컴파일러 변환이고, 오른쪽 그림은 `blt`가 포함된 동적 실행 trace임. 480의 "speculative trace"와 혼동 유발. → 제안: "오른쪽은 이 루프가 두 번 실행될 때 프로세서가 실제로 만나는 명령어 순서(dynamic trace)입니다."

- **[A2-14] [severity: low] line 35, 952, 1110** — 인용: "OOO : VLIW = GPU : NPU 비례식" → 문제: 같은 비례식과 그 caveat("scheduling 관점에 한정")이 3회 등장. → 제안: 35는 예고만, 952에서 정의+caveat, 1110은 한 줄 참조.

## Axis 3 — Do diagrams support the explanation?

이 deck에는 `<Mermaid>` 블록이 없다. 아래는 `<img>`/`<ThemeImage>`/Astro 컴포넌트 전부.

문제 없는 것(한 줄씩):
- 45 `processor_design_abstraction`: 6계층 스택 + ①②③ 화살표가 62–71 본문과 정확히 대응. 양호.
- 101 `latency_hiding`: 위/아래 두 timeline이 110–111과 대응. 양호.
- 166 `slide14_1` (Vertical Microcode): 본문과 일치. 624에서 재사용도 적절.
- 217 `slide18_1` (Branch delay slot): 본문과 일치.
- 235 `slide19_1` (BTB + Branch Predictor + FetchAddr): 248–256 흐름과 일치.
- 529 `slide26_1` (Intel Core): 533–535와 대응. 단 본문의 "RAT"는 그림에 "Rename & Allocator"로만 표시됨(low).
- 583 `slide30_1` (clustered VLIW, RF 2개 + FU0–3): 587–591 partitioning 설명과 일치.
- 603 `slide31_1` (VLIW word: Int/Mem/FP op): 본문과 일치.
- 633 `slide32_2` (Horizontal Microcode): 일치.
- 679 `slide34_1` (Dependence graph / Schedule / Trace / II / MRT): 682의 개념 목록과 1:1 대응. 양호.
- 680 `slide34_2` (5 + 49×2 = 103 cycles): 본문 수식과 일치.
- 756 `slide38_1` (Intel Microarchitecture Trends): "Era of Instruction/Thread Parallelism" 라벨이 그림에 있음. 양호.
- 779 `MemoryHierarchyDiagram`, 962 `NpuMemoryHierarchyDiagram`: 본문 781, 964–969와 라벨(Compute Unit / Interconnect / On-Chip Mem·Scratchpad / Memory Wall / DRAM / L1·L2 DMA) 일치.
- 821 `slide44_1` (CPU vs GPU): 825–827 세 항목과 일치.
- 835 `slide45_1` (Thread Block → Warps(32) → Multiprocessor): 843–846과 일치.
- 866 `slide46_1` ("GPU is all about hiding latency"): 일치.
- 880 `slide48_1` (HW FLOPS 60000x vs DRAM BW 100x / 20yrs): 882 주장을 정확히 뒷받침. 출처(Gholami et al., "AI and Memory Wall") 표기 권장(low).
- 1050 `blackwell_tcgen05_tmem`: A←TMEM, B←SMEM, C→TMEM, Registers 우회. 1044/1052와 일치.
- 1060 `blackwell_gemm_pipeline`: 점선 steady-state 열에 TMA k+1 / TC k / Epilogue k−1. 1058 본문과 정확히 일치.

문제 있는 것:

- **[A3-1] [severity: high] line 193** — 인용: "<img src=\"/images/07/slide16_1.png\" alt=\"레지스터 의존성에 의한 Data Hazard와 Bypass Logic(Forwarding)\" />" → 문제: 실제 이미지는 IF/ID/EX/MEM/WB 일반 datapath(IR, PC, ALU, RES1/RES2)로, hazard·forwarding path·bubble 어느 것도 표시되지 않음. → 제안: 5-stage 표 형식으로 `add r1←…; sub …←r1` 두 명령어 사이 forwarding 화살표와 load-use 1-cycle stall을 그린 그림으로 교체(본 deck의 137–154 표 스타일로 직접 그리면 됨).

- **[A3-2] [severity: high] line 205** — 인용: "<img src=\"/images/07/slide17_1.png\" alt=\"파이프라인에서 분기 결과가 늦게 결정되어 발생하는 Branch Latency 문제\" />" → 문제: `slide17_1.png`는 `slide16_1.png`와 md5가 동일(7db8836a…)한 같은 파일. 두 절이 같은 그림을 다른 설명으로 씀. 분기 지연도 표시되지 않음. → 제안: `slide18_1`(delay slot) 스타일로 "branch IF/ID/EX → 다음 fetch가 EX 뒤에야 가능"한 bubble 2칸을 표시한 표/그림으로 교체.

- **[A3-3] [severity: high] line 566-571** — 인용: "lightSrc=\"/images/07/loop_vliw_light.svg\" … alt=\"VLIW Loop Pipeline\"" → 문제: (a) 루프 본문 7개 중 `lw t1, 0(s3)`가 빠져 6개만 그려짐. (b) iteration n+2의 `add s3, s0, s2`가 iteration n+1의 `sw t3, 0(s3)`보다 먼저 실행되도록 그려져 있어 s3가 덮어써짐 — 본문 405–414가 설명한 false dependency가 해결되지 않은 채 "컴파일러가 만든 정적 스케줄"로 제시됨. 같은 이름의 레지스터를 그대로 쓰면 이 스케줄은 틀린 결과를 냄. → 제안: `lw`를 포함한 7개 명령으로 다시 그리고, 겹치는 iteration마다 다른 레지스터(예: s3/s4/s5, t1/t4/t7…)를 쓰거나 "unroll + 레지스터 분리 후" 라는 캡션을 붙여 A2-1의 설명과 연결.

- **[A3-4] [severity: medium] line 666** — 인용: "<img src=\"/images/07/slide33_1.png\" alt=\"Bob Rau의 Iterative Modulo Scheduling 알고리즘 개요\" />" → 문제: 이미지는 Rau·Schlansker·Tirumalai, "Code Generation Schema for Modulo Scheduled Loops"(MICRO-25, 1992) 첫 페이지. 본문 670–671이 인용한 "Iterative modulo scheduling"(MICRO-27, 1994)과 다른 논문. → 제안: 1994 논문 첫 페이지로 교체하거나, alt/캡션을 "같은 저자의 1992 MICRO 논문(modulo scheduled loop의 코드 생성)"으로 수정. 또는 논문 스크린샷 자체를 빼고 670 인용만 남김.

- **[A3-5] [severity: medium] line 79** — 인용: "<img src=\"/images/07/slide07_1.png\" alt=\"무어의 법칙에 따른 Datapath 복잡도 증가와 ISA/Microarchitecture의 분리\" />" → 문제: 이미지는 Fetch/Decode/Rename/ROB/Issue Queue/LoadQ/StoreQ/DTLB/SD$/MSHR가 있는 특정 연구용 OOO 코어 블록도. 무어의 법칙도, ISA/uarch 분리도 보여주지 않음. 아직 OOO를 배우기 전인 독자에게 라벨 대부분이 의미 없음. → 제안: alt를 "현대 OOO 코어의 microarchitecture 예: ISA에는 드러나지 않는 구성 요소들"로 바꾸고 본문 81에 "이런 블록 중 ISA에 보이는 것은 하나도 없다"는 한 문장을 붙이거나, 트랜지스터 수 vs 연도 그래프로 교체.

- **[A3-6] [severity: medium] line 472** — 인용: "<img src=\"/images/07/slide24_4.png\" alt=\"Data-flow graph\" style={{ maxWidth: '100%' }} />" → 문제: 그림은 `f = (a+b) * (e-d)` 류의 일반 DFG로, 좌측 두 칸에서 계속 쓰던 loop(`slli/add/lw/mul/add/sw`)와 무관. "register renaming을 한 후 data-flow graph로 전환"의 결과물이 아님. → 제안: 루프 본문 7개 노드(slli→add→lw→mul→add→sw, addi 독립)와 두 iteration을 renaming 후 그린 DAG로 교체. 그러면 481의 "topological order로 병렬" 설명이 그림에서 확인됨.

- **[A3-7] [severity: medium] line 690-692** — 인용: "<img src=\"/images/07/slide35_3.png\" alt=\"Reconfigurable Architecture (Extreme VLIW) 개념 그림 3\" />" → 문제: 3장 중 `slide35_3`은 논문(Park et al., "Edge-centric Modulo Scheduling for CGRAs", CASES 2008) 첫 페이지 전문으로 슬라이드 크기에서 읽을 수 없음. `slide35_1`의 4×4 reservation table도 밀도가 높음. alt "개념 그림 1/2/3"은 내용을 설명하지 않음. → 제안: `slide35_2`(4×4 FU mesh + Config Mem)만 남기고 alt를 "CGRA: 4×4 FU 배열과 각 FU의 Config Memory"로. 나머지는 삭제하고 출처를 캡션으로.

- **[A3-8] [severity: medium] line 796-797** — 인용: "<img src=\"/images/07/slide42_2.png\" alt=\"Multithreading을 활용한 Memory Latency Hiding 그림 1\" />" → 문제: 42_2는 "2 CPU × 2 core × 2 thread = 8 logical processors"(SMT), 42_1은 "coarse-grained vs fine-grained switching" timeline. 본문 799는 한 문장이며 SMT/coarse/fine-grained 어느 것도 언급하지 않아 그림이 설명 없는 새 개념을 던짐. → 제안: 799 뒤에 두 문장: "CPU에서는 이를 SMT(Hyper-Threading)로 구현해 core당 2개 정도의 스레드를 둡니다(왼쪽). 전환 단위는 cache miss마다 바꾸는 coarse-grained와 매 cycle 바꾸는 fine-grained가 있고, GPU의 warp scheduling은 후자에 가깝습니다(오른쪽)."

- **[A3-9] [severity: medium] line 979-984 / 992-997** — 인용: "alt=\"NPU Architecture as Horizontal Encoding\"" / "alt=\"NPU Compiler\"" → 문제: 두 SVG의 유닛 이름이 서로 다르고 본문과도 다름. `command_processor_arch`: Compute Unit / L1 DMA / L2 DMA / Sync Network; `npu_compiler`: Tensor Processor / Vector Processor / Register Bank / Load-Store / Task Manager / Neural DMA / L0 Scratch Pad Memory (4 MB). 본문(977, 988, 1003–1006)은 전자 용어만 씀. 두 그림 모두 9개 instruction queue 상자에 라벨이 없음. → 제안: `npu_compiler`의 Architecture Details 박스를 Compute Unit×3 / L1 DMA×3 / L2 DMA×3 / Scratchpad로 통일하고, 두 그림의 9개 상자에 "Instruction Queue (unit별)" 라벨 추가.

- **[A3-10] [severity: low] line 769** — 인용: "<img src=\"/images/07/slide39_1.png\" alt=\"Dennard Scaling의 한계와 Era of Thread Parallelism으로의 전환\" />" → 문제: 이미지는 Hennessy–Patterson "40 Years of Processor Performance"(CISC/RISC/End of Dennard/Amdahl/End of the Line). "Era of Thread Parallelism" 문구는 위 `slide38_1`에만 있음. 773의 "그림의 *Era of Thread Parallelism*"은 잘못된 그림을 가리킴. → 제안: alt를 "40년간 단일 프로세서 성능 추이: 2003년경 Dennard Scaling 종료 후 성장률 둔화"로, 773은 "앞 그림(Intel 슬라이드)의 Era of Thread Parallelism"으로.

- **[A3-11] [severity: low] line 786-787** — 인용: "<img src=\"/images/07/slide41_2.png\" alt=\"Memory Wall 보조 그림 2\" …/>" → 문제: 41_1은 Wulf & McKee 논문 첫 페이지(인용 목적이면 OK), 41_2는 "Multithreading for Latency Hiding"이라는 텍스트-only 슬라이드(HEP, Tera 언급)로 Memory Wall 절이 아니라 다음 절 내용. alt "보조 그림 2"는 무의미. → 제안: 41_2 삭제(또는 792 절로 이동해 "HEP/Tera 같은 1980–90년대 machine이 fine-grained MT로 latency를 숨겼다"는 한 문장과 함께). 41_1 alt를 "Wulf & McKee, 'Hitting the Memory Wall' (1994)"로.

- **[A3-12] [severity: low] line 905** — 인용: "<img src=\"/images/07/slide49_1.png\" alt=\"GPU의 Multithreading Overhead: SIMT 프로그래밍 모델 뒤에 숨겨진 하드웨어 Latency Hiding 비용\" />" → 문제: AMD 그림은 4개 thread batch의 stall→runnable→done, 즉 latency hiding 메커니즘 자체. "overhead/비용"은 그림에 없음. 850의 메커니즘 설명 옆이 더 맞는 위치. → 제안: 850 아래로 옮기고 alt를 "4개 thread batch로 stall을 겹쳐 숨기는 모습"으로. 899 절에는 그림 없이 인용문만 두어도 됨.

- **[A3-13] [severity: low] line 876** — 인용: "<img src=\"/images/07/slide47_1.png\" alt=\"NVIDIA GPU의 세대별 컴퓨팅 성능(FLOPS) 성장 추이\" />" → 문제: 차트는 Int8 TOPS(inference)이고 1000x 중 2x는 structured sparsity, 16x는 number representation 변화. 878의 "컴퓨팅 성능(FLOPS)"과 단위·의미가 다름. → 제안: alt/본문을 "Int8 추론 TOPS(수치 표현·명령어·공정·sparsity 효과 포함)"로 명시.

- **[A3-14] [severity: low] line 501-507** — 인용: "<div …>매 cycle 3개의 instruction을 수행</div>" → 문제: `loop_pipeline` SVG의 점선 상자는 두 줄(6개 명령)을 감싸고 있어 "3개"가 어느 슬라이스인지 모호. iteration 간 offset도 2줄/3줄/2줄로 불규칙(OOO라 허용 가능하나 캡션과 어긋남). → 제안: 상자를 한 줄(3개)로 줄이거나 캡션을 "점선 = 2 cycle 동안 6개(=cycle당 3개)"로.

- **[A3-15] [severity: low] line 679-680** — 인용: "<img src=\"/images/07/slide34_1.png\" …/>" → 문제: 두 이미지 우상단에 원본 뷰어의 "Download" 버튼이 스크린샷에 포함됨. → 제안: 크롭.

- **[A3-16] [severity: low] line 176** — 인용: "### MIPS 5-Stage Pipeline 상세 구조 … <img src=\"/images/07/slide15_1.png\" alt=\"MIPS 5-Stage Pipeline의 상세 하드웨어 구조\" />" → 문제: 그림은 Patterson–Hennessy RISC-V판 datapath(Imm Gen, Instruction[11-7], [30,14-12]). 296–303의 코드도 RISC-V 어셈블리(`slli`, `blt`, s/t 레지스터). 제목만 MIPS. → 제안: 제목·alt를 "RISC-V 5-Stage Pipeline"으로(119행의 "MIPS·RISC-V 교과서" 문구는 유지 가능).

## Axis 4 — Technical correctness

검증 통과(참고): 856행 H100 SM당 64 warp·64K 32-bit register·thread당 255 register → 8 warp 계산(high); 886–891 표의 256KB RF / ~228KB SMEM / ~50MB L2 / 80GB HBM3 3.35TB/s(high); 893 roofline 989/3.35≈295, 2250/8≈281 FLOPs/byte(high); 1042 TMEM 128 lane×512 column×32bit, `tcgen05.alloc/dealloc/ld/st`(high); 1044 `tcgen05.mma` single-thread issue, `tcgen05.commit`→mbarrier, `cta_group::2`(high); 668–671 Rau 1994 MICRO-27(high); 703–706 Tomasulo 1967 IBM 360/91(high); 1091 764/713 ≈ 107%(medium-high, 아래 A4-8 참조).

- **[A4-1] [severity: high] line 418** — 인용: "따라서 소프트웨어(컴파일러나 어셈블리)가 \"iteration마다 다른 레지스터를 써라\"라고 표현할 방법 자체가 없습니다." → 문제: 사실이 아님. 컴파일러는 loop unrolling 후 각 copy에 다른 architectural register를 배정(modulo variable expansion)해 false dependency를 정적으로 제거하며, VLIW/EPIC(Cydra-5, Itanium)은 rotating register file을 ISA에 두어 unroll 없이 표현함. 한계는 "표현 불가"가 아니라 "ISA 레지스터 수가 상한"임. 확신: high. → 제안: "ISA가 노출하는 레지스터 수가 제한되어 있어, unroll해서 다른 레지스터를 배정하는 방식은 곧 한계에 부딪힙니다. OOO는 이를 하드웨어의 더 많은 physical register로, VLIW는 unrolling(modulo variable expansion)이나 rotating register file로 풉니다."

- **[A4-2] [severity: medium] line 414** — 인용: "iteration마다 서로 다른 (논리적) 레지스터를 쓰도록 이름을 바꿔 주면, False Dependency가 해소되어" → 문제: register renaming은 논리(architectural) 이름을 **물리** 레지스터에 매핑하는 것. 487행이 "Architectural Register (논리 레지스터)"라고 정의하므로 414와 490이 서로 모순. 확신: high. → 제안: "(논리적)"을 "(물리)"로, 또는 "iteration마다 실제로는 다른 저장 공간을 쓰도록".

- **[A4-3] [severity: medium] line 837** — 인용: "익숙한 SIMD (Single Instruction Multiple Data)와 구조적으로 크게 다르지는 않지만, NVIDIA GPU 특유의 메모리 Latency Hiding 메커니즘에 맞게 특화된 이름이 SIMT라고 보면 됩니다." → 문제: SIMT가 SIMD와 구별되는 점은 latency hiding이 아니라 (1) thread마다 독립 PC/control flow를 허용하고 divergence를 HW mask로 처리, (2) thread별 독립 주소 지정(scatter/gather)이라는 프로그래밍 모델. Latency hiding은 multithreading(warp scheduling)의 몫이며 SIMT와 직교. 확신: high. → 제안: "SIMD와 달리 각 thread가 자기 PC와 주소를 갖고 분기할 수 있으며(divergence는 HW가 mask로 처리), 32개 thread를 한 Warp로 묶어 같은 명령을 발행한다는 점이 SIMT의 정의입니다. Latency hiding은 다음 절의 Warp scheduling이 담당합니다."

- **[A4-4] [severity: medium] line 1040** — 인용: "Hopper에서 프로그래머가 소프트웨어로 짜 넣어야 했던 이 구조를, Blackwell(B200)은 하드웨어 차원에서 직접 지원하기 시작합니다." → 문제: Blackwell에서도 TMA pipeline, warp specialization, mbarrier 동기화는 여전히 소프트웨어(CUTLASS)가 짬. 새로 추가된 것은 TMEM(accumulator를 RF 밖으로)과 single-thread issue MMA로, "구조를 HW가 지원"이 아니라 "register pressure와 issue overhead를 줄이는 HW 자원 추가". 1067행 본인이 이를 인정함. 확신: high. → 제안: "Blackwell은 이 소프트웨어 구조를 그대로 두되, 그 비용을 줄이는 두 가지 하드웨어를 추가합니다."

- **[A4-5] [severity: medium] line 1046-1048** — 인용: "[^mbarrier]: Shared Memory에 놓이는 asynchronous barrier object. …" / "[^cta]: Cooperative Thread Array. …" → 문제: 두 footnote 정의가 본문 어디에서도 참조되지 않음(`grep '\[\^mbarrier\]'`, `'\[\^cta\]'` → 정의 행만 hit). remark-footnotes는 미참조 정의를 렌더링하지 않으므로 1044의 "mbarrier", 1067의 "CTA·Warp"가 정의 없이 남음. → 제안: 1044의 첫 "mbarrier" 뒤에 `[^mbarrier]`, 1044의 "CTA pair" 뒤에 `[^cta]` 참조 삽입.

- **[A4-6] [severity: medium] line 563 / 713** — 인용: "하드웨어는 그 계획대로 매 cycle 정해진 일만 하면 되므로 Branch Prediction, Rollback, Reorder Buffer 같은 복잡한 동적 장치를 사실상 버릴 수 있습니다." → 문제: ROB·renaming은 맞지만 branch prediction은 VLIW에서도 흔히 유지됨(Itanium은 정교한 predictor 보유, TI C6x는 delay slot 사용). "버릴 수 있다"는 과장. 확신: medium-high. → 제안: "Reorder Buffer, renaming, 명령어 윈도우 같은 동적 스케줄링 장치를 제거할 수 있고, branch prediction도 훨씬 단순해집니다."

- **[A4-7] [severity: medium] line 673** — 인용: "비슷한 구조의 아키텍처를 다루는 거의 모든 컴파일러가 이 틀 위에서 SW Pipelining을 구현합니다." → 문제: LLVM `MachinePipeliner`와 GCC의 SMS는 Swing Modulo Scheduling(Llosa et al. 1996) 기반. "Iterative Modulo Scheduling 그 자체"가 아니라 "modulo scheduling 계열"이 표준. 확신: high. → 제안: "거의 모든 production 컴파일러(LLVM MachinePipeliner, GCC SMS 등)가 modulo scheduling 계열 알고리즘(Iterative MS, Swing MS 등) 위에서 SW pipelining을 구현합니다."

- **[A4-8] [severity: medium] line 1075** — 인용: "Aleksa Gordić이 정리한 H100 bf16 matmul 커널 최적화 워크로그가 잘 보여줍니다." → 문제: 표의 11단계(32→317→…→764 TFLOP/s, cuBLAS 대비 107%)는 Pranjal Shankhdhar의 "Outperforming cuBLAS on H100: a Worklog"(2024-12)의 kernel 1–11 수치와 일치하며, Gordić의 글은 이를 해설·인용한 것. 원저자 크레딧이 빠짐. 확신: medium(Gordić 글이 수치를 재측정했는지는 needs verification — 두 출처의 표를 대조). → 제안: "Pranjal Shankhdhar의 H100 bf16 matmul 워크로그(Aleksa Gordić의 해설 글에서 재정리)"로 쓰고 1093 출처에 원 워크로그 링크 추가.

- **[A4-9] [severity: low] line 481** — 인용: "이 DAG에서는 topological order로 묶을 수 있는 명령어들은 동시에 실행해도 결과가 같기 때문에" → 문제: topological order는 순차 순서. 동시에 실행 가능한 것은 "서로 경로가 없는(같은 depth의) 명령어들". → 제안: "이 DAG에서 서로 의존 경로가 없는 명령어들은 동시에 실행해도 결과가 같으므로".

- **[A4-10] [severity: low] line 244** — 인용: "디코드가 끝난 다음에야 다음 Branch를 Fetch할 수 있다면" → 문제: 다음에 fetch하는 것은 branch가 아니라 "다음 명령어(target)". → 제안: "다음 명령어를 Fetch할 수 있다면".

- **[A4-11] [severity: low] line 488** — 인용: "일반적으로 Architectural Register보다 수 배 더 많습니다." → 문제: x86-64는 16개 architectural GPR 대비 physical ~200–300개(10배 이상). "수 배"는 과소. 확신: medium-high. → 제안: "보통 수 배에서 10배 이상(예: x86-64 16개 vs 수백 개)".

- **[A4-12] [severity: low] line 771** — 인용: "빠져나가는 전력은 트랜지스터 크기에 비례해 줄어들지 않습니다." → 문제: Dennard scaling의 핵심은 전압이 크기와 함께 줄어 전력 밀도가 일정하다는 것이고, 붕괴 원인은 threshold voltage가 더 못 내려가 leakage가 급증한 것. 문장이 모호. 확신: high. → 제안: "공정 미세화로 트랜지스터는 작아지지만 2000년대 중반부터 동작 전압을 더 낮출 수 없게 되어(leakage 급증), 단위 면적당 전력이 더 이상 일정하게 유지되지 않습니다."

- **[A4-13] [severity: low] line 1104** — 인용: "메모리 Latency를 어떻게 숨기는가, 또는 동치 표현으로 메모리 Bandwidth를 어떻게 최대한 활용하는가" → 문제: 동치가 아니라 인과(latency를 숨겨 outstanding request를 유지해야 bandwidth가 포화됨, Little's law). → 제안: "메모리 Latency를 숨겨 Bandwidth를 포화시키는 것".

- **[A4-14] [severity: low] line 856** — 인용: "SM이 동시에 들고 있을 수 있는 in-flight Warp의 수를 **Occupancy**라고 부르는데" → 문제: CUDA 문서의 Occupancy는 "active warps / max warps per SM" 비율(0~1 또는 %)이며, 절대 수가 아님. → 제안: "resident Warp 수를 최대치(64)로 나눈 비율을 **Occupancy**라고 부르는데".

</details>

<details><summary>Codex gpt-6-astra 전문</summary>

문체는 예고·재요약이 반복되고, 이해도는 어셈블리와 GPU kernel 용어를 처음 다루는 구간에서 크게 떨어집니다.
그림은 일부가 본문과 다른 논문·연산·지표를 보여 주며, 기술 설명에는 소프트웨어 파이프라이닝과 GPU/NPU 역할에 관한 오해가 남아 있습니다.
우선 수정할 세 가지는 ① “순차 ISA에서는 소프트웨어 파이프라이닝 불가” 삭제, ② 루프·GEMM 그림의 실제 의존성과 작업 단위 수정, ③ Occupancy 정의와 GPU/NPU 작업 분할 표 교정입니다.
본문 1–1110행, `<img>` 35개, `ThemeImage` 8회(밝은·어두운 이미지 모두), 메모리 계층 컴포넌트 2개를 확인했습니다. Mermaid는 없습니다. 저장소 파일은 수정하지 않았습니다.

## Axis 1 — AI 문체와 비표준 용어

- **[A1-1] [severity: medium] line 90** — 인용: "다양한 하드웨어를 Latency Hiding이라는 공통 측면에서 비교하면서 점진적으로 빌드업해 나가는 편이 훨씬 이해하기 쉽습니다." → 문제: 설명 방식의 장점을 먼저 설명하느라 실제 정의가 늦게 나옵니다. → 제안: 문단을 “CPU·GPU·NPU의 대기 시간 처리 방식을 비교하기 위해 Latency와 Throughput을 구분하겠습니다.”로 줄입니다.

- **[A1-2] [severity: medium] line 266-280** — 인용: "지금까지 한 절에서 다룬 내용이 적지 않으니, 여기서 한 번 큰 그림으로 정리하고 넘어가겠습니다." → 문제: 도입 요약, 표, 한 줄 요약, 메타 관찰, 다음 절 예고가 같은 내용을 반복합니다. → 제안: 표와 “Delay Slot을 제외한 기법은 ISA를 유지하면서 하드웨어 내부에서 동작합니다.”만 남깁니다.

- **[A1-3] [severity: medium] line 686-704** — 인용: "Reconfigurable Architecture (Extreme VLIW)" → 문제: 비표준 비유라는 단서는 있지만 제목과 뒤의 “VLIW (또는 Reconfigurable)”가 실제 분류명·동의어처럼 보이게 합니다. → 제안: 그림에 해당하는 표준 명칭인 “CGRA(Coarse-Grained Reconfigurable Architecture)”를 쓰고 “연산 배치뿐 아니라 유닛 사이 데이터 경로도 컴파일러가 정합니다.”라고 설명합니다.

- **[A1-4] [severity: medium] line 742-750** — 인용: "Thread-Level Pipelining: CPU의 전환" → 문제: 이 절의 스레드 전환과 멀티코어를 묶어 부르는 표준 분류로 보기 어렵고, 뒤의 GPU/NPU가 명령어·루프 파이프라인의 다음 단계라는 인상을 줍니다. → 제안: “Thread-Level Parallelism과 Hardware Multithreading”으로 바꿉니다. 이 전체를 가리키는 별도 표준 단계명은 없으므로 스레드 간 실행 중첩이라고 풀어 씁니다.

- **[A1-5] [severity: low] line 121** — 인용: "인스트럭션 메모리에서 명령어를 가져옵니다." → 문제: 같은 개념을 “인스트럭션”과 “명령어”로 혼용합니다. 뒤의 “ISA(인스트럭션 셋)”도 이미 정의한 Instruction Set Architecture와 표기가 다릅니다. → 제안: “명령어 메모리에서 명령어를 가져옵니다.”로 쓰고, ISA의 이름도 첫 정의와 통일합니다.

- **[A1-6] [severity: medium] line 520** — 인용: "Reservation Station / Reservation Table" → 문제: Reservation Station과 Reservation Table은 동의어가 아닙니다. 뒤에서 사용하는 Modulo Reservation Table은 자원의 주기별 사용을 나타내므로 같은 이름으로 소개하면 두 장치를 혼동합니다. → 제안: “Reservation Station / Issue Queue: 입력 operand의 준비 상태를 추적하고 실행을 기다리는 명령어를 보관합니다.”로 바꾸고 537행도 통일합니다.

- **[A1-7] [severity: medium] line 856-858** — 인용: "전제는 공짜가 아닙니다." → 문제: 자원 제한을 설명하기 전에 극적인 반전을 연출하고, 이어지는 “Latency Hiding의 예산” 비유가 같은 내용을 한 번 더 반복합니다. → 제안: “SM에 상주시킬 수 있는 Warp 수는 register file과 shared memory 용량에 제한됩니다.”로 바로 설명하고 수치 예제로 이어갑니다.

## Axis 2 — 이해도, 비유, 분량

- **[A2-1] [severity: medium] line 43-52** — 인용: "ISA(Instruction Set Architecture)와 Control Logic, Datapath는 하드웨어 영역에 해당합니다." → 문제: 약어의 풀네임만 제시하고 각 계층의 역할은 정의하지 않아 첫 그림부터 추상적입니다. ISA를 소프트웨어와 하드웨어 사이의 약속으로 소개하면 뒤의 구현 차이도 이해하기 쉽습니다. → 제안: “ISA는 실행할 수 있는 명령어와 그 의미의 약속입니다. Control Logic은 제어 신호를 만들고, Datapath는 레지스터·연산기·연결 경로를 통해 값을 처리합니다.”를 먼저 둡니다.

- **[A2-2] [severity: medium] line 296-328** — 인용: "loop: slli  s2, s1, 2     # 1" → 문제: Python 사용 경험만 있는 독자는 숫자 주석만으로 루프가 무엇을 계산하는지 알기 어렵습니다. 오른쪽은 실제 unrolling 변환 코드라기보다 반복 실행을 나열한 그림입니다. → 제안: “정수 배열의 각 원소에 `x*x+x`를 적용합니다. `s0`는 배열 주소, `s1`은 인덱스, `t0`는 끝 인덱스입니다.”와 Python 대응식을 추가하고, 오른쪽 제목은 “두 iteration의 실행 흐름”으로 바꿉니다.

- **[A2-3] [severity: medium] line 682-684** — 인용: "Initiation Interval(II)" → 문제: II·MRT·Schedule을 한 문장에 넣지만 II가 무엇의 간격인지 설명하지 않습니다. 이어지는 긴 OOO 비유도 정의를 대신하지 못합니다. → 제안: “II는 다음 iteration을 시작하기까지의 cycle 수입니다. 첫 iteration이 5 cycle, II가 2이면 50회는 5 + 49×2 = 103 cycle입니다. MRT는 2 cycle마다 반복되는 자원 사용표입니다.”로 줄이고 두 그림이 서로 다른 루프 예제임을 밝힙니다.

- **[A2-4] [severity: high] line 1022-1056** — 인용: "load·MMA·epilogue를 overlap합니다." → 문제: GEMM·MMA·tile·warp-group을 정의하기 전에 사용하고, epilogue는 여러 차례 등장한 뒤 1056행에서 정의합니다. 1044행은 명령 발행부터 CTA pair까지 한 문단에 몰려 있고, mbarrier·CTA 각주는 정의만 있으며 본문 참조가 없습니다. → 제안: 먼저 “GEMM=행렬곱, tile=행렬의 작은 조각, MMA=행렬 곱셈·누적, epilogue=누적 결과의 후처리·저장”을 제시합니다. 이후 발행→완료 확인→결과 읽기를 나누고, 각주 참조를 연결하거나 본문에서 정의합니다.

## Axis 3 — 그림이 설명을 뒷받침하는가

원본 이미지와 SVG 렌더링을 확인했습니다. 실제 발표 화면을 실행한 검증은 하지 않았으므로 화면 전체의 넘침은 확정하지 않았고, 아래 가독성 평가는 이미지의 글자 밀도와 MDX 배치에 근거합니다. 같은 주제를 함께 수정해야 하는 그림은 한 항목에 묶었습니다.

- **[A3-1] [severity: high] line 79** — 인용: "/images/07/slide07_1.png" → 문제: 그림은 ROB·DTLB·Shared MSHRs·캐시를 연결한 상세 구조도이며 무어의 법칙이나 ISA와 구현의 분리를 보여 주지 않습니다. 아직 설명하지 않은 약어도 많습니다. → 제안: “동일 ISA → 서로 다른 세대의 Microarchitecture” 비교 그림으로 교체합니다.

- **[A3-2] [severity: high] line 176-205** — 인용: "MIPS 5-Stage Pipeline의 상세 하드웨어 구조" → 문제: 176행 그림에는 RISC-V의 `Imm Gen`, `Instruction [11:7]`, `Shift left 1`이 보이므로 MIPS라는 제목과 맞지 않습니다. 193·205행 그림은 바이트까지 같은 이미지이며, 전달 경로와 분기 경로를 각각 강조하지 않아 두 메커니즘을 구분하기 어렵습니다. → 제안: 제목을 “RISC-V 5-stage pipeline 예시”로 고치고, 193행에는 forwarding 경로, 205행에는 branch 결과→PC 경로만 강조합니다. 본문의 ME/W도 그림의 MEM/WB와 통일합니다.

- **[A3-3] [severity: high] line 472-481** — 인용: "register renaming을 한 후,<br/>data-flow graph로 전환" → 문제: 실제 그림은 `a,b,e,d,f`와 덧셈·부호 반전·곱셈을 연결하며 왼쪽 배열 루프의 load/store나 인덱스 계산과 다릅니다. 동일 코드가 변환된 결과처럼 놓은 것이 잘못입니다. → 제안: 실제 루프의 의존 그래프를 그려 `lw→mul→add→sw`, 주소 계산, 다음 iteration으로 이어지는 `s1` 의존성을 표시합니다.

- **[A3-4] [severity: high] line 501-572** — 인용: "/images/07/loop_vliw_light.svg" → 문제: 501·550행 `loop_pipeline`은 다음 iteration의 `slli`가 이전 `addi`보다 먼저 놓이는데 필요한 인덱스 전달·재배치가 표시되지 않습니다. 566행 `loop_vliw`의 반복 묶음에는 원래 루프의 `lw`가 아예 없으므로 실행 가능한 정적 계획으로 읽을 수 없습니다. → 제안: 세 위치 모두 명령별 issue 시점과 latency를 정한 동일 예제로 다시 그립니다. VLIW 그림에는 load와 iteration별 레지스터를 복원하고 prologue·반복부·epilogue를 구분합니다.

- **[A3-5] [severity: high] line 666-671** — 인용: "Bob Rau의 Iterative Modulo Scheduling 알고리즘 개요" → 문제: 이미지 제목은 “Code Generation Schema for Modulo Scheduled Loops”로, 아래 인용한 1994년 Iterative Modulo Scheduling 논문이 아닙니다. 알고리즘 개요도 아닌 논문 첫 페이지입니다. → 제안: 정확한 1994년 논문으로 교체하거나 실제 이미지에 맞춰 Rau·Schlansker·Tirumalai의 1992년 논문이라고 표기하고 본문과 구분합니다. [그림의 원 논문](https://www.cs.princeton.edu/courses/archive/fall99/cs597d/restricted/papers/rau_micro25.pdf)

- **[A3-6] [severity: medium] line 690-692** — 인용: "Reconfigurable Architecture (Extreme VLIW) 개념 그림 1" → 문제: 690행은 30개가량의 연산과 16개 유닛의 시간표를 담아, 현재 설명으로는 무엇을 읽어야 하는지 알기 어렵습니다. 691행은 CGRA 구조를 잘 보여 주지만 뒤에 나오고, 692행은 메커니즘 없이 논문 첫 페이지만 추가합니다. → 제안: 691행 구조도를 먼저 제시하고 CGRA를 정의합니다. 690행은 연산 21·22→23의 배치·routing만 확대하고 692행은 출처 링크로 대체합니다.

- **[A3-7] [severity: medium] line 786-787** — 인용: "Memory Wall 보조 그림 1" → 문제: 두 이미지는 각각 논문 첫 페이지와 영어 설명 슬라이드로, 처리량 격차나 latency hiding을 직접 그리지 않습니다. 특히 두 번째의 “previous example”에 해당하는 예제가 앞에 없습니다. → 제안: 첫 이미지는 논문 링크로 바꾸고 두 번째는 797행 시간표에 “복수의 미완료 메모리 요청을 처리할 수 있어야 함”이라는 조건으로 통합합니다.

- **[A3-8] [severity: medium] line 796-799** — 인용: "Multithreading을 활용한 Memory Latency Hiding 그림 1" → 문제: 796행 그림은 소켓·코어·논리 프로세서 수만 보여 줍니다. 실제 대기 시간 중첩은 797행에 있지만 C/M의 뜻과 hardware thread인지가 설명되지 않습니다. → 제안: 796행을 유지한다면 구조 예시라고 명명하고, 797행에 “C=연산, M=메모리 대기; 동일 core의 hardware thread 두 개”를 붙입니다.

- **[A3-9] [severity: medium] line 811-815** — 인용: "GPU 변천 그림 2" → 문제: 두 그림은 CPU/GPU 간 알고리즘 분담과 데이터 왕복을 비교하며, 본문이 설명하는 fixed-function→programmable shader 변화 자체는 보여 주지 않습니다. → 제안: 제목을 “GPU의 범용 연산 활용 확대”로 맞추거나, 고정된 그래픽스 단계가 사용자 shader로 바뀌는 그림을 사용합니다.

- **[A3-10] [severity: medium] line 821** — 인용: "/images/07/slide44_1.png" → 문제: 연산/제어 자원 배분은 설명과 맞지만 이미지의 “Deep pipelines (hundreds of stages)”는 대상 GPU와 pipeline 종류가 불명확합니다. 메모리 접근 수백 cycle과 명령어 pipeline 수백 stage를 혼동시킬 수 있어 이 문구는 needs verification입니다. → 제안: 해당 수치의 원 출처·세대를 확인하거나 그 문구를 제외한 자원 배분 개념도만 사용하고, 면적 비율은 개념적임을 표시합니다.

- **[A3-11] [severity: medium] line 866-905** — 인용: "GPU의 Multithreading Overhead: SIMT 프로그래밍 모델 뒤에 숨겨진 하드웨어 Latency Hiding 비용" → 문제: 866행은 장단점 목록과 GPU 그림이어서 Warp 전환을 보여 주지 않습니다. 반대로 905행은 대기 중 다른 작업을 실행하는 시간표이지만 overhead의 면적·전력·레지스터 비용은 보여 주지 않습니다. → 제안: 905행 시간표를 Warp scheduling 설명으로 옮기고, overhead 절에는 resident thread 상태를 저장하는 register file과 scheduler 비용을 표시합니다.

- **[A3-12] [severity: high] line 876-882** — 인용: "NVIDIA GPU의 세대별 컴퓨팅 성능(FLOPS) 성장 추이" → 문제: 876행 이미지는 축이 “Int8 TOPS”이고 FP32·FP16·FP8 및 sparsity 효과를 섞은 추론 성능 자료여서 동일 정밀도 FLOPS 비교가 아닙니다. 880행도 NVIDIA GPU만이 아니라 CPU·TPU를 포함한 정규화된 장기 추세입니다. → 제안: 각각 “정밀도·Tensor Core·sparsity 변화를 포함한 추론 처리량 증가”, “여러 프로세서의 peak 연산량과 대역폭의 장기 추세”로 본문·alt를 고치고 비교 조건을 설명합니다.

- **[A3-13] [severity: medium] line 962-969** — 인용: "NpuMemoryHierarchyDiagram" → 문제: 컴포넌트에는 상자들이 있을 뿐 DMA의 출발지·도착지를 연결하는 선이 없습니다. L1 DMA는 Compute Unit 옆에 놓여 있는데 대응하는 메모리 계층도 없어 어떤 전송인지 알 수 없습니다. → 제안: 설명용 특정 구조임을 밝히고 “DRAM↔Scratchpad”, 필요하다면 “Scratchpad↔로컬 operand buffer”를 화살표로 표시합니다. Memory Wall은 메모리 장치가 아닌 경계 주석으로 둡니다.

- **[A3-14] [severity: medium] line 979-997** — 인용: "/images/07/npu_compiler_light.svg" → 문제: 979행 command processor 그림의 큐는 모두 비어 있어 동기화 순서를 읽을 수 없고, 992행 compiler 출력은 큐의 유닛 이름조차 없습니다. 작은 입력 그림의 “L0 Scratch Pad Memory (4 MB)”도 본문에 근거가 없는 구체적 사양입니다. → 제안: 두 그림에 같은 load→compute→store 예시와 유닛 이름·완료 대기를 표시합니다. 4 MB는 근거가 있는 특정 칩의 사양으로 출처를 붙이거나 삭제합니다.

- **[A3-15] [severity: medium] line 1050-1052** — 인용: "Register File은 이 경로에서 완전히 비켜나 있다" → 문제: 본문은 descriptor가 register를 거친다고 올바르게 한정하지만 alt는 완전 배제를 주장합니다. Read 화살표도 Tensor Core→메모리로 향하므로 “데이터 경로”로 해석하면 읽기 데이터의 방향과 반대입니다. → 제안: alt를 “TMEM/SMEM을 사용하는 operand·accumulator 경로의 한 예”로 바꾸고, 화살표를 “읽기 요청”이라고 명시하거나 데이터가 Tensor Core로 들어오는 방향으로 고칩니다.

- **[A3-16] [severity: high] line 1058-1065** — 인용: "TMA가 tile *k+1*을 GMEM에서 SMEM으로 옮기는 동안" → 문제: 그림과 본문 모두 k가 K축의 누적 조각인지 서로 다른 출력 tile인지 정의하지 않습니다. K축 조각이라면 모든 조각의 누적이 끝나기 전에 k−1을 epilogue로 저장할 수 없으며, 출력 tile이라면 그 내부 K-loop 전체가 생략돼 있습니다. → 제안: “출력 tile t−1의 epilogue와 출력 tile t의 mainloop를 중첩”하는 바깥 그림, “같은 출력 tile 안에서 K-step j+1 load와 j MMA를 중첩”하는 안쪽 그림으로 나눕니다. [CUTLASS GEMM 구조](https://docs.nvidia.com/cutlass/latest/media/docs/cpp/efficient_gemm.html)

나머지 그림은 다음 범위에서 설명과 부합합니다. 각 줄은 개별 사용 위치입니다.

line 45–50 — `processor_design_abstraction_{light,dark}.svg`: 계층 순서와 ①②③ 위치가 본문에 대응합니다. ISA의 정의는 A2-1 참조.

line 92 — `slide09_1.png`: 단일 전송 시간과 단위 시간당 전송량을 적절히 비교합니다.

line 101–106 — `latency_hiding_{light,dark}.svg`: 동일 작업의 순차 실행과 중첩 실행 차이가 명확합니다.

line 166 — `slide14_1.png`: vertical microcode 자체의 설명도로는 적절합니다. ISA에 적용한 본문의 문제는 A4-5 참조.

line 529 — `slide26_1.png`: Rename·Reservation Station·ROB가 모두 보입니다. 역사적 Intel Core 예시로 읽으면 적절하며 본문의 RAT는 그림의 Rename 블록에 해당합니다.

line 583 — `slide30_1.png`: 분할 register file, functional unit, 연결 경로가 본문과 대응합니다.

line 603 — `slide31_1.png`: 여러 operation slot의 동시 발행을 보여 줍니다. VLIW와 microcode를 동일시하는 설명은 A4-5 참조.

line 624 — `slide32_1.png`: decoder를 통과하는 vertical microcode 경로가 설명과 일치합니다.

line 633 — `slide32_2.png`: 직접 제어 신호를 전달하는 horizontal microcode 개념을 보여 줍니다.

line 679 — `slide34_1.png`: dependence graph→schedule→II=2 중첩→MRT의 관계가 맞습니다. 처음 등장하는 기호의 설명은 A2-3 참조.

line 680 — `slide34_2.png`: 첫 작업 5 cycle, 추가 작업 간격 2 cycle 및 103 cycle 계산이 맞습니다. 679행과 다른 예제입니다.

line 756 — `slide38_1.png`: ILP에서 thread parallelism으로 관심이 이동하는 역사적 설명에 맞습니다. 세로축은 clock이 아니라 MIPS입니다.

line 769 — `slide39_1.png`: Dennard scaling 한계 이후 성능 증가율 변화와 multicore 전환을 뒷받침합니다.

line 779 — `MemoryHierarchyDiagram`: 연산부→온칩 메모리→DRAM의 개념적 계층과 본문 순서가 맞습니다.

line 835 — `slide45_1.png`: ThreadBlock→32-thread Warp→Multiprocessor 관계가 일치합니다.

## Axis 4 — 기술적 정확성

이 파일에는 PyTorch API 실행 예제, dispatcher/autograd/Inductor 호출 경로, distributed/vLLM 구현 주장이나 PyTorch 2.13 문서 링크가 없습니다. 따라서 해당 버전과의 소스 대조 대상은 없으며 하드웨어·CUDA·컴파일러 주장을 검토했습니다. 아래 신뢰도는 교정 판단의 확신을 뜻합니다.

- **[A4-1] [severity: high] line 81** — 인용: "트랜지스터 수가 18개월마다 두 배씩 늘어났고" → 문제: 무어의 법칙의 대표적인 수정 예측은 약 2년마다 트랜지스터 수가 두 배라는 것입니다. 18개월을 트랜지스터 수의 고정 주기로 제시하는 것은 부정확합니다(신뢰도: high). → 제안: “무어의 법칙은 집적 가능한 트랜지스터 수가 대략 2년마다 두 배로 늘어나는 추세를 설명합니다.”로 고칩니다. [Intel의 역사 설명](https://www.intel.com/content/dam/www/public/us/en/documents/technology-briefs/intel-labs-multi-core-revolution-paper.pdf)

- **[A4-2] [severity: medium] line 113** — 인용: "즉 작업 간 의존성이 없어야 합니다. 이 조건만 만족된다면" → 문제: 의존성이 전혀 없어야 하는 것은 아니며, 필요한 값이 준비되는 순서를 지키면서 겹칠 수 있습니다. 또한 독립 작업이어도 실행 유닛·대역폭·동시 요청 수가 부족하면 throughput이 늘지 않습니다(신뢰도: high). → 제안: “작업 간 의존성과 자원 제한이 허용하는 범위에서 실행을 겹칠 수 있습니다.”로 바꿉니다.

- **[A4-3] [severity: high] line 418-420** — 인용: "소프트웨어만으로는 그 중첩을 표현할 수 없다는 것이 결정적인 제약이 됩니다." → 문제: 순차 ISA에서도 compiler가 unrolling, register allocation/renaming, software pipelining으로 서로 다른 iteration의 명령어를 섞을 수 있습니다. 제한은 레지스터·의존성·실행 자원이지 표현 자체의 불가능이 아니며 VLIW가 필수도 아닙니다(신뢰도: high). → 제안: “일반 ISA에서도 컴파일러가 iteration을 중첩하도록 명령어를 재배치할 수 있습니다. OOO는 이를 실행 중 동적으로 수행하고, VLIW는 병렬 발행할 묶음을 컴파일러가 명시합니다.”로 교체하고 같은 전제를 반복한 485행도 고칩니다. [GCC의 modulo scheduling·register moves](https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html#index-fmodulo-sched)

- **[A4-4] [severity: high] line 480-481** — 인용: "분기가 사라진 직선 코드이므로 최적화·재배치를 적용하기 훨씬 편해집니다." → 문제: branch prediction은 분기 명령을 제거하지 않습니다. 분기 자체는 실행되어 예측을 검증하며, renaming만으로 메모리 의존성이 없어지거나 topological order의 명령어가 모두 동시에 실행되는 것도 아닙니다(신뢰도: high). → 제안: “예측한 경로의 명령어를 미리 가져오되 분기 검증은 유지합니다. Renaming으로 레지스터의 이름 의존성을 제거한 뒤, 입력과 실행 자원이 준비된 명령어를 선택합니다.”로 고칩니다.

- **[A4-5] [severity: high] line 605-660** — 인용: "명령어 자체가 **Datapath 구조와 1:1로 대응**" → 문제: vertical/horizontal microcode는 제어 저장소의 microinstruction 표현을 설명하는 구분으로, RISC/CISC ISA와 VLIW ISA를 그대로 양분하지 않습니다. VLIW도 operation·operand를 decode하며, 뒤의 계층적 결합 단서만으로 표의 1:1 대응과 “비트가 유닛에 직결” 주장이 해결되지 않습니다(신뢰도: high). → 제안: “VLIW는 동시에 발행할 여러 operation을 instruction bundle에 명시합니다. 각 operation은 여전히 decode됩니다.”로 교체하고 microcode 비교는 별도 보충으로 분리합니다. [TI C6000의 VLIW decode 단계](https://software-dl.ti.com/trainingTTO/trainingTTO_public_sw/op6000/op6000_v1.51/op6000_student_guide_v1.51.pdf)

- **[A4-6] [severity: high] line 734-737** — 인용: "가지고 있는 프로그래밍 모델 자체가 VLIW와 다르기 때문에" → 문제: VLIW는 명령어 발행 방식이고 systolic array는 연산기와 데이터 전달 조직이라 서로 배타적인 선택지가 아닙니다. 질문 속 Tensor Core를 모두 systolic array로 보는 전제도 공개 ISA만으로 확정할 수 없습니다(신뢰도: high; Tensor Core 물리 배치: needs verification). → 제안: “Systolic array와 VLIW는 서로 다른 설계 층위입니다. VLIW 계열 제어 프로세서가 systolic matrix unit에 명령을 보낼 수도 있습니다. TPU MXU는 systolic array의 예이며 Tensor Core 내부 배치는 세대별 자료가 필요합니다.”로 답합니다. [TPU의 실행 유닛과 명령 흐름](https://docs.jax.dev/en/latest/pallas/tpu/details.html#what-is-a-tpu)

- **[A4-7] [severity: high] line 837** — 인용: "NVIDIA GPU 특유의 메모리 Latency Hiding 메커니즘에 맞게 특화된 이름이 SIMT라고 보면 됩니다." → 문제: SIMT와 SIMD의 차이를 latency hiding의 명칭 차이로 설명하면 thread별 제어 흐름과 상태를 놓칩니다. SIMT는 개별 thread의 실행·분기를 표현하고 하드웨어가 이를 묶어 실행하는 모델입니다(신뢰도: high). → 제안: “SIMT에서는 각 thread의 코드와 분기를 작성합니다. GPU는 Warp의 실행 가능한 thread들을 같은 명령으로 묶어 처리하며, thread별 분기 결과가 달라질 수도 있습니다.”로 고칩니다. [PTX의 SIMT/SIMD 구분](https://docs.nvidia.com/cuda/parallel-thread-execution/#simt-architecture)

- **[A4-8] [severity: high] line 856** — 인용: "in-flight Warp의 수를 **Occupancy**라고 부르는데" → 문제: Occupancy는 resident/active Warp 수를 SM의 최대 지원 Warp 수로 나눈 비율입니다. H100의 thread당 register 상한도 256이 아니라 255이며, 실제 적재 수는 block 크기·할당 단위·SMEM 등으로 추가 제한됩니다(신뢰도: high). → 제안: “Occupancy = resident Warp 수 / 최대 Warp 수입니다. H100에서 8 Warp가 상주하면 8/64=12.5%입니다. Register 상한은 thread당 255개이며 정확한 값은 block 구성까지 고려해 계산합니다.”로 고칩니다. [Occupancy 정의](https://docs.nvidia.com/cuda/archive/11.4.4/cuda-occupancy-calculator/index.html), [Hopper 자원 제한](https://docs.nvidia.com/cuda/hopper-tuning-guide/index.html#occupancy)

- **[A4-9] [severity: high] line 968-973** — 인용: "Scratchpad에 값을 넣고 빼는 모든 동작이 DMA로 명시 프로그래밍" → 문제: 대표 사례로 든 TPU에서도 HBM 전송용 DMA와 연산 유닛의 로컬 메모리 접근은 구분해야 합니다. 정적 scheduling은 모든 유닛의 실제 실행 cycle을 미리 확정한다는 뜻도 아니며, 비동기 연산과 완료 동기화가 존재합니다(신뢰도: high). → 제안: “이 유형의 가속기는 HBM↔온칩 메모리 전송을 DMA로 명시하고 연산과 겹칩니다. 컴파일러가 배치와 순서를 정하며, 실행 중에는 완료 신호로 의존성을 지킵니다.”로 바꾸고 1008행의 ‘계획 그대로 실행만’도 한정합니다. GPU에도 software-managed SMEM이 있음을 같은 자리에서 명시합니다. [TPU 메모리·비동기 실행](https://docs.jax.dev/en/latest/pallas/tpu/details.html#what-is-a-tpu), [CUDA 비동기 복사](https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/async-copies.html)

- **[A4-10] [severity: high] line 1012** — 인용: "| **작업 분할** | HW가 동적으로 처리 | SW(컴파일러)가 정적으로 처리 |" → 문제: GPU에서도 알고리즘을 tile·thread·block으로 분할하는 것은 programmer/compiler의 역할입니다. 하드웨어가 수행하는 block 배치와 Warp scheduling을 작업 분할과 혼동했으며 1017행 설명과도 모순됩니다(신뢰도: high). → 제안: GPU 열을 “SW가 thread·block별 작업 정의”, NPU 열을 “SW가 compute·DMA별 작업 정의”로 바꾸고 하드웨어 배치는 별도 행으로 구분합니다. [CUDA Programming Model](https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/programming-model.html)

- **[A4-11] [severity: medium] line 1026** — 인용: "Tensor Core는 일반 CUDA core보다 10배 이상 높은 연산 처리량을 제공하는데" → 문제: 칩 전체 peak인지 개별 유닛 비교인지, dtype·accumulation·sparsity 조건이 무엇인지 없어 보편적인 비율로 검증할 수 없습니다. 뒤의 실측 kernel 향상은 TMA·알고리즘 변화까지 포함하므로 이 하드웨어 비율의 근거가 되지 않습니다(신뢰도: high; 10배라는 일반화: needs verification). → 제안: 수치를 삭제해 “지원하는 행렬 연산에서는 Tensor Core의 처리량이 높아 데이터 공급이 중요합니다.”로 쓰거나 동일 GPU와 명시한 정밀도 조건의 peak를 비교합니다.

- **[A4-12] [severity: high] line 1104** — 인용: "또는 동치 표현으로 메모리 Bandwidth를 어떻게 최대한 활용하는가" → 문제: latency hiding과 bandwidth 활용은 동치가 아닙니다. 대역폭이 남아도 의존적인 접근은 latency에 제한될 수 있고, 대역폭이 포화되면 thread를 늘려도 처리량은 늘지 않으며 모든 workload의 최대 병목이 DRAM인 것도 아닙니다(신뢰도: high). → 제안: “메모리 병목에는 지연 시간과 대역폭 한계가 있습니다. 독립 작업 중첩은 대기를 가리고, 데이터 재사용은 필요한 전송량을 줄입니다. 병목은 workload에 따라 달라집니다.”로 교체합니다.

- **[A4-13] [severity: medium] line 890-891** — 인용: "모든 SM이 공유, 실측 ~5.5TB/s" → 문제: L2 대역폭의 실측 조건·벤치마크가 없어 재현하거나 다른 수치와 비교하기 어렵습니다. HBM3 80 GB·3.35 TB/s도 H100의 모든 제품 구성이 아니라 SXM 구성으로 한정해야 합니다(신뢰도: high; L2 5.5 TB/s: needs verification). → 제안: 표 제목을 “H100 SXM 메모리 계층”으로 고치고, L2 실측은 원 측정 자료의 접근 패턴·동시 SM 수·측정 방법을 붙이거나 삭제합니다. [NVIDIA H100 제품 사양](https://www.nvidia.com/en-us/data-center/h100/)

검산·대조 결과: 5+49×2=103, 990÷3.35≈295.5, 2250÷8≈281.25는 맞습니다. 본문의 TMA 역할, TMEM의 128×512×32-bit 구성, `tcgen05.mma` 단일 thread 발행과 같은 thread의 `tcgen05.commit` 완료 추적 설명은 공식 문서와 부합합니다. 명령 이름은 설명용 표기이며 완전한 실행 코드로 제시되지는 않았습니다. [Hopper TMA](https://docs.nvidia.com/cuda/hopper-tuning-guide/index.html#tensor-memory-accelerator), [PTX tcgen05](https://docs.nvidia.com/cuda/parallel-thread-execution/#tensorcore-5th-generation-family-instructions)

1079–1089행의 32→317→423→498→610→660→704→734→747→758→764 수치는 인용한 글의 표와 일치합니다. 약 107%라는 값도 그 글에 있으나, 원 실험은 Pranjal의 worklog를 재인용한 것이므로 shape별 보편 성능으로 확대하면 안 됩니다. [인용문과 단계별 표](https://www.aleksagordic.com/blog/matmul)

</details>
