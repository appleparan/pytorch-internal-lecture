# 출처 검증 총괄 (2026-09-05 리뷰)

`docs/reviews/2026-09-05/` 강의별 리뷰 문서에 인용된 모든 출처(URL, GitHub 줄 앵커, 태그 고정 소스 파일 참조, 논문)를 다시 가져와 주장과 대조한 결과. 강의별 상세 표는 각 문서의 "출처 검증" 절에 있다.

## TL;DR

- 인용 247건 중 지지 189, 부분지지 40, 불일치 7, 무관 1, 접근불가 10. 접근불가는 Intel PDF(봇 차단 403)와 docs.jax.dev(429), 그리고 URL 없이 인용된 3건.
- **리뷰 결론이 뒤집힌 것 2건**: 강의 03 "Prims 123개"는 강의 원문이 맞음(Fable의 "≤87개" 정정 기각). 강의 04 AOTAutograd stage 이름은 v2.13.0과 main에 존재(Fable 기각, Codex 채택).
- **리뷰 수정안이 틀린 것 1건**: 강의 05 Ray 예제에 `prepare_optimizer` 제안은 deprecated API. `torch.optim.Adam` 직접 생성으로 교체.
- **결론은 맞지만 인용이 잘못된 것**: Codex의 GitHub 줄 앵커 다수가 15~440줄 어긋남(04·05·06). 강의 05의 두 링크는 엉뚱한 파일을 가리킴. 수정 반영 시 각 표의 정정 줄 번호를 사용할 것.
- Fable이 needs verification으로 둔 항목 중 3건은 확정됐고(CUDA Tile C++ 13.3, DSpark "confidence-scheduled", `_any_has_forward_grad_result`), 1건은 서지 오류(Park et al.은 CASES가 아니라 PACT '08).

## 강의별 집계

| 강의 | 총 | 지지 | 부분지지 | 불일치 | 무관 | 접근불가 | 비고 |
|---|---|---|---|---|---|---|---|
| 01 | 25 | 20 | 4 | 0 | 0 | 1 | TF 문서에 define-by-run 용어 없음, NumPy C-API 링크는 색인 페이지, HPL-93-35는 Fisher 1981이 아니라 1993 후속 논문 |
| 02 | 38 | 34 | 2 | 0 | 0 | 0 | 소스 줄 인용 대부분 정확. `MAX_JOBS` 읽는 파일은 `tools/setup_helpers/cmake.py` |
| 03 | 34 | 30 | 2 | 2 | 0 | 0 | **Prims 개수 정정 기각**(공식 2.13 문서 표 123개, `__all__` 127개) |
| 04 | 27 | 16 | 11 | 1 | 0 | 0 | **stage 이름 Fable 기각**. Codex 앵커 11건 이탈(`aot_autograd.py#L3645`는 파일 길이 밖) |
| 05 | 51 | 33 | 12 | 3 | 1 | 2 | Codex A4-10/A4-12 링크가 무관한 파일·줄. DeepSpeed 문서 링크는 `training_data` 주장을 뒷받침 못 함(소스로 대체). `prepare_optimizer` 제안 부적절 |
| 06 | 45 | 33 | 8 | 0 | 0 | 2 | FA1~FA4·Orca·PagedAttention 수치 전부 1차 자료 일치. SDPA 앵커 2건 440줄 이탈. Qwen3-0.6B·GB200 50% 수치는 1차 자료 미발견 |
| 07 | 27 | 23 | 1 | 1 | 0 | 3 | PTX SIMT·Occupancy·tcgen05·GCC SMS·H100 SXM 모두 일치. "CASES 2008" → PACT '08 |

## 리뷰 문서에 반영한 정정

- 03: TL;DR과 "한쪽만 제기한 항목"의 Prims 항목을 기각으로 표시. README 색인에서 제거.
- 04: "v2.13.0 소스에서 직접 확인 필요" → Codex 판정 채택으로 확정.
- 05: Ray 수정안을 `torch.optim.Adam` 직접 생성으로 교체.
- 06: CUDA Tile C++ 13.3 needs verification 해제.

## 남은 미확인

- docs.jax.dev 2페이지(jit-compilation, pallas TPU details): rate limit. 뒷받침 대상(JAX jit trace 재사용, TPU MXU=systolic array)은 통설이라 판정 영향 없음.
- Intel PDF 2건(무어의 법칙 2년, Pentium 4 trace cache): 403. Pentium 4 쪽은 다른 에이전트가 같은 PDF를 받아 확인함(03 #23).
- Qwen3-0.6B·GB200 throughput 50%+(06), A100 80GB·1.5TB/s SKU 조합(06), Rebellions compiler sharding 범위(05), FSDP1+TP 2.0~2.3 tutorial(05): 1차 자료 없음. 강의 수정 시 수치를 빼거나 출처를 붙여야 함.

## 인용 관행에 대한 권고

- `docs.pytorch.org/docs/stable/...`와 `/tutorials/...`는 현재 2.14로 렌더된다. 강의가 2.13을 고정하므로 `/docs/2.13/...`으로 쓸 것.
- GitHub 줄 앵커는 태그를 고정해도 리뷰어가 임의로 붙인 경우 자주 어긋난다. 반영 전 `sed -n`으로 재확인.
- 논문 첫 페이지 캡처를 근거로 쓸 때는 학회·연도를 원문 PDF의 저작권 표기로 확인(07의 1992/1994, PACT/CASES 사례).
