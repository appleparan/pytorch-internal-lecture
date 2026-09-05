# Review: 05-distributed-programming.mdx (2026-09-05)

리뷰어: Claude Fable 5.1 (서브에이전트) + OpenAI Codex `gpt-6-astra`.
대상: `src/content/lectures/05-distributed-programming.mdx` (1157행). 읽기 전용 리뷰, 수정 없음.

## TL;DR

- **AI slop / 용어**: 담백한 편. "핵심/이것이 바로/정리하면" 반복(8곳), "랑데뷰·랑데부·Rendezvous" 3종 표기, 100행 "근사 모델"(SPMD 오기), "c10d (PyTorch Distributed Core Layer)" 비공식 풀네임, 694행 "컴파일러처럼 보이지만 컴파일러는 아닙니다" 자문자답. 두 리뷰어 일치.
- **이해도**: torchrun 파라미터 bullet(335–339)과 표(341–348)가 같은 내용을 서로 다르게 설명하고 실제 CLI와 어긋남. 분산 matmul의 수식(A=[A₀ A₁], B=[B₀; B₁] → AB=ΣAᵢBᵢ)과 DTensor `placements`/`Shard(0)` 최소 정의 누락. FSDP1 vs FSDP2 절(773–782)이 한 절에 LoRA/FP8/checkpoint/stream까지 몰림. 고아 footnote `[^arithmetic-intensity]`. 두 리뷰어 일치.
- **다이어그램**: 15개 중 대부분 정상. 공통 지적: 아키텍처 SVG(149)에 "Backend" 라벨·NCCL library 연결 없음, `TorchrunVisualizer`(392)가 spawn → rendezvous로 **순서가 뒤집혀** 있고 endpoint/스크립트명이 본문과 다름, `fsdp2_workflow.png`(761)는 위치·밀도 문제, Megatron TP 그림(883)은 f/g·`Y=XA` vs `Linear.weight=[out,in]` 전치 설명 없음, all-reduce 분해 그림(830)의 조각 표기 불일치.
- **정확성**: **이 강의가 7개 중 가장 많은 사실 오류**. 두 리뷰어 공통 high 6건:
  1. 484–493행 `distributed_data`가 **local rank**로 슬라이스하고 world_size로 나눔 → 2노드에서 결과가 틀림(Codex는 NumPy로 재현: 정답 `[90,100,110,120]` vs `[22,28,34,40]`).
  2. 541행 "`set_device()`는 CUDA 초기화를 안 함" → v2.13.0 `THCPModule_setDevice_wrap`이 `device_lazy_init`을 호출. 반대.
  3. 362행 `--rdzv_backend=c10d`에서 `--node_rank`는 무시됨(v2.13 `run.py`).
  4. 337행 "사용할 backend(NCCL/Gloo)"는 torchrun 인자가 아님.
  5. 554/578행 NCCL `wait()`는 CPU를 막지 않고 현재 stream에 의존성만 검.
  6. 607행 torchrun 아래에서는 agent가 TCPStore를 host, 모든 worker는 client.
- Codex만 잡은 high: 520–534행 재게시 코드에 `.to(device)` 누락 → CPU tensor로 NCCL broadcast 실패. 386–409행 torchrun 순서(agent rendezvous → worker spawn, 본문은 반대). 727행 "DDP forward는 통신 없음"(buffer broadcast 있음). 819행 "reshard 통신"(reshard는 해제, 통신 아님). 843행 "FSDP는 P/world_size"(peak는 full 버퍼+activation 추가). 983행 DeepSpeed 예제 `training_data` 없이 dataloader 반복. 1019행 ZeRO-2/3 통신 시점. 1064행 Accelerate DeepSpeed 경로. 1148행 "NVCC는 커널 하나 컴파일". 922행 "8~16-way 한계"는 TPU v5p 분석을 GPU 일반론으로.
- Fable만 잡은: 631행 `destroy_process_group`은 barrier 아님(Codex도 medium으로 비슷하게), 686행 FSDP1 "deprecated"(소스에 warning 없음), 694행 TP `parallelize_module`은 in-place(클래스 교체 아님), 305행 UCC는 빌드 옵션, 672행 1.11은 beta.

## 두 리뷰어가 일치한 항목 (우선 수정 후보)

| line | 문제 | 제안 |
|---|---|---|
| 24-33 | 목차 bullet에 미정의 약어 다수 | 4줄로 축약, 약어는 해당 절에서 |
| 100 | "근사 모델" | SPMD |
| 149-154 | 아키텍처 SVG Backend 라벨·NCCL lib 없음, "process_group ≈ world" | ProcessGroup 행에 backend 라벨, `default process group = world` |
| 167 | "c10d (PyTorch Distributed Core Layer)" | "c10d: 분산 통신 API와 구현" |
| 324 | "함께 물고 들어간 task들을…" | "각 node에서 worker process를 시작하고 env를 설정하는 실행기" |
| 333-350 | 파라미터 bullet+표 중복·불일치, "사용할 backend", "할당된 모델 부분" | 실제 flag만으로 표 재구성. backend는 스크립트 몫 |
| 338/388 | 랑데부/랑데뷰 | rendezvous |
| 362-379 | `--node_rank` (c10d에서 무시) | 제거. "두 노드에서 완전히 같은 명령" |
| 392 | TorchrunVisualizer 순서·포트·스크립트명 | agent rendezvous → env → spawn → init 순, 29500, 파일명 통일 |
| 484-500 | local rank 슬라이스 버그, 수식 없음 | `rank`로 슬라이스, `local_rank`는 device만. `AB=A₀B₀+A₁B₁` 한 줄 + `torch.ones` 대신 비균일 입력 |
| 502-506 | "nccl이면 GPU 연산" | 통신 backend 선택일 뿐. 계산 device는 tensor가 결정 |
| 541 | set_device가 lazy init 안 함 | 반대. `device_lazy_init` 호출 |
| 554/578 | `wait()` = CPU blocking | 현재 stream에 의존성 설정 |
| 585-625 | 초기화 "두 가지", rank 0이 daemon | `env://`(기본)·tcp·file 구분. torchrun 아래선 agent store, 전원 client |
| 631-633 | destroy가 collective처럼 hang | 모든 rank가 일관된 순서로 호출. 불일치 시 NCCL hang 가능 |
| 694 | "컴파일러처럼 보이지만…", TP도 클래스 wrap | 삭제. FSDP2=클래스 교체, TP=in-place parameter/hook |
| 709-710 | `Net().to(rank)`, `device_ids=[rank]` | `local_rank`. DistributedSampler·set_epoch 추가 |
| 748-757 | `placements`/`Shard(0)` 미정의 | mesh 축 vs tensor 차원 한 줄 정의 |
| 761 | fsdp2_workflow.png 위치·밀도 | 815행 뒤로, 한 rank·한 module만 |
| 777-779 | FSDP1 "일부만 freeze 불가" | `use_orig_params=True`면 가능, 비용은 gradient 메모리 |
| 781 | "통신 없는 sharded checkpointing" | all-gather 불필요일 뿐. DCP는 metadata 조율 있음. FSDP1도 SHARDED_STATE_DICT 있음 |
| 830 | 분해 그림 A/B/C/D 표기 재사용 | 합산 조각 S₀..S₃로 |
| 841/923 | 고아 footnote, "앞 절의 임계" 없음 | 839행에 참조 삽입 |
| 883 | Megatron 그림 f/g·전치 설명 없음 | "A=Wᵀ, Colwise(w1)=A 열분할, g=all_reduce" |
| 918-925 | FSDP1+TP "합성 불가", "8~16-way 한계" | FSDP1도 `DTensorExtensions`로 조합 가능. 8~16은 TPU v5p 분석 조건 명시 |
| 1078-1087 | Ray 예제 `optimizer` 미정의 | `prepare_optimizer(Adam(model.parameters()))` |

## 한쪽만 제기한 항목 (검토 필요)

- **Codex A4-2 (high) line 520-534**: 재게시 함수에 `.to(device)` 없음 → CPU tensor로 NCCL broadcast 실패.
- **Codex A4-5 (high) line 386-409**: torchrun은 agent rendezvous 후 worker spawn. 본문은 spawn 후 worker 전원 rendezvous로 반대.
- **Codex A4-12 (high) line 727/823**: DDP forward에 buffer broadcast 통신 있음.
- **Codex A4-15 (high) line 819**: "reshard 통신" → reshard는 full parameter 해제, 통신 아님.
- **Codex A4-16 line 821-828**: 2P/3P의 단위(byte? 원소?), rank당 송신인지 미정의. `2(N−1)P/N`, `3(N−1)P/N`.
- **Codex A4-17 (high) line 843-848**: "FSDP는 P/world_size" → peak에는 full 버퍼·prefetch·activation 추가.
- **Codex A4-20/21/23/24/25 (high)**: DeepSpeed 예제 `training_data` 누락, ZeRO-2/3 통신은 microbatch마다, Accelerate DeepSpeed optimizer step은 no-op·BF16은 loss scaling 없음, Ray `FailureConfig`만으로 복구 안 됨(checkpoint 저장·복원 필요).
- **Codex A4-26 (high) line 1148**: "NVCC는 단일 커널 컴파일" → compiler driver. op:kernel 1:1 아님.
- **Codex A4-27 line 1151**: Rebellions compiler sharding 범위 needs verification.
- **Fable A4-8 line 686**: FSDP1 "deprecated" → 소스에 warning 없음, tutorial 배너 수준. needs verification.
- **Fable A4-14 line 305-313**: UCC는 built-in 4개(gloo/mpi/nccl/xccl)에 없음, 빌드 옵션.
- **Fable A4-17 line 672**: 1.11 편입은 beta.
- **Fable A4-19 line 893**: FSDP2 dim-0 sharding은 기본값, `shard_placement_fn`으로 변경 가능.
- **Fable A2-9 line 918**: 한 문단에 2D DTensor/3D/CP·EP/torchtitan/FSDP1 역사 5주제.

## 원문 리뷰

<details><summary>Fable 5.1 전문</summary>

# Lecture 05 리뷰 — `src/content/lectures/05-distributed-programming.mdx`

## TL;DR

- **Axis 1 (AI slop/용어)**: 전반적으로 담백함. "핵심/이것이 바로/정리하면" 반복, "랑데뷰·랑데부·Rendezvous" 혼용, "근사 모델" 같은 오타성 표현 정도.
- **Axis 2 (이해도/장황)**: 대체로 따라갈 수 있음. torchrun 파라미터 설명(bullet+표)이 실제 CLI와 어긋나 혼란, FSDP1 vs FSDP2 절의 bullet이 슬라이드 한 장 분량을 넘음, 고아 footnote 1개.
- **Axis 3 (다이어그램)**: 대부분 텍스트와 일치. `fsdp2_workflow.png`는 위치가 설명보다 앞이고 h-48에서 글자가 안 보임, Megatron 그림은 f/g 설명 없이 붙어 있음, 아키텍처 SVG는 텍스트의 "Backend" 레이어 명칭이 없음.
- **Axis 4 (기술 정확성)**: high 4건. (1) `distributed_data`가 **local rank**로 슬라이스해 2노드 예제 결과가 틀림, (2) `torch.cuda.set_device()`가 CUDA 초기화를 안 한다는 주장은 v2.13.0 소스와 반대, (3) `--rdzv_backend=c10d`에서는 `--node_rank`가 무시됨, (4) "사용할 backend(NCCL/Gloo)"는 torchrun 파라미터가 아님. 그 외 NCCL `wait()` semantics, torchrun 하의 TCPStore host 주체, TP의 클래스 wrap 주장 등 medium 다수.
- **가장 중요한 수정 3개**: A4-1(예제 코드 rank 버그) → A4-2(set_device lazy init) → A4-3/A4-4(torchrun 파라미터 설명).

---

## Axis 1 — AI slop / 용어

- **[A1-1] [severity: medium] line 100** — 인용: "특히 PyTorch로 작성된 근사 모델의 경우 대부분 이런 방식을 따릅니다" → 문제: "근사 모델"은 존재하지 않는 용어(전사 오류로 보임). 이 문단이 말하려는 표준 용어는 **SPMD**(Single Program, Multiple Data). → 제안: "PyTorch 학습 스크립트도 대부분 이 SPMD(single program, multiple data) 방식을 따릅니다."
- **[A1-2] [severity: medium] line 338, 388, 394, 396** — 인용: "랑데부 host" / "랑데뷰 (rendezvous)" / "랑데뷰는 분산 job에" → 문제: 같은 개념을 "Rendezvous"(115, 145, 156), "랑데뷰", "랑데부" 세 표기로 씀. 덱 전체가 영어 기술 용어를 그대로 쓰는 방침이므로 음차가 튐. → 제안: 본문 전체를 "rendezvous"로 통일 (`sed 's/랑데뷰/rendezvous/g; s/랑데부/rendezvous/g'` 수준).
- **[A1-3] [severity: low] line 61** — 인용: "OpenMP는 CPU들이 약간 tight하게 couple되어 있다고 생각하고" → 문제: 구어 전사 그대로. → 제안: "OpenMP는 CPU들이 tightly coupled되어 있다고 보고 **Shared Memory** 모델을 가정합니다."
- **[A1-4] [severity: low] line 67** — 인용: "이 차이가 메모리 시스템에 대한 가정 차이에서 기인하는 것인지는 확실하지 않지만" → 문제: 결론 없는 hedging 삽입구. → 제안: 삭제하고 "두 모델은 병렬 작업을 조직하는 방식도 다릅니다."로 시작.
- **[A1-5] [severity: low] line 324** — 인용: "함께 물고 들어간 task들을 노드들이 모여 함께 수행하는 형태가 됩니다" → 문제: 의미가 잡히지 않는 문장. → 제안: "각 node에서 torchrun을 한 번씩 실행하면 node들이 하나의 job으로 묶입니다."
- **[A1-6] [severity: low] line 336** — 인용: "현재 프로세스의 인덱스(task 번호)" → 문제: "task 번호"는 만든 용어. 표준은 node rank(`--node_rank`)이며, 그마저 static rendezvous에서만 쓰임(A4-3 참고). → 제안: "node rank — static rendezvous에서만 필요" 또는 항목 삭제.
- **[A1-7] [severity: low] line 362, 697, 719, 729** — 인용: "이것이 바로 앞서 설명한 MPI 스타일의" / "이 부분이 `torch.distributed`의 핵심 기능입니다" / "이것이 DDP 내부 동작의 핵심입니다" / "**Backward** 단계가 핵심입니다" → 문제: "핵심/이것이 바로" 강조 프레임 반복. → 제안: 362 "앞서 본 MPI 스타일의 SPMD 패턴입니다.", 719 "gradient 동기화는 DDP가 backward hook 안에서 수행합니다.", 729 "**Backward**에서 통신이 일어납니다."
- **[A1-8] [severity: low] line 777** — 인용: "이 변화가 왜 중요한지는 한 가지 사실에서 출발합니다." → 문제: suspense 문장. → 제안: 삭제하고 바로 "`requires_grad`와 `dtype`은 tensor당 하나뿐인 속성입니다."로 시작.
- **[A1-9] [severity: low] line 731, 843, 969, 1109** — 인용: "정리하면 DDP는" / "따라서 결정 기준은 하나입니다" / "정리하면 필요 조건이 명확합니다" / "정리하면 세 도구는" → 문제: "정리하면" closer 남용. → 제안: 969, 1109는 "정리하면" 제거하고 문장 바로 시작; 843은 "결정 기준:"로.
- **[A1-10] [severity: low] line 406** — 인용: "IPC에 사용할 c10d backend를 먼저 띄웁니다" → 문제: IPC는 한 호스트 안의 프로세스 통신을 뜻하는 약어인데 여기서는 node 간 TCP. 약어도 정의 없음. → 제안: "rendezvous 정보를 교환할 c10d store(TCPStore)를 먼저 띄웁니다".
- **[A1-11] [severity: low] line 169** — 인용: "`all-reduce`, `broadcast` 같은 Collective API" → 문제: code font에 하이픈 표기. 실제 API는 `all_reduce`. → 제안: "`all_reduce`, `broadcast`".

## Axis 2 — 이해도 / ELI5 균형 / 장황함

- **[A2-1] [severity: high] line 333-348** — 인용: "각 node에서 실행할 때 torchrun에 넘겨야 하는 핵심 파라미터들은 다음과 같습니다." → 문제: bullet(335-339)과 표(341-348)가 같은 내용을 두 번, 그것도 서로 다르게 설명함. bullet에는 실제 없는 "사용할 backend"가 있고, 표에는 `test.py`가 있는데 위 명령은 `dist_matmul_allreduce.py`를 씀. 초심자는 `--rdzv-backend`와 "backend(NCCL)"를 같은 것으로 오해. → 제안: bullet 삭제, 표를 327-330 명령의 실제 flag만으로 재구성(`--nnodes`, `--nproc_per_node`, `--rdzv_id`, `--rdzv_backend`, `--rdzv_endpoint`, 스크립트).
- **[A2-2] [severity: medium] line 32** — 인용: "모델 병렬화 패키지들 - 무엇이 GPU 메모리를 차지하는지에서 출발해, Data Parallel 축(DDP → ZeRO → FSDP)과 ..." → 문제: 목차 bullet 하나가 세 줄. → 제안: "모델 병렬화 패키지들 - Data Parallel 축(DDP→ZeRO→FSDP)과 Model Parallel 축(TP/SP/PP), 그리고 이들이 c10d collective 위에서 동작하는 방식".
- **[A2-3] [severity: medium] line 315** — 인용: "내부 virtual function의 정확한 개수는 PyTorch 버전에 따라 달라지므로 API 계약으로 사용하지 않습니다." → 문제: 독자에게 아무 정보도 주지 않는 문장(무엇의 virtual function인지도 없음). → 제안: 삭제.
- **[A2-4] [severity: medium] line 350** — 인용: "PyTorch가 그 프로세스에 할당된 모델 부분을 수행하기 시작합니다" → 문제: 이 절의 예제는 matmul이지 모델이 아님. "할당된 모델 부분"은 뒤의 TP/PP를 미리 끌어온 표현. → 제안: "각 프로세스가 지정된 스크립트를 실행합니다."
- **[A2-5] [severity: medium] line 390 vs 413** — 인용: "fault tolerance를 위해 checkpointing과 logging을 지원합니다" → 문제: 413에서는 "별도의 checkpoint 저장이 필요합니다"라고 반대로 말함. torchrun은 재시작만 하고 checkpoint는 사용자 몫. → 제안: 390을 "worker 실패 시 `--max-restarts=N`까지 재시작합니다. 학습 상태 복구용 checkpoint는 사용자가 저장해야 합니다."로.
- **[A2-6] [severity: medium] line 653** — 인용: "위와 같이 fp16/bf16 parameter와 gradient, fp32 master weight 및 Adam state를 사용하는 구성에서는 parameter당 약 16 byte가 필요합니다. ..." → 문제: 4문장이 같은 얘기를 반복. → 제안: "이 구성에서 parameter당 16 byte. 7B 모델이면 weight 14GB, 학습 상태는 activation 제외 112GB — inference의 8배입니다. 각 병렬화 전략은 이 상태 중 무엇을 rank별로 나눌지로 구분됩니다."
- **[A2-7] [severity: medium] line 781** — 인용: "**통신 없는 sharded checkpointing**: FSDP1의 shard는 이어붙인 1D 버퍼를 world_size로 등분한 조각이라 parameter 경계와 어긋납니다. ..." → 문제: bullet 하나가 6문장, 괄호 삽입 2개. 슬라이드에서 읽히지 않음. → 제안: "FSDP1 shard는 1D 버퍼를 등분한 조각이라 parameter 경계와 어긋나, 조각만으로는 어느 parameter인지 알 수 없었습니다. FSDP2 shard는 dim-0 조각 + shape/placement metadata라 각 rank가 자기 조각을 그대로 저장·로드할 수 있습니다." 나머지는 footnote로.
- **[A2-8] [severity: medium] line 841, 923** — 인용: "[^arithmetic-intensity]: 연산량(FLOPs)을 데이터 이동량(bytes)으로 나눈 값." / "앞 절에서 본 것처럼 per-device batch가 임계 이상인 한" → 문제: footnote 정의만 있고 본문에서 `[^arithmetic-intensity]` 참조가 없음 → remark-gfm이 조용히 버림. 그리고 923의 "앞 절에서 본 임계"는 앞 절(837-839)에 없음. → 제안: 839 끝에 "...통신 비중이 증가합니다. 이 비율이 hardware의 임계 arithmetic intensity[^arithmetic-intensity] 아래로 내려가면 통신이 병목입니다."를 넣어 참조를 살리고 923이 가리킬 기준을 만들 것.
- **[A2-9] [severity: medium] line 918** — 인용: "이 조합이 자연스럽게 동작하는 이유는 FSDP2와 TP가 같은 DTensor 추상화 위에 있기 때문입니다. ..." → 문제: 한 문단에 2D DTensor, 3D parallelism, CP/EP 예고, torchtitan, FSDP1 역사까지 5개 주제. → 제안: (1) DTensor 2D placement 설명, (2) "PP/CP/EP를 얹으면 3D+; torchtitan이 대표 구현" 두 문단으로 나누고 FSDP1 문장은 A4-13 반영해 한 줄로.
- **[A2-10] [severity: low] line 922** — 인용: "계산은 거기에 feed-forward 폭 F까지 곱해진 크기입니다" → 문제: 기호 F가 문장 중간에 정의 없이 등장하고 TP degree 기호는 없음. → 제안: 첫 문장에서 "(hidden D, FFN 폭 F, TP degree Y)"를 선언하고 "비율 ∝ F/Y"로 표기.
- **[A2-11] [severity: low] line 246** — 인용: "Pipeline Parallel과 ring 방식의 Context Parallel 등이 대표적인 사용 사례입니다." → 문제: PP/CP는 636 이후에야 소개됨. 예시로만 쓰인 것이라 치명적이진 않으나 "ring 방식"은 여기서 의미가 없음. → 제안: "Pipeline Parallel, Context Parallel(둘 다 뒤에서 다룸)".
- **[A2-12] [severity: low] line 552** — 인용: "먼저 PyTorch의 ProcessGroup C++ binding으로 전달되어 초기화된 ProcessGroup을 확인하고, NCCL backend를 사용하는지 확인합니다." → 문제: 내부 동작 절인데 함수 이름이 하나도 없어 추상적. → 제안: "`dist.all_reduce` → `_get_default_group()` → `ProcessGroup.allreduce`(pybind) → `ProcessGroupNCCL::allreduce` → `ncclAllReduce`" 경로를 한 줄로.

## Axis 3 — 다이어그램

- **[A3-1] [severity: low] line 117-143** — Mermaid(World/Node/Rank + Rendezvous): 텍스트(113)와 rank 번호·local rank 일치. 문제 없음.
- **[A3-2] [severity: low] line 185-207, 214-236** — Mermaid(default PG / 2 subgroups): 텍스트와 일치. 나머지 nit: 185의 hidden subgraph `C1[" "]`는 Mermaid 버전에 따라 빈 박스 테두리가 보일 수 있으니 렌더 확인.
- **[A3-3] [severity: medium] line 149-154** — 인용: alt="torch.distributed 전체 아키텍처: ... 각 Process 내부는 High-level 패키지, c10d, Backend 레이어로 구성" → 문제: 텍스트(164-172)는 레이어를 "Backend / c10d / High-level 패키지"로 부르는데 SVG에는 "Backend"라는 글자가 없고 "ProcessGroup Gloo/NCCL/MPI/Custom" 행만 있음. 또 SVG는 CUDA·MPI lib·CPU/GPU까지 두 층을 더 그려 텍스트의 "세 개의 레이어"와 안 맞음. 표(307-313)의 XCCL도 없음. "process_group ≈ world" 캡션은 본문에서 설명 안 함. → 제안: SVG의 ProcessGroup 행 왼쪽에 "backend" 라벨 추가(c10d 라벨처럼), 본문 164를 "**Backend (ProcessGroupNCCL / ProcessGroupGloo / ...)**"로 맞추고, "그 아래 CUDA/MPI 라이브러리와 device"를 한 줄 언급.
- **[A3-4] [severity: low] line 45, 54, 74, 83, 98** — MPI/OpenMP 메모리 모델, Barrier, Fork-Join, MPI 프로그램 구조 그림: 모두 텍스트와 일치. 문제 없음.
- **[A3-5] [severity: low] line 264-293** — Scatter/Gather/Reduce/All-Reduce/Broadcast/All-Gather PNG(dist_tuto 출처): 텍스트와 일치. nit: 296-300의 Reduce-Scatter/All-to-All만 그림이 없음. → 제안: "(Reduce-Scatter 그림은 뒤 DDP vs FSDP 절의 분해 그림 참고)" 한 줄.
- **[A3-6] [severity: medium] line 761** — 인용: `fsdp2_workflow.png ... class="h-48"` → 문제: (1) 이 그림이 보여 주는 load shard → all-gather → forward → free → all-gather → backward → reduce-scatter → free → update 흐름은 798-815("FSDP 내부 동작")에서 설명되는데, 그림은 그 앞의 클래스 바꿔치기 문단(759) 밑에 있음. (2) 원본이 2000px 폭 2행 구성이라 h-48(192px)로 줄이면 박스 글자가 읽히지 않음. → 제안: 815 뒤로 이동, 한 rank 행만 crop하거나 `wide` + h-64 이상.
- **[A3-7] [severity: low] line 806** — implicit prefetch 타임라인: 804 텍스트와 정확히 일치. 문제 없음.
- **[A3-8] [severity: low] line 830** — All-Reduce = Reduce-Scatter + All-Gather 그림: 826 footnote·828 텍스트와 일치. 문제 없음.
- **[A3-9] [severity: medium] line 883** — 인용: alt="Megatron-LM의 Tensor Parallel 분할 다이어그램" → 문제: 그림은 f/g conjugate 연산자(f: forward identity·backward all-reduce, g: forward all-reduce), GeLU 사이 분할, attention head 분할까지 담고 있는데 본문은 f/g를 한 번도 언급하지 않고, 코드의 `ColwiseParallel(w1)`/`RowwiseParallel(w2)`가 그림의 A=[A1,A2]/B=[B1;B2]에 해당한다는 매핑도 없음. 895의 "row parallel 끝에서 all_reduce 한 번"이 바로 g인데 연결이 안 됨. 논문 캡션 텍스트는 h-56에서 읽을 수 없음. → 제안: 883 아래에 "A=[A1,A2]가 `ColwiseParallel(w1)`, B=[B1;B2]가 `RowwiseParallel(w2)`, g가 895의 `all_reduce`" 한 줄 추가. (a) MLP만 crop.
- **[A3-10] [severity: low] line 392** — `<TorchrunVisualizer />`: 컴포넌트 내부 텍스트가 endpoint `192.168.0.2:29400`, 스크립트 `train.py`, "DistributedSampler"를 쓰는데 본문은 `29500`, `dist_matmul_allreduce.py`, sampler 없음. stage 1 설명 "--node_rank만 0/1로 다르게 줍니다"는 A4-3과 같은 오류. → 제안: 포트·스크립트명 본문과 통일, stage 1 문구 수정.

## Axis 4 — 기술 정확성

- **[A4-1] [severity: high] line 484-493** — 인용: "local_A = A[:, lrank*k:(lrank+1)*k].to(device)" (with `k = n // world_size`) → 문제: 슬라이스 인덱스에 **local rank**(0~7)를 쓰면서 나눗수는 **world_size**(16)를 씀. 2노드 예제에서 rank 8~15는 rank 0~7과 같은 블록을 계산하므로 `all_reduce` 결과는 앞 8000열 기여분이 2배, 뒤 8000열 기여분은 0 — 결과가 틀림. 430-433에서 `LOCAL_RANK`를 넘기는 것이 원인. (confidence: high) → 제안: 함수 인자를 `(A, B, rank, local_rank, world_size)`로 바꿔 슬라이스는 `rank`, device는 `local_rank`로; 432에 `int(os.environ["RANK"])` 추가.
- **[A4-2] [severity: high] line 541** — 인용: "`torch.cuda.set_device()`를 호출하는 것만으로는 CUDA 초기화가 발생하지 않는다는 것입니다." → 문제: v2.13.0 `torch/csrc/cuda/Module.cpp` `THCPModule_setDevice_wrap`은 `torch::utils::device_lazy_init(at::kCUDA);` 를 먼저 호출한 뒤 `c10::cuda::set_device(...)`를 실행함. 즉 `set_device`는 lazy init을 **트리거**하고 해당 device의 context를 만든다. 뒤 문장의 "Tensor를 최초로 GPU에 만들 때 비로소"도 이 호출에는 해당 안 됨. (confidence: high, 소스 확인) → 제안: "`set_device`는 CUDA lazy init을 일으켜 그 GPU에 context를 만듭니다. 그래서 `init_process_group` 전에 호출해야 NCCL communicator가 올바른 device에 붙습니다(또는 `init_process_group(device_id=...)`)."
- **[A4-3] [severity: high] line 362, 345, 367-379** — 인용: "두 노드 모두 동일한 스크립트(`dist_matmul_allreduce.py`)를 실행하지만, `node_rank`만 다르게 지정합니다." → 문제: `--rdzv_backend=c10d`에서는 `--node_rank`가 무시됨. v2.13.0 `torch/distributed/run.py` 866행: `"node_rank is only used for static rdzv_backend. It will be ignored ..."`; rank는 rendezvous가 부여. 두 노드의 명령은 사실상 동일하며, 그게 SPMD의 요점이기도 함. (confidence: high) → 제안: 명령에서 `--node_rank` 제거하고 "두 노드에서 완전히 같은 명령을 실행합니다. rank는 rendezvous가 정합니다."로. static rendezvous를 보여 주고 싶으면 `--rdzv_backend=static --master_addr=... --node_rank=...`로 별도 예시.
- **[A4-4] [severity: high] line 337** — 인용: "**사용할 backend** - NCCL, Gloo 등 실제 통신 라이브러리" → 문제: torchrun에는 통신 backend를 고르는 flag가 없음. NCCL/Gloo는 스크립트 안 `init_process_group(backend=...)`에서 정함. 표의 `--rdzv-backend`(c10d/etcd)와 혼동을 유발. (confidence: high) → 제안: 항목 삭제, 350 뒤에 "통신 backend(NCCL/Gloo)는 torchrun이 아니라 스크립트의 `init_process_group`에서 정합니다." 추가.
- **[A4-5] [severity: medium] line 554, 578** — 인용: "all_reduce는 기본적으로 blocking 연산이지만" / "work.wait()    # blocking: 완료까지 대기" → 문제: NCCL(CUDA) collective에서 `wait()`는 **현재 CUDA stream**을 통신 stream에 대기시킬 뿐 CPU를 막지 않음. v2.13 docs: "In the case of CUDA collectives, will block the currently active CUDA stream until the operation is completed (but will not block the CPU)". `async_op=False`라도 CPU는 바로 다음 줄로 넘어감. 이 강의의 "동기화(CUDA Runtime)" 절 제목과 직결되는 부분. (confidence: high) → 제안: "NCCL에서는 `wait()`가 CPU를 막지 않고 현재 stream에 의존성만 건다. 그래서 sync/async 차이는 stream ordering을 자동으로 걸어 주느냐의 차이다." 주석은 `# 현재 stream이 통신 완료를 기다리도록 의존성 추가`.
- **[A4-6] [severity: medium] line 607** — 인용: "이때 rank == 0인 프로세스만 daemon을 생성하고, 나머지 프로세스들은 이 daemon에 connect하는 구조입니다." → 문제: torchrun 아래에서는 다름. v2.13.0 `rendezvous.py` `_create_c10d_store`: `_torchelastic_use_agent_store()`가 True면 **모든 rank가 `is_master=False` client**를 만들고 TCPStore server는 node-rank-0의 **agent(torchrun 프로세스)**가 host. rank 0 worker가 daemon을 띄우는 것은 torchrun 없이 env://로 직접 띄울 때. 또 "UNIX process 간 통신"은 부정확(TCP). (confidence: high) → 제안: "torchrun 아래에서는 agent가 띄운 TCPStore에 모든 worker가 client로 붙고, 수동 실행(env://)에서만 rank 0 worker가 server를 겸합니다."
- **[A4-7] [severity: medium] line 631** — 인용: "Collective operation처럼 동작하므로, 일부 프로세스만 호출하면 나머지 프로세스들이 영원히 기다리게 됩니다." → 문제: v2.13.0 `destroy_process_group`은 pending work를 기다린 뒤 각 backend `shutdown()`을 호출할 뿐 barrier를 치지 않음. 소스 주석은 "ncclCommAbort() was a 'collective' call in some versions of NCCL"이라 일부 NCCL 버전에서 hang 가능성을 말하는 정도. "영원히 기다린다"는 단정은 과함. (confidence: medium) → 제안: "모든 rank가 호출해야 하며, 일부만 호출하면 NCCL 버전에 따라 hang하거나 리소스가 새는 등 정의되지 않은 상태가 됩니다."
- **[A4-8] [severity: medium] line 686** — 인용: "FSDP1은 deprecated되었으며, 기존 code와 API는 아직 남아 있지만" → 문제: v2.13.0 소스에는 `FullyShardedDataParallel` 클래스/모듈 수준 deprecation warning이 없음(개별 인자·메서드만). Deprecation 문구는 PyTorch tutorial 배너와 HF 문서에 있음. → 제안: "공식 tutorial은 FSDP1을 legacy로 표시하고 FSDP2를 권고합니다(API 자체는 아직 남아 있음)." (needs verification: docs.pytorch.org/tutorials FSDP1 페이지 배너 문구 확인)
- **[A4-9] [severity: medium] line 694** — 인용: "Python의 동적 클래스 생성 능력을 활용해 FSDP/TP가 해야 할 일을 함수로 정의하고 그것을 새로운 클래스로 wrap한 뒤 리턴하는 방식" → 문제: FSDP2는 맞음(759: `FSDPTransformer`로 class swap, 소스 `_fully_shard.py` 294행 `"FSDP"` prefix). TP의 `parallelize_module`은 module을 **in-place**로 바꿈 — parameter를 DTensor로 교체하고 pre/post hook을 등록할 뿐 클래스는 그대로. (confidence: high) → 제안: "FSDP2는 클래스를 바꿔치기하고, TP는 parameter 교체 + hook 등록으로 같은 module을 in-place로 바꿉니다. 어느 쪽도 컴파일은 아닙니다."
- **[A4-10] [severity: medium] line 709-710** — 인용: "model = Net().to(rank)" / "model = DDP(model, device_ids=[rank])" → 문제: global rank를 device index로 씀. 2노드 예제(539의 LOCAL_RANK 설명)와 모순되고 다중 노드에서는 `cuda:8` 등으로 실패. (confidence: high) → 제안: `local_rank` 사용, 주석 "device는 LOCAL_RANK".
- **[A4-11] [severity: medium] line 779** — 인용: "FSDP1에서는 둘이 같은 FlatParameter에 묶이면 `requires_grad`가 하나뿐이라 '일부만 freeze'를 표현할 수 없었습니다" → 문제: FSDP1도 `use_orig_params=True`면 한 FlatParameter 안에 frozen/trainable을 섞을 수 있음(HF fsdp1_vs_fsdp2 문서도 이 조건을 명시). 진짜 비용은 FlatParameter 전체 크기의 gradient 메모리가 잡히는 것. (confidence: medium-high) → 제안: "FSDP1은 `use_orig_params=True`로 섞을 수는 있었지만 FlatParameter 전체에 gradient 메모리가 잡혔습니다. FSDP2는 parameter별 flag라 frozen parameter에 gradient 메모리가 없습니다."
- **[A4-12] [severity: medium] line 781** — 인용: "저장하려면 조각을 모으는 통신이 필요했습니다(FULL_STATE_DICT 저장 시 rank 0에 메모리가 몰리는 원인)" → 문제: FSDP1에도 `StateDictType.SHARDED_STATE_DICT`가 있어 통신 없이 rank별 shard를 저장할 수 있었음(ShardedTensor + `torch.distributed.checkpoint`). 통신이 필요한 건 FULL_STATE_DICT일 때. → 제안: "FULL_STATE_DICT는 rank 0에 전부 모아야 했고, SHARDED_STATE_DICT는 parameter 경계와 어긋난 조각을 ShardedTensor metadata로 보정해야 했습니다. FSDP2의 shard는 DTensor 자체가 metadata를 들고 있어 그대로 저장됩니다."
- **[A4-13] [severity: low] line 918** — 인용: "FSDP1의 FlatParameter 시절에는 이런 조합이 어색했지만(모든 parameter가 1D로 뭉개져 있어 다른 병렬화와 합성 불가)" → 문제: FSDP1 + TP 2D parallel은 `use_orig_params=True`로 PyTorch 2.0~2.3 tutorial에서 지원했음. "합성 불가"는 과함. → 제안: "(FlatParameter와 DTensor 사이 변환이 필요해 조합이 제한적이었음)".
- **[A4-14] [severity: low] line 305-313** — 인용: "PyTorch가 기본으로 제공하는 backend는 다음과 같습니다: ... UCC | 등록 가능한 experimental backend" → 문제: v2.13 docs는 "four built-in backends"(gloo, mpi, nccl, xccl)라고 명시. UCC는 `USE_UCC` 빌드 옵션. 같은 docs가 TorchComms backend도 소개함. → 제안: 표 제목을 "built-in 4개 + 옵션"으로 나누거나 UCC 행에 "(빌드 옵션)" 표기.
- **[A4-15] [severity: low] line 503** — 인용: "`nccl`을 쓰면 GPU 연산을 한다는 뜻이고" → 문제: backend는 통신 라이브러리 선택이지 연산 device 선택이 아님. Gloo도 CUDA tensor broadcast/all_reduce/reduce_scatter 등을 지원(2.13 docs 표). → 제안: "`nccl`은 통신에 NCCL을 쓴다는 뜻이고 CUDA tensor만 받습니다. 연산 device는 스크립트가 정합니다."
- **[A4-16] [severity: low] line 1078-1087** — 인용: "optimizer.step()" (Ray 예제) → 문제: `optimizer`가 정의되지 않은 채 사용됨. → 제안: `prepare_model` 다음 줄에 `optimizer = ray.train.torch.prepare_optimizer(torch.optim.AdamW(model.parameters()))` 추가.
- **[A4-17] [severity: low] line 672** — 인용: "FairScale의 FSDP가 PyTorch 1.11에 정식 편입됨" → 문제: 1.11에서는 beta로 편입. → 제안: "PyTorch 1.11에 beta로 편입".
- **[A4-18] [severity: low] line 923** — 인용: "(아래 참고 자료의 분석 기준 최대 8배 정도)" → 문제: 수치 출처 절이 명시되지 않음. needs verification: JAX scaling book "training" 장의 mixed FSDP+TP 배치 하한 절과 대조. → 제안: 해당 절 제목/식을 괄호에 넣거나 수치 삭제.
- **[A4-19] [severity: low] line 893** — 인용: "FSDP2가 모든 parameter를 dim-0으로 일괄 sharding하는 것과 달리" → 문제: 기본값일 뿐, v2.13.0 `fully_shard(shard_placement_fn=...)`로 parameter별 dim/mesh를 바꿀 수 있음(MoE expert용). → 제안: "기본적으로 dim-0으로".
- **[A4-20] [severity: low] line 569-579** — 인용: "work = group.allreduce([tensor], opts)  # backend(NCCL 등)에 위임" → 문제: 없음. v2.13.0 `distributed_c10d.py` 3245-3252행과 일치(단 `elif work is not None:` 분기와 coalescing 분기를 생략한 요약본이라는 표시가 없음). → 제안: 첫 줄 주석에 "(요약)" 추가.

검증해서 문제 없던 주요 claim(참고): 609-627 rendezvous 스니펫은 v2.13.0 `_env_rendezvous_handler`와 동일; DDP bucket 25MiB(`_DEFAULT_BUCKET_CAP_MB = 25`); `ColwiseParallel`=Shard(0)/`RowwiseParallel`=Shard(1); `fully_shard` class swap 이름 `FSDP<cls>`; `reshard_after_forward` 의미(677-682 표); 16 byte/param, 7B → 14GB/112GB; DDP 2P vs FSDP 3P; Distributed Overview 4층 구분; `parallelize_module`/`init_device_mesh` 인자; DeepSpeed/Accelerate/Ray API 이름.

</details>

<details><summary>Codex gpt-6-astra 전문</summary>

문체는 대체로 강의에 맞지만, 설명을 예고하는 문장과 비표준 명칭·음역을 줄일 필요가 있습니다.
이해도는 중반부터 떨어집니다. 분산 matmul의 수식과 DTensor의 최소 정의를 보충하고 FSDP 비교 절을 나누는 편이 좋습니다.
도식은 대부분 설명을 지원합니다. 전체 아키텍처의 연결 누락, 실행 시각화의 순서·주소 불일치, 복잡한 그림의 가독성은 수정이 필요합니다.
기술 정확성은 수정 후 재검토가 필요합니다. 우선순위 세 가지는 **global rank로 데이터 분할**, **NCCL 호출 전 CUDA tensor 준비**, **rendezvous 순서와 CUDA 초기화·완료 의미 바로잡기**입니다.

대상 파일 1–1157행 전체, Mermaid 3개, `<img>` 15개, ThemeImage의 양쪽 SVG와 TorchrunVisualizer 소스를 검토했습니다. 저장소는 수정하지 않았습니다. GPU 분산 실행 환경은 없어 matmul 분할 오류는 작은 NumPy 행렬로 재현했고, API 동작은 공식 소스와 대조했습니다. PyTorch 구현 근거는 가능한 한 `v2.13.0` 태그를 사용했습니다. MDX에 연결된 버전 미고정 tutorial은 검토 시 2.14를 표시하기도 하므로 2.13 근거와 구분했습니다. [연결된 TP tutorial](https://docs.pytorch.org/tutorials/intermediate/TP_tutorial.html)

## Axis 1 — AI slop과 비표준 용어

- **[A1-1] [severity: low] line 167** — 인용: "c10d (PyTorch Distributed Core Layer)" → 문제: 괄호 안 표현은 c10d의 공식 풀네임처럼 보이지만 공식 API 명칭이 아닙니다. 이 밖에 명백히 지어낸 메커니즘명은 발견하지 못했습니다. → 제안: “c10d: PyTorch의 분산 통신 API와 구현”으로 설명하고, 비공식 확장명을 고유명사처럼 제시하지 마세요. [공식 분산 개요](https://docs.pytorch.org/tutorials/beginner/dist_overview.html)
- **[A1-2] [severity: medium] line 324** — 인용: "함께 물고 들어간 task들을 노드들이 모여 함께 수행하는 형태가 됩니다." → 문제: ‘함께’의 반복과 불분명한 주어 때문에 실행기가 하는 일이 가려집니다. 실행기를 직접 만들 수 있다는 옆 설명까지 더해져 정의가 길어집니다. → 제안: 문단을 “torchrun은 각 node에서 지정한 수의 worker process를 시작하고, 분산 초기화에 필요한 환경 변수를 설정하는 실행기입니다.”로 줄이세요.
- **[A1-3] [severity: low] line 338** — 인용: "어떤 머신을 랑데부 host로 쓸지" → 문제: 앞에서는 `Rendezvous`, 여기서는 ‘랑데부’, 388행 이후에는 ‘랑데뷰’를 사용해 같은 개념의 표기가 세 가지입니다. → 제안: 첫 등장에만 “rendezvous(참여자 합의 과정)”라고 설명하고 이후에는 `rendezvous`로 통일하세요.
- **[A1-4] [severity: medium] line 694** — 인용: "컴파일러처럼 보이지만 컴파일러는 아닙니다." → 문제: 앞에서 제기하지 않은 비유를 도입한 뒤 부정하며 한 문단을 소비합니다. FSDP2의 동적 클래스 변경을 FSDP/TP 전체의 공통 구현처럼 설명하는 것도 부정확합니다. → 제안: 이 문단을 삭제하고, 필요한 구현 설명은 “FSDP2는 module에 hook과 FSDPModule 메서드를 추가합니다. TP는 plan에 따라 parameter와 입력·출력 배치를 설정합니다.”로 각 내부 동작 절에 배치하세요. [FSDP2 소스](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/distributed/fsdp/_fully_shard/_fully_shard.py), [TP 소스](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/distributed/tensor/parallel/style.py)

## Axis 2 — 이해도, 쉬운 설명의 균형, 분량

- **[A2-1] [severity: medium] line 24-33** — 인용: "Data Parallel 축(DDP → ZeRO → FSDP)과 Model Parallel 축(TP, SP, PP)" → 문제: 입문자가 아직 모르는 약어와 분류를 긴 목차 문장에 함께 넣었습니다. 뒤에서 설명할 내용을 여기서 미리 해독해야 합니다. → 제안: 목차를 “프로세스와 통신 / torchrun 행렬 곱셈 실습 / CUDA와 통신의 연결 / 데이터·모델 병렬화” 네 줄로 줄이고, 보충 주제와 약어 풀이는 해당 절로 옮기세요.
- **[A2-2] [severity: medium] line 484-500** — 인용: "이렇게 분할된 부분 행렬끼리의 곱셈 결과를 `all_reduce`로 합산하면 전체 행렬 곱셈의 결과가 나옵니다." → 문제: A는 열, B는 행으로 자르는 이유와 각 rank가 전체 크기의 출력 행렬을 만드는 이유가 생략됐습니다. API 설명만으로는 왜 gather가 아니라 합산인지 이해하기 어렵습니다. → 제안: 코드 앞에 “A=[A₀ A₁], B=[B₀; B₁]이면 AB=A₀B₀+A₁B₁”을 넣고, 두 rank가 계산하는 `(n,k)@(k,n)→(n,n)` 그림 하나로 연결하세요.
- **[A2-3] [severity: medium] line 748-757** — 인용: "assert param.placements == (Shard(0),)" → 문제: DTensor의 이름만 풀어 쓴 직후 `placements`와 `Shard(0)`가 등장합니다. 괄호가 mesh 축을, 숫자 0이 tensor 차원을 뜻한다는 설명이 없어 두 종류의 축을 혼동하기 쉽습니다. → 제안: “DTensor는 전체 tensor의 정보와 현재 rank의 조각을 함께 표현합니다. 1차원 mesh에서 `(Shard(0),)`는 tensor의 첫 번째 차원을 나눴다는 뜻이며, `to_local()`은 현재 조각을 반환합니다.”를 코드 앞에 넣으세요.
- **[A2-4] [severity: medium] line 773-782** — 인용: "이 변화가 왜 중요한지는 한 가지 사실에서 출발합니다." → 문제: flatten 설명에 이어 LoRA, FP8, checkpoint, allocator·stream까지 한 절에 몰려 추상화 수준이 급격히 바뀝니다. 각 항목도 원인·기존 구현·개선 효과를 긴 문단으로 반복합니다. → 제안: 본문은 “FSDP1: 묶어서 flatten / FSDP2: parameter별 DTensor”와 효과 세 줄로 줄이고, checkpoint와 stream 메모리 관리는 각각 별도 화면이나 보충 설명으로 옮기세요.

## Axis 3 — 도식이 설명을 지원하는가

아래 정상 항목은 입력·출력 또는 구성 관계와 용어가 본문에 맞습니다. Mermaid는 요청대로 소스 기준으로 판단했으며 `mindmap`은 없습니다. 화면 크기 평가는 원본 도식의 밀도와 MDX·CSS 기준이고, 실제 발표 화면을 캡처한 결과는 아닙니다.

정상 — line 45, `slide05_1.png`: CPU별 독립 메모리와 메시지 전달을 단순하게 보여줍니다.  
정상 — line 54, `slide05_2.png`: 여러 CPU가 공유 메모리에 접근하는 대비가 명확합니다.  
정상 — line 74, `slide06_1.png`: 서로 다른 시점에 barrier에 도착한 프로세스들이 함께 진행하는 예입니다.  
정상 — line 83, `slide06_2.png`: primary thread도 참여하는 fork–join 흐름이 본문과 맞습니다.  
정상 — line 98, `slide07_1.png`: MPI_Init → 병렬 작업 → MPI_Finalize 순서와 C 코드가 대응합니다.  
정상 — line 117–143, Mermaid: node별 local rank 재사용과 world 전체 global rank 구분이 정확합니다.  
정상 — line 185–207, Mermaid: 여섯 rank가 기본 process group에 속한다는 구성도입니다.  
정상 — line 214–236, Mermaid: 두 subgroup 예제가 명확하며 숨김 edge를 통신 경로로 오해할 표시도 없습니다.  
정상 — line 264, `torch_distributed_scatter.png`: root의 서로 다른 조각이 각 rank로 분배됩니다.  
정상 — line 265, `torch_distributed_gather.png`: 원소별 합산 없이 root에 모으는 의미가 맞습니다.  
정상 — line 278, `torch_distributed_reduce.png`: 합산 결과 T가 root 한 곳에 남습니다.  
정상 — line 279, `torch_distributed_all_reduce.png`: 교차선은 많지만 모든 rank가 같은 합을 받는 입출력 의미는 맞습니다. 실제 통신 topology를 나타내는 그림으로 읽으면 안 됩니다.  
정상 — line 292, `torch_distributed_broadcast.png`: 같은 t0을 모든 rank에 복제합니다.  
정상 — line 293, `torch_distributed_all_gather.png`: 서로 다른 tensor를 합산하지 않고 모두 보유하는 결과가 맞습니다.  
정상 — line 806, `fsdp2_implicit_prefetch.png`: 두 stream의 all-gather와 계산 overlap이 본문과 일치하며, CPU가 충분히 앞서 실행해야 한다는 조건도 그림에 있습니다.

- **[A3-1] [severity: medium] line 149-154** — 인용: "torch.distributed 전체 아키텍처: Rendezvous가 Node들을 묶고, 각 Process 내부는 High-level 패키지, c10d, Backend 레이어로 구성" → 문제: light/dark SVG 모두 `ProcessGroup NCCL → CUDA` 사이의 NCCL library를 생략하고, collective/P2P와 backend 사이 연결도 생략해 본문이 설명하는 호출 경로를 따라가기 어렵습니다. `process_group ≈ world`는 default group에만 해당하고, 작은 local-rank 글자는 전체 그림을 축소하면 읽기 어렵습니다. → 제안: node 구성과 process 내부를 두 그림으로 나누고 `collective → ProcessGroupNCCL → NCCL → CUDA/GPU`를 연결하세요. 왼쪽 라벨은 `default process group = world`로 한정하세요.
- **[A3-2] [severity: high] line 392** — 인용: "<TorchrunVisualizer />" → 문제: 추가로 확인한 이 시각화는 `Process spawn → Rendezvous`를 보여주어 실제 순서를 뒤집고, 화면 endpoint는 `192.168.0.2:29400`인데 본문 명령은 `:29500`입니다. 단계마다 rank·주소를 따라가는 실습에서 오해를 직접 유발합니다. → 제안: `agent rendezvous → rank/env 설정 → worker spawn → init_process_group` 순서로 바꾸고 endpoint를 본문과 맞추세요. 기술 근거는 A4-5와 같습니다.
- **[A3-3] [severity: medium] line 761** — 인용: "/images/05/fsdp2_workflow.png" → 문제: all-gather, local 계산, reduce-scatter 자체는 맞지만 두 rank·여러 FSDP 단위·CPU offload 주석을 한 이미지에 넣어 밀도가 높습니다. 본문에서 아직 설명하지 않은 offload 경로까지 있어 발표 화면에서는 주요 순서를 찾기 어렵습니다. → 제안: 첫 그림은 두 rank의 한 module만 남기고 forward와 backward를 두 줄로 정리하세요. offload와 여러 module 반복은 별도 그림으로 분리하세요.
- **[A3-4] [severity: medium] line 830** — 인용: "/images/05/fsdp2_allreduce_decomposition.png" → 문제: 분해식은 맞지만 가운데 reduce-scatter 출력 `A0+B0+C0+D0` 등이 오른쪽 all-gather 입력에서 다시 `A, B, C, D`로 바뀝니다. 왼쪽의 원래 입력 A와 오른쪽의 합산 조각 A가 같은 표기를 써서 두 연산의 연결이 불명확합니다. → 제안: 합산 조각을 `S₀, S₁, S₂, S₃`로 통일하고 가운데 출력에서 오른쪽 입력으로 연결선을 넣으세요.
- **[A3-5] [severity: medium] line 883** — 인용: "/images/05/slide35_1.png" → 문제: MLP·attention·논문 캡션을 한 번에 축소해 f/g와 tensor 라벨이 작습니다. 그림은 `Y=XA` 표기이고 코드는 `Linear.weight=[out,in]`이므로, 설명 없이 비교하면 column 분할과 dim-0 주석이 반대로 보입니다. → 제안: MLP와 attention을 따로 확대하고 “그림 A는 PyTorch weight의 전치: A=Wᵀ”를 붙이세요. f/g의 forward·backward collective 의미도 확대된 그림 옆에 한 줄씩 명시하세요.

## Axis 4 — 기술 정확성

아래 신뢰도는 각 지적의 확실성입니다. 제시된 `(n,k)@(k,n)=(n,n)` shape와, 명시한 16 byte/parameter 가정에서 `7B×2=14GB`, `7B×16=112GB` 산술 자체는 맞습니다. 16 byte는 해당 mixed-precision 구성의 모델이며 모든 AMP 구현에 공통인 상수는 아닙니다.

- **[A4-1] [severity: high] line 484-500** — 인용: "local_A = A[:, lrank*k:(lrank+1)*k].to(" → 문제: `lrank`는 node마다 반복되므로 두 node가 같은 앞쪽 조각을 중복 계산하고 뒤쪽 조각을 누락합니다. 신뢰도 높음: `n=4`, 2 node×2 worker, A=B=`arange(1,17).reshape(4,4)`에서 정상 결과 첫 행은 `[90,100,110,120]`인데 이 분할은 `[22,28,34,40]`을 만듭니다. → 제안: slice에는 `dist.get_rank()`를, device 선택에만 `LOCAL_RANK`를 쓰세요. `n % world_size == 0` 검사 또는 나머지를 포함하는 경계 계산도 추가하고, 오류를 가리는 `torch.ones` 대신 비균일 입력으로 `A @ B`와 비교하세요.
- **[A4-2] [severity: high] line 520-534** — 인용: "dist.broadcast(A, 0)" → 문제: 앞의 호출부는 CPU A/B를 만들지만 이 재게시 함수에는 456행의 `.to(device)`가 없습니다. `set_device()`는 기존 tensor를 옮기지 않으므로 NCCL broadcast에서 실패합니다(신뢰도 높음). → 제안: 두 broadcast 전에 `device = torch.device(f"cuda:{local_rank}")`와 `A, B = A.to(device), B.to(device)`를 복원하고 첫 예제와 같은 함수를 사용하세요. [backend별 device 지원](https://docs.pytorch.org/docs/stable/distributed.html#backends)
- **[A4-3] [severity: high] line 333-350** — 인용: "**사용할 backend** - NCCL, Gloo 등 실제 통신 라이브러리" → 문제: torchrun의 `--rdzv-backend=c10d`와 스크립트의 `init_process_group(backend="nccl")`를 같은 인자로 설명합니다. torchrun이 모델 분할까지 정해 주는 것처럼 읽히는 350행도 실행기와 학습 코드의 책임을 섞습니다(신뢰도 높음). → 제안: “torchrun에는 rendezvous backend와 worker 실행 정보를 전달합니다. 통신 backend와 모델·데이터 분할은 worker 스크립트에서 정합니다.”로 바꾸세요. [v2.13 torchrun 소스](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/distributed/run.py)
- **[A4-4] [severity: high] line 362-379** — 인용: "`node_rank`만 다르게 지정합니다." → 문제: 예제의 `--rdzv_backend=c10d`에서는 `--node_rank`로 node의 rendezvous rank를 고정하지 않습니다. v2.13 소스도 이 옵션은 static backend에서만 사용하고 다른 backend에서는 무시한다고 명시합니다(신뢰도 높음). → 제안: c10d 예제에서는 `--node_rank`를 제거하고 rank를 rendezvous 결과로 설명하세요. node 순번을 명시하는 실습이라면 static 방식의 명령으로 일관되게 바꾸세요. [인자 처리 소스](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/distributed/run.py#L794-L823)
- **[A4-5] [severity: high] line 386-409** — 인용: "**프로세스 생성** - 각 노드에서 `nproc_per_node`만큼의 Python process를 생성합니다." → 문제: torchrun agent가 rendezvous한 뒤 rank를 계산하고 worker를 생성하는 순서인데 본문은 worker 생성 후 worker 전원이 rendezvous한다고 설명합니다. v2.13 `_initialize_workers()`는 `_rendezvous()` 다음 `_start_workers()`를 호출합니다(신뢰도 높음). → 제안: “agent들이 rendezvous → worker별 rank/world size/env 구성 → 각 node에서 worker 실행 → worker의 init_process_group”으로 고치고 406–409행의 참여 주체도 worker에서 agent로 바로잡으세요. [agent 소스](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/distributed/elastic/agent/server/api.py#L631-L649)
- **[A4-6] [severity: high] line 502-506** — 인용: "`nccl`을 쓰면 GPU 연산을 한다는 뜻이고" → 문제: backend는 분산 통신 구현을 선택하며 일반 연산의 실행 device는 tensor 배치가 결정합니다. 또한 같은 rendezvous에 속한다는 이유만으로 모든 process group이 하나의 backend만 써야 하는 것은 아닙니다(신뢰도 높음). → 제안: “NCCL은 CUDA tensor 통신에 사용합니다. 계산 device는 tensor가 정하며, 같은 collective에 참여하는 rank들은 호환되는 group/backend를 사용해야 합니다. 별도 group으로 Gloo와 NCCL을 함께 사용할 수 있습니다.”로 바꾸세요. [분산 API와 backend 구성](https://docs.pytorch.org/docs/stable/distributed.html)
- **[A4-7] [severity: high] line 541** — 인용: "`torch.cuda.set_device()`를 호출하는 것만으로는 CUDA 초기화가 발생하지 않는다는 것입니다." → 문제: v2.13의 `THCPModule_setDevice_wrap`은 `torch::utils::device_lazy_init(at::kCUDA)`를 호출하므로 이 설명은 반대입니다. `set_device`가 언제나 process-group 초기화보다 먼저여야 한다는 단정도 명시적 `device_id` 등 다른 device 지정 경로를 무시합니다(신뢰도 높음). → 제안: “이 예제에서는 set_device(local_rank)로 device를 먼저 선택하며, 이 호출은 CUDA 초기화를 유발할 수 있습니다. Tensor를 처음 만들 때만 초기화되는 것은 아닙니다.”로 바꾸세요. [CUDA binding 소스](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/csrc/cuda/Module.cpp#L61-L66)
- **[A4-8] [severity: high] line 554-578** — 인용: "work.wait()    # blocking: 완료까지 대기" → 문제: NCCL의 기본 wait는 현재 CUDA stream이 통신 stream의 완료 event를 기다리게 하며 CPU가 GPU 통신 완료까지 기다린다는 뜻이 아닙니다. 따라서 `async_op=False`를 CPU blocking 완료와 동일시하면 타이밍 측정과 다른 stream에서의 결과 사용을 잘못 이해하게 됩니다(신뢰도 높음). → 제안: 주석을 “현재 CUDA stream에 통신 완료 의존성 설정”으로 바꾸고, CPU에서 완료를 확인해야 하는 경우의 synchronize와 다른 stream 사용 시의 의존성 설정을 구분하세요. [WorkNCCL의 wait·stream 동기화](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/csrc/distributed/c10d/ProcessGroupNCCL.cpp#L770-L779)
- **[A4-9] [severity: high] line 585-625** — 인용: "초기화 방법은 두 가지가 있습니다." → 문제: 이 예제가 실제로 쓰는 기본값 `env://`가 빠졌고, 바로 뒤의 설명은 `file://`에도 TCPStore를 쓰는 것처럼 일반화합니다. rank 0 worker가 항상 daemon을 만든다는 설명도 agent store 재사용 경로에서는 틀립니다(신뢰도 높음). → 제안: `env://`(torchrun 기본), `tcp://`, `file://`와 직접 Store 전달을 구분하세요. “file 방식은 FileStore, env/tcp는 TCPStore를 사용하며 agent store를 재사용하면 모든 worker가 client가 됩니다.”를 명시하고, 다중 node 예제의 `127.0.0.1`은 공통 접근 가능한 host 주소로 바꾸세요. [초기화 기본값](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/distributed/distributed_c10d.py), [Store 생성 분기](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/distributed/rendezvous.py#L129-L190)
- **[A4-10] [severity: high] line 631-633** — 인용: "Collective operation처럼 동작하므로, 일부 프로세스만 호출하면 나머지 프로세스들이 영원히 기다리게 됩니다." → 문제: 모든 backend에 대한 barrier 의미와 무한 대기를 보장하는 API가 아닙니다. NCCL의 정상 shutdown은 pending 작업 완료와 communicator 정리를 포함하며, 객체 소멸 시 단순히 `ncclCommDestroy()`만 호출한다는 설명도 lifecycle을 잘못 축약합니다(신뢰도 높음). → 제안: “모든 rank에서 통신을 마친 뒤 일관된 순서로 destroy_process_group을 호출합니다. 일부 rank의 미종료나 순서 불일치는 NCCL 종료 hang을 유발할 수 있습니다.”로 바꾸고 normal shutdown과 비정상 abort를 구분하세요. [NCCL shutdown 구현](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/csrc/distributed/c10d/ProcessGroupNCCL.cpp#L1445)
- **[A4-11] [severity: high] line 704-716** — 인용: "DDP는 모델을 `DistributedDataParallel`로 감싸기만 하면 되고" → 문제: DDP는 입력 데이터를 자동 분할하지 않으며 process-group 초기화와 rank별 데이터 공급이 필요합니다. 앞서 정의한 global `rank`를 `device_ids=[rank]`에 쓰면 두 번째 node에서 존재하지 않는 GPU 번호를 선택합니다(신뢰도 높음). → 제안: device에는 `LOCAL_RANK`를 쓰고, `DistributedSampler` 및 epoch별 `sampler.set_epoch(epoch)`, target의 device 이동, optimizer 생성 위치를 보여 주세요. “forward/backward/step의 기본 흐름은 유지된다”로 설명을 좁히세요. [DDP의 초기화·입력 분할 계약](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/nn/parallel/distributed.py#L425-L465)
- **[A4-12] [severity: high] line 727** — 인용: "**Forward**는 로컬 계산 그대로입니다. 통신이 필요 없습니다." → 문제: 기본 DDP는 buffer를 forward 시 동기화하므로 BatchNorm running statistics 같은 buffer가 있으면 통신합니다. 같은 단정이 823행에도 반복됩니다(신뢰도 높음). → 제안: “모델 계산은 로컬에서 수행하지만 기본 설정에서는 buffer broadcast가 있을 수 있습니다. 아래 통신량 비교에서는 buffer 등 부가 통신을 제외합니다.”로 고치세요. [DDP forward 경로](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/nn/parallel/distributed.py#L1629-L1641)
- **[A4-13] [severity: high] line 777-779** — 인용: "FSDP1에서는 둘이 같은 FlatParameter에 묶이면 `requires_grad`가 하나뿐이라 "일부만 freeze"를 표현할 수 없었습니다" → 문제: `use_orig_params=True`인 FSDP1은 frozen·trainable parameter 혼합을 지원합니다. 제약은 설정별로 다르며 혼합 시 gradient 메모리 비효율이 남을 수 있다는 것이 정확합니다(신뢰도 높음). → 제안: “FSDP1의 use_orig_params=False에서는 동일 단위에 frozen·trainable parameter를 섞을 수 없습니다. True에서는 가능하지만 gradient 메모리 비용이 늘 수 있으며 FSDP2는 이 구성을 더 효율적으로 처리합니다.”로 바꾸세요. [FSDP1 freezing 제약](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/distributed/fsdp/fully_sharded_data_parallel.py#L192-L197)
- **[A4-14] [severity: high] line 781** — 인용: "`torch.distributed.checkpoint`의 sharded state dict가 통신 없이 병렬로 저장·로드되는 근거입니다." → 문제: tensor를 full parameter로 모으지 않고 state dict를 만들 수 있다는 장점과 checkpoint 저장·로드 전체가 무통신이라는 주장을 혼동합니다. DCP의 기본 저장 경로는 plan·완료 metadata를 rank 사이에서 교환하며 FSDP1에도 local/sharded state-dict 방식이 있습니다(신뢰도 높음). → 제안: “FSDP2는 sharded state dict 생성에 parameter all-gather가 필요 없습니다. DCP 저장·로드에는 metadata 조율 등이 있을 수 있습니다.”로 한정하고 FSDP1의 FULL/SHARDED/LOCAL_STATE_DICT를 구분하세요. [DCP 저장 조율](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/distributed/checkpoint/state_dict_saver.py#L447-L475), [FSDP1 state-dict 종류](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/distributed/fsdp/fully_sharded_data_parallel.py#L636-L644)
- **[A4-15] [severity: high] line 819** — 인용: "parameter all-gather와 reshard 통신을 추가하므로" → 문제: 일반적인 FSDP reshard는 기존 local shard를 남기고 모아 둔 full parameter를 해제하는 동작으로, 별도의 parameter 통신이 아닙니다. gradient reduce-scatter와 섞으면 3P 통신량의 구성도 잘못 이해하게 됩니다(신뢰도 높음). → 제안: “parameter all-gather와 gradient reduce-scatter가 필요하며, reshard에서는 모아 둔 full parameter를 해제합니다.”로 바꾸세요. [fully_shard 동작](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/distributed/fsdp/_fully_shard/_fully_shard.py#L103-L122)
- **[A4-16] [severity: medium] line 821-828** — 인용: "parameter 전체 크기를 P라 하면:" → 문제: P가 원소 수인지 byte 수인지, 통신량이 rank당 송신량인지 전체 송수신 합인지 정의되지 않았습니다. 2P·3P는 같은 통신 dtype, 충분히 큰 rank 수 등의 근사이고 overlap이 ‘거의 완전’하다는 보장도 없습니다(신뢰도 높음). → 제안: “N ranks, parameter와 gradient의 통신 크기가 각각 P bytes, rank당 송신량 기준”을 가정하면 DDP `2(N−1)P/N`, full-reshard FSDP `3(N−1)P/N`로 쓰세요. dtype이 다르면 parameter 크기 P와 gradient 크기 G를 분리하고 overlap은 측정 항목으로 남기세요. [collective 의미](https://docs.pytorch.org/tutorials/intermediate/dist_tuto.html), [FSDP 통신 순서](https://docs.pytorch.org/tutorials/intermediate/FSDP_tutorial.html)
- **[A4-17] [severity: high] line 843-848** — 인용: "FSDP는 그것을 world_size로 나눕니다." → 문제: 영구 보관하는 학습 상태의 shard 크기와 실행 중 peak memory를 동일시합니다. full parameter·gradient의 일시 버퍼, prefetch, activation은 추가로 필요하며 FSDP 자체가 activation을 rank 수만큼 나누는 것도 아닙니다(신뢰도 높음). → 제안: “상시 학습 상태는 대략 16×parameter 수/N으로 줄지만, peak에는 현재·prefetch module의 full 버퍼와 activation 등이 더해집니다.”를 넣으세요. 947행의 10GB GPU/40GB weight 예에도 “각 FSDP 단위가 복원됐을 때는 한 GPU에 들어가야 한다”는 조건을 추가하세요. [FSDP 단위와 peak memory](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/distributed/fsdp/_fully_shard/_fully_shard.py#L123-L133)
- **[A4-18] [severity: high] line 918** — 인용: "모든 parameter가 1D로 뭉개져 있어 다른 병렬화와 합성 불가" → 문제: FSDP1도 TP와 결합하는 구현이 있으므로 합성 ‘불가’는 틀립니다. v2.13 FSDP1의 `_init_extension`은 TP 조합을 위한 `DTensorExtensions`를 설치합니다(신뢰도 높음). → 제안: “FSDP1도 TP 조합을 지원하지만 flatten 표현과 별도 확장 처리가 필요합니다. FSDP2는 parameter별 DTensor를 사용해 조합을 단순화합니다.”로 바꾸세요. [FSDP1 TP 확장 소스](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/distributed/fsdp/_init_utils.py#L483-L496)
- **[A4-19] [severity: high] line 922-925** — 인용: "보통 8~16-way가 한계이고, 그마저 NVLink급 노드 안 interconnect에서만 감당됩니다." → 문제: 인용 자료의 8–16-way는 TPU v5p의 연산 성능/ICI 대역폭과 FFN 폭을 넣은 분석이며 NVIDIA GPU의 보편적 한계가 아닙니다. ‘batch 하한 최대 8배’와 ‘얼마든지 확장’ 역시 하드웨어·topology·global batch 조건을 지우고 일반화합니다(신뢰도 높음). → 제안: “TP 효율은 FFN 폭, degree, 연산 성능/통신 대역폭에 따라 달라집니다. 빠른 interconnect 안에 배치하는 경우가 많습니다.”로 바꾸고 수치를 유지하려면 원문의 TPU 모델·수식·조건을 함께 적으세요. [원문의 TPU v5p 분석](https://jax-ml.github.io/scaling-book/training/#tensor-parallelism)
- **[A4-20] [severity: high] line 983-1006** — 인용: "model_engine, optimizer, dataloader, _ = deepspeed.initialize(" → 문제: `training_data`를 전달하지 않아 반환 dataloader가 `None`인데 바로 반복합니다. 또한 제시한 호출과 JSON에는 optimizer 인스턴스나 optimizer 설정이 없어 학습용 초기화가 완결되지 않습니다(신뢰도 높음). → 제안: `training_data=dataset`과 적절한 optimizer 설정을 넣거나, 별도 DataLoader를 유지하고 생성한 optimizer를 전달하세요. CPU optimizer offload 설정에 맞는 optimizer 경로도 함께 명시하세요. [DeepSpeed 초기화 계약](https://deepspeed.readthedocs.io/en/stable/initialize.html)
- **[A4-21] [severity: high] line 1019** — 인용: "gradient accumulation 경계에서 통신을 발행합니다." → 문제: ZeRO-2/3는 보통 각 microbatch backward에서 gradient collective를 수행합니다. accumulation 경계의 optimizer update와 통신 시점을 동일시했습니다(신뢰도 높음). → 제안: “ZeRO-2/3의 gradient reduce/partition은 보통 각 backward에서 수행되고, optimizer update는 accumulation 경계에서 수행됩니다. ZeRO-1의 gradient reduction은 이 경계에서 수행됩니다.”로 구분하세요. [DeepSpeed gradient collective 설명](https://deepspeed.readthedocs.io/en/stable/training.html#communication)
- **[A4-22] [severity: medium] line 1025** — 인용: "항상 fp32 master weight로 upcast하고 optimizer도 fp32로 돕니다." → 문제: 기본 mixed-precision 경로의 설명을 버전·설정 독립 사실로 확장했습니다. 현재 공식 소스에는 `bf16_master_weights_and_grads`, `bf16_optimizer_states` 옵션도 있으므로 ‘항상’은 성립하지 않습니다(신뢰도 높음; 강의가 의도한 DeepSpeed 버전의 지원 범위는 needs verification). → 제안: “여기서 비교하는 기본 mixed-precision 설정은 FP32 master weight와 optimizer state를 유지합니다.”로 한정하고 DeepSpeed 버전과 해당 설정을 명시하세요. [DeepSpeed BF16 설정 정의](https://github.com/deepspeedai/DeepSpeed/blob/master/deepspeed/runtime/constants.py#L136-L140)
- **[A4-23] [severity: high] line 1064-1065** — 인용: "DeepSpeed면 `engine.backward(loss)`를, mixed precision이면 loss scaling을 적용한 `loss.backward()`를" → 문제: Accelerate의 DeepSpeed 경로는 wrapper의 backward 안에서 sync 경계의 `engine.step()`까지 수행하고, 반환 optimizer의 step/zero_grad는 no-op입니다. 또한 BF16 mixed precision은 보통 loss scaling을 하지 않습니다(신뢰도 높음; 현재 공식 구현 기준). → 제안: 세 경로를 “DeepSpeed: backward와 경계의 engine.step / GradScaler 사용 경로: scaled backward / 그 외: 일반 backward”로 나누고, DeepSpeed optimizer wrapper의 no-op을 설명하세요. [DeepSpeed wrapper 구현](https://github.com/huggingface/accelerate/blob/main/src/accelerate/utils/deepspeed.py), [Accelerator 구현](https://github.com/huggingface/accelerate/blob/main/src/accelerate/accelerator.py)
- **[A4-24] [severity: high] line 1078-1086** — 인용: "optimizer.step()" → 문제: worker 함수 안에서 새 model을 만들지만 그 model의 parameter에 연결된 optimizer를 만들지 않습니다. 외부 optimizer가 있다고 가정해도 worker에서 새로 생성한 model과 연결되지 않으므로 학습 예제로 성립하지 않습니다(신뢰도 높음). → 제안: `prepare_model(build_model())` 직후 `optimizer = torch.optim.Adam(model.parameters(), lr=...)`를 추가하세요. [공식 TorchTrainer 예제](https://docs.ray.io/en/latest/train/api/doc/ray.train.torch.torch_trainer.TorchTrainer.html)
- **[A4-25] [severity: high] line 1106** — 인용: "노드가 죽으면 대체 노드를 확보해 최신 checkpoint에서 학습을 재개합니다(`FailureConfig`)." → 문제: 재시도 설정과 애플리케이션의 checkpoint 저장·복원 로직이 있어야 하며 FailureConfig만으로 학습 상태가 복구되지는 않습니다. 제시한 코드는 loss metric만 report하고 checkpoint를 저장하지 않습니다(신뢰도 높음). → 제안: “재시도 정책, 사용 가능한 cluster 자원, 영속 checkpoint 저장과 worker의 복원 로직을 구성하면 장애 후 학습을 재개할 수 있습니다.”로 바꾸고 코드에 `report(checkpoint=...)`와 `get_checkpoint()` 복원 흐름을 추가하세요. [Ray fault tolerance](https://docs.ray.io/en/latest/train/user-guides/fault-tolerance.html)
- **[A4-26] [severity: high] line 1148** — 인용: "NVCC는 단일 GPU에서 실행되는 커널 하나를 컴파일하는 도구이고" → 문제: nvcc는 host/device 코드의 컴파일·링크를 조율하는 compiler driver이며 한 파일의 여러 kernel을 처리할 수 있습니다. PyTorch op 하나가 kernel 하나와 일대일 대응한다는 뒷 설명도 성립하지 않습니다(신뢰도 높음). → 제안: “nvcc는 CUDA host/device 코드를 컴파일·링크하는 driver입니다. process/rank/collective 실행 관리는 PyTorch 분산 계층이 담당하며, op와 GPU kernel의 대응은 일대일로 고정되지 않습니다.”로 바꾸세요. [NVIDIA nvcc 문서](https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html)
- **[A4-27] [severity: medium] line 1151** — 인용: "리벨리온 컴파일러는 sharding 기능을 갖고 있습니다." → 문제: 제품·SDK 버전과 sharding 범위의 근거가 없어 chip 내부 분할인지 device 간 모델 분할인지 판별할 수 없습니다. 이어지는 node 간 활용 전망도 확인되지 않은 추정입니다(신뢰도 낮음, needs verification). → 제안: 공식 SDK 문서에서 compiler 버전, 지원 대상, inter-device/inter-node 범위를 확인해 링크와 함께 적으세요. 확인 전에는 “리벨리온의 sharding 범위는 제품·SDK 문서 확인이 필요합니다.”로 바꾸고 향후 방향 추정은 삭제하세요.

</details>
