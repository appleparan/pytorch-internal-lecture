---
layout: cover
---

# Week 7: CPU / GPU / NPU

모두연 Pytorch + NPU 온라인 모임 #7 | 2025-02-12

<div class="abs-tl m-6">
  <span @click="$slidev.nav.go(1)" class="cursor-pointer opacity-50 hover:opacity-100 text-sm">
    ← 목차로 돌아가기
  </span>
</div>

---
level: 2
---

# Where We Are

<div class="grid grid-cols-2 gap-4 mt-4">
<div>

**원래 계획**

- Pytorch internal: 기초 (3회)
  - Pytorch internal에 대한 개요
  - Pytorch eager mode
  - Pytorch graph mode
  - Putting things together

- Pytorch internal: 심화 (8회)
  - Pytorch + Nvidia GPU
  - Pytorch + parallelism
  - Pytorch + LLM + inference
  - Pytorch + 리벨리온 NPU

</div>
<div>

**현재 계획**

- Week 1: 기술적인 배경
- Week 2: eager mode
- Week 3: graph mode
- Week 4: automatic differentiation
- Week 5: distributed programming
- Week 6: beyond Pytorch: custom kernel과 vLLM
- **Week 7: CPU / GPU / NPU**
- Week 8: 리벨리온 NPU (마지막 강의)

</div>
</div>

---
level: 2
layout: center
class: text-center
---

# CPU / GPU / NPU 어떻게 다른가?

---
level: 2
---

# Processor Stack: 개발자에서 Datapath까지

<div class="flex justify-center mt-4">

```mermaid {scale: 0.75}
graph TD
    A["개발자"] --> B["Programming Language"]
    B --> C["Compiler"]
    C --> D["Instruction Set Architecture"]
    D --> E["Control Logic"]
    E --> F["Datapath"]

    style A fill:#f97316,stroke:#f97316,color:#fff
    style D fill:#3b82f6,stroke:#3b82f6,color:#fff
    style E fill:#6366f1,stroke:#6366f1,color:#fff
    style F fill:#6366f1,stroke:#6366f1,color:#fff
```

</div>

<div class="grid grid-cols-2 gap-4 mt-4 text-sm">
<div class="border-l-4 border-orange-400 pl-4">

**SW 영역**: Programming Language, Compiler

</div>
<div class="border-l-4 border-indigo-400 pl-4">

**HW 영역**: ISA, Control Logic, Datapath (= Microarchitecture)

</div>
</div>

<!--
프로세서 디자인에서 트랜지스터부터 프로그래밍 언어까지 다양한 추상화 레이어를 통과합니다.
하드웨어가 개발자에게 어떻게 노출되는가가 프로세서 디자인의 핵심 질문입니다.
-->

---
level: 2
---

# Processor Design의 핵심 질문

<div class="grid grid-cols-2 gap-4 mt-4">
<div>

**성능은 하드웨어(Datapath)에서 결정**되지만, 모든 디테일을 개발자에게 노출할 수는 없음

핵심: **어느 단계에서 추상화하여 개발자가 이해할 수 있게 만드는가?**

</div>
<div>

세 가지 접근 방식:

<v-click>

1. **Microarchitecture 최적화** - HW가 알아서 처리
2. **Compiler 최적화** - SW가 정적으로 처리
3. **Programming Model 제공** - 개발자가 직접 제어

</v-click>

</div>
</div>

<!--
프로세서 디자인의 핵심 질문: 하드웨어가 개발자에게 어떻게 노출되는가?
성능은 하드웨어(데이터패스)에서 결정되지만, 모든 디테일을 개발자에게 노출할 수는 없습니다.
-->

---
level: 2
---

# 이를 접근하는 다양한 관점이 존재

<div class="grid grid-cols-2 gap-4 mt-8">
<div>

**개발자들이 HW Detail들을 알 필요가 없게**
- Microarchitecture 수준에서 최적화에 의존 <span class="text-sm text-gray-400">①</span>
- Compiler 수준에서의 최적화에 의존 <span class="text-sm text-gray-400">②</span>

</div>
<div>

**개발자들이 HW의 특성을 고려하여 짤 수 있도록**
- 최적화 목적에 맞는 Programming Model 제공 <span class="text-sm text-gray-400">③</span>

</div>
</div>

<!--
하드웨어 추상화 극대화: 하드웨어에서 추상화하여 간단한 ISA만 노출합니다.
컴파일러 중심 추상화: 하드웨어의 복잡성은 그대로 노출하되, 컴파일러 수준에서 추상화합니다.
개발자 제어 극대화: 데이터패스의 중요한 특성을 개발자에게 노출합니다.
-->

---
level: 2
---

# 무어의 법칙과 ISA/Microarchitecture의 분리

<div class="grid grid-cols-2 gap-4 mt-4">
<div>
  <img src="/images/07/slide07_1.png" class="h-72" />
</div>
<div class="flex flex-col justify-center">

1. **무어의 법칙** → 더 많은 HW Component 집적 가능
2. HW가 복잡해짐
3. 복잡한 HW를 모두 SW에 노출시킬 순 없음
4. **ISA와 Microarchitecture가 분리**

<div class="mt-4 text-sm text-gray-400">

Control Logic + Datapath = **Microarchitecture**

</div>

</div>
</div>

<!--
무어의 법칙에 따라 트랜지스터 수가 증가하면서 프로세서가 복잡해졌습니다.
데이터패스의 복잡성을 모두 소프트웨어에 노출하는 것은 비효율적입니다.
컨트롤 로직과 데이터패스를 합쳐서 마이크로아키텍처라고 부릅니다.
-->

---
level: 2
---

# Agenda Today

<div class="mt-4">

- <span class="text-orange-400 font-bold border border-orange-400 border-dashed px-2 py-1">Latency, Throughput, and Latency Hiding</span>
- Latency hiding을 위한 여러 microarchitecture 기법들
  - Instruction-level pipelining
    - Pipelined architecture
    - Branch delay hiding (Branch delay slot / Branch prediction)
  - Loop-level pipelining
    - Hardware approach - OOO Processor
    - Software approach - VLIW
  - Thread-level pipelining (memory latency hiding)
    - Multi-core / GPU / NPU

</div>

<!--
오늘은 CPU, GPU, NPU 아키텍처들을 레이턴시 하이딩 관점에서 비교해 볼 것입니다.
-->

---
level: 2
---

# Latency vs. Throughput

<div class="flex justify-center mt-4">
  <img src="/images/07/slide09_1.png" class="h-80" />
</div>

- **Latency**: 하나의 작업을 완료하는 데 걸리는 시간
- **Throughput**: 단위 시간당 처리되는 작업의 양

<!--
레이턴시는 작업을 완료하는 데 걸리는 시간을 의미합니다.
처리량은 단위 시간당 처리되는 작업의 양(속도)을 의미합니다.
일반적으로 레이턴시가 짧으면 처리량은 증가합니다.
-->

---
level: 2
---

# Latency Hiding & Parallelism

<div class="grid grid-cols-2 gap-8 mt-4">
<div>

**단일 작업 처리**

- Latency가 Throughput에 직접적인 영향을 줌

</div>
<div>

**병렬 작업 처리**

- 얼마나 빠르게 새로운 task를 시작할 수 있는가가 Throughput을 결정
- 작업 간 의존성이 없어야 동시 처리 가능

</div>
</div>

<div class="mt-8 text-center text-sm text-gray-400">

→ Latency와 Throughput은 항상 직접적인 연관 관계를 갖지는 않음

</div>

<!--
한번에 단일 작업만 처리 가능한 경우, 작업 완료 시간이 처리량에 직접 영향을 줍니다.
만약 여러 작업을 동시에 처리할 수 있다면, 새 작업을 얼마나 빠르게 시작할 수 있는가가 처리량을 결정합니다.
-->

---
level: 2
---

# Agenda Today

<div class="mt-4">

- ~~Latency, Throughput, and Latency Hiding~~
- <span class="text-orange-400 font-bold border border-orange-400 border-dashed px-2 py-1">Latency hiding을 위한 여러 microarchitecture 기법들</span>
  - <span class="text-orange-400 font-bold border border-orange-400 border-dashed px-2 py-1">Instruction-level pipelining</span>
    - Pipelined architecture
    - Branch delay hiding (Branch delay slot / Branch prediction)
  - Loop-level pipelining
    - Hardware approach - OOO Processor
    - Software approach - VLIW
  - Thread-level pipelining (memory latency hiding)
    - Multi-core / GPU / NPU

</div>

---
level: 2
---

# Instruction-Level Pipelining (1)

인스트럭션들의 순차적 수행:

<div class="flex justify-center mt-8">

```mermaid {scale: 0.7}
gantt
    dateFormat X
    axisFormat %s
    section Pipeline
    Instruction 1 :a, 0, 3
    Instruction 2 :b, 3, 6
    Instruction 3 :c, 6, 9
```

</div>

- 각 Instruction의 수행 시간 = **Latency**
- Instruction마다 레이턴시가 다를 수 있음
- 한 사이클에 끝날 수도, 여러 사이클이 걸릴 수도 있음

<!--
컴퓨터 프로그램은 프로세서에서 명령어들의 연속적인 수행으로 이루어집니다.
각 명령어가 수행되는 데 걸리는 시간을 레이턴시라고 할 수 있습니다.
-->

---
level: 2
---

# Instruction-Level Pipelining (2): 5-Stage Pipeline

<div class="mt-4">

**MIPS 5-Stage Pipeline**: IF → ID → EX → ME → W

</div>

<div class="flex justify-center mt-4">

| Cycle | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|-------|---|---|---|---|---|---|---|---|---|
| Inst 1 | **IF** | **ID** | **EX** | **ME** | **W** | | | | |
| Inst 2 | | **IF** | **ID** | **EX** | **ME** | **W** | | | |
| Inst 3 | | | **IF** | **ID** | **EX** | **ME** | **W** | | |
| Inst 4 | | | | **IF** | **ID** | **EX** | **ME** | **W** | |
| Inst 5 | | | | | **IF** | **ID** | **EX** | **ME** | **W** |

</div>

<div class="mt-4 text-center">

의존성 없는 명령어들의 경우: **x5 Throughput** 향상

</div>

<!--
인스트럭션 레벨 파이프라이닝은 MIPS 아키텍처에서 사용된 방식입니다.
단계: Instruction Fetch (IF), Instruction Decode (ID), Execution (EX), Memory Access (MEM), Write Back (W).
의존성이 없는 명령어들의 경우 매 사이클마다 새로운 명령어를 Fetch할 수 있어 5배의 처리량 향상이 가능합니다.
-->

---
level: 2
---

# Vertical Microcode (Encoding)

<div class="flex justify-center mt-4">
  <img src="/images/07/slide14_1.png" class="h-72" />
</div>

- 일반적인 RISC/CISC 명령어 세트는 **Vertical Encoding** 방식 사용
- 명령어의 각 비트 역할이 하드웨어 동작에 직접 노출되지 않음
- 디코딩을 통해 하드웨어 제어 신호로 펼쳐짐
- 파이프라인 아키텍처의 디테일은 **소프트웨어에 노출되지 않음** → HW 자체적 최적화

<!--
일반적인 RISC나 CISC 명령어 세트는 버티컬 인코딩 방식을 사용합니다.
명령어 단계에서는 중첩된 정보들이 디코딩을 통해 하드웨어 제어 신호로 펼쳐집니다.
-->

---
level: 2
---

# MIPS 5-Stage Pipeline 상세 구조

<div class="flex justify-center mt-2">
  <img src="/images/07/slide15_1.png" class="h-80" />
</div>

<div class="text-sm mt-2">

- 디코딩된 신호가 레지스터 파일, ALU, 다음 스테이지의 입력으로 분기
- ISA만으로는 마이크로아키텍처의 구조를 파악할 수 없음

</div>

<!--
5개의 스테이지로 분리된 파이프라인 구조입니다.
Instruction Fetch 후, 디코딩 과정을 거치며 명령어는 다양한 신호로 분기됩니다.
-->

---
level: 2
---

# Data Hazard Avoidance with Bypass Logic

<div class="flex justify-center mt-4">
  <img src="/images/07/slide16_1.png" class="h-64" />
</div>

- 파이프라인 **버블(Bubble)** 또는 **스톨(Stall)** → 성능 저하
- 레지스터 간 의존성에 의한 **Data Hazard** 발생 가능
- **Bypass Logic**: 아직 레지스터에 저장되지 않은 데이터를 다음 스테이지로 바로 전달 (Forwarding)
- 모든 해저드를 항상 해결할 수 있는 것은 아님

<!--
파이프라인 아키텍처가 항상 이상적인 성능을 내는 것은 아닙니다.
버블 발생 원인 중 하나는 레지스터 간의 의존성(Data Hazard)입니다.
바이패스 로직을 사용하여 데이터를 다음 스테이지로 바로 전달할 수 있습니다.
-->

---
level: 2
---

# But How About Branch Latency?

<div class="flex justify-center mt-4">
  <img src="/images/07/slide17_1.png" class="h-64" />
</div>

- **Branch 명령어**는 파이프라인에서 특히 문제
- 파이프라인 첫 단계는 IF인데, 분기 주소를 알아야 Fetch 가능
- 분기 조건/주소가 결정될 때까지 Fetch를 할 수 없음 → **Stall 불가피**
- 인스트럭션 6~7개 중 하나는 Branch (integer program 기준)

<!--
분기(Branch) 명령어는 파이프라인에서 특히 문제가 됩니다.
분기 조건 또는 주소가 결정될 때까지 Fetch를 할 수 없습니다.
-->

---
level: 2
---

# Branch Latency Hiding: Delayed Slot

<div class="flex justify-center mt-4">
  <img src="/images/07/slide18_1.png" class="h-56" />
</div>

- MIPS: **Branch Delay Slot** - 분기 여부와 관계없이 무조건 실행되는 명령어
- 단점:
  - 컴파일러가 Delay Slot에 넣을 Instruction을 못 찾을 수 있음
  - Pipeline depth가 늘어나면 Branch Delay가 길어짐
- 현재는 거의 사용되지 않는 기법

<!--
MIPS 아키텍처에서는 브랜치 딜레이 슬롯 기법을 사용했습니다.
하지만 사용하기 복잡하고 파이프라인 깊이가 깊어지면 해결하기 어려워 현재는 거의 사용되지 않습니다.
-->

---
level: 2
---

# Branch Latency Hiding: Branch Prediction

<div class="flex justify-center mt-4">
  <img src="/images/07/slide19_1.png" class="h-56" />
</div>

- **Branch Prediction**: 분기가 Taken/Not Taken 여부를 예측
- **Branch Target Buffer (BTB)**: 분기 대상 주소를 캐싱
- 예측이 맞으면 대기 없이 다음 명령어를 Fetch
- **Prediction이 언제나 맞지는 않음** → Misprediction 시 Rollback 필요
- 이러한 방식을 **Speculative Execution**이라고 부름

<!--
분기 예측은 분기가 실행될지 아닐지를 예측하는 것입니다.
분기 대상 버퍼(BTB)를 사용하여 버블을 최소화합니다.
미리 예측하고 실행하는 방식을 추측 실행(Speculative Execution)이라고 부릅니다.
-->

---
level: 2
---

# Agenda Today

<div class="mt-4">

- ~~Latency, Throughput, and Latency Hiding~~
- Latency hiding을 위한 여러 microarchitecture 기법들
  - ~~Instruction-level pipelining~~
  - <span class="text-orange-400 font-bold border border-orange-400 border-dashed px-2 py-1">Loop-level pipelining</span>
    - Hardware approach - OOO Processor
    - Software approach - VLIW
  - Thread-level pipelining (memory latency hiding)
    - Multi-core / GPU / NPU

</div>

<!--
인스트럭션 수준보다 더 높은 수준으로 올라가 루프 가속화를 살펴보겠습니다.
프로그램 실행 성능을 높이는 데 가장 중요한 것은 반복되는 루프(Loop)입니다.
-->

---
level: 2
---

# Loop을 더 빠르게 돌릴 순 없을까?

<div class="grid grid-cols-2 gap-4 mt-4">
<div>
  <img src="/images/07/slide21_1.png" class="h-40" />
</div>
<div class="flex flex-col justify-center">

- BLT = Conditional Branch (루프의 Back Edge)
- 조건부 분기가 해결되어야 다음 iteration 수행 가능
- 기본적으로 **순차적으로 수행**할 수밖에 없음

</div>
</div>

---
level: 2
---

# 만약 iteration들을 중첩시켜 Latency Hiding을 한다면?

<div class="grid grid-cols-2 gap-4 mt-4">
<div>
  <img src="/images/07/slide22_1.png" class="h-40" />
</div>
<div>
  <div class="flex gap-2 mt-2">
    <img src="/images/07/slide22_2.png" class="h-28" />
    <img src="/images/07/slide22_3.png" class="h-28" />
    <img src="/images/07/slide22_4.png" class="h-28" />
  </div>
</div>
</div>

<div class="mt-4 text-center">

**각 iteration이 다른 data를 접근한다면 충분히 가능**

루프 간 의존성이 약하면 파이프라이닝으로 성능 향상 가능

</div>

<!--
명령어 수준에서 파이프라이닝을 적용했듯이, 루프 수준에서도 파이프라이닝을 적용하면 루프를 가속화할 수 있습니다.
루프 간의 의존성이 약해서 현재 반복이 끝나기 전에 다음 반복을 시작할 수 있을 때 가능합니다.
-->

---
level: 2
---

# 방해요소 & 해결책

<div class="grid grid-cols-3 gap-4 mt-8">
<div>
  <img src="/images/07/slide23_1.png" class="h-36" />
</div>
<div>

**방해요소**

- Control Flow (conditional branch)
- 다른 iteration의 instruction 사이 **False Data Dependency**
  - True Dependency: 값이 계산되고 사용되는 관계
  - False Dependency: 저장 공간(레지스터)이 겹쳐서 발생

</div>
<div>

**해결책**

- **Branch Prediction** → Control Flow 해결
- **Register Renaming** → False Dependency 해결

</div>
</div>

<!--
루프 수준 파이프라이닝의 방해요소: Control Flow와 False Dependency.
해결책으로 Branch Prediction과 Register Renaming이 있습니다.
-->

---
level: 2
---

# Out-Of-Order Execution

<div class="grid grid-cols-3 gap-4 mt-4">
<div>
  <img src="/images/07/slide24_1.png" class="h-32" />
  <div class="text-xs text-center mt-1">sequential code로부터</div>
</div>
<div>
  <div class="flex flex-col gap-2">
    <img src="/images/07/slide24_2.png" class="h-28" />
    <img src="/images/07/slide24_3.png" class="h-28" />
  </div>
  <div class="text-xs text-center mt-1">branch prediction으로 speculative trace 생성</div>
</div>
<div>
  <img src="/images/07/slide24_4.png" class="h-32" />
  <div class="text-xs text-center mt-1">register renaming 후 data-flow graph로 전환</div>
</div>
</div>

<div class="mt-4 text-center">

- **"topological order로 병렬 처리 가능"** → **"최적화 적용이 편해짐"**
- 이러한 방식이 **Out-of-Order Processor**

</div>

<!--
하드웨어적으로 물리적 레지스터를 아키텍처적 레지스터보다 훨씬 많이 가지고 있어 리네이밍이 가능합니다.
순차적인 코드를 데이터 플로우 그래프로 전환하여 의존성이 해결된 명령어들을 동시에 수행할 수 있습니다.
-->

---
level: 2
---

# 결과적으로 Loop을 Pipeline된 형태로 수행

<div class="grid grid-cols-2 gap-4 mt-4">
<div>
  <div class="flex gap-1">
    <img src="/images/07/slide25_1.png" class="h-28" />
    <img src="/images/07/slide25_2.png" class="h-28" />
  </div>
  <div class="flex gap-1 mt-1">
    <img src="/images/07/slide25_3.png" class="h-28" />
    <img src="/images/07/slide25_4.png" class="h-28" />
  </div>
</div>
<div class="flex flex-col justify-center">

- 현재 사용되는 대부분의 CPU (Intel, AMD)는 **OOO 프로세서** 기법 사용
- 결과적으로 **루프 레벨 파이프라인**이 형성됨
- 매 cycle **3개의 instruction을 수행**하는 효과
- 명령어 레벨 파이프라인과 유사한 스테이지 구조가 루프 레벨에서 형성

</div>
</div>

<!--
현재 사용되는 대부분의 CPU는 Out-of-Order 프로세서 기법을 사용합니다.
하드웨어적 자료 구조(Reorder Buffer, Reservation Table)를 통해 데이터 플로우 그래프가 동적으로 생성됩니다.
명령어 윈도우 단위로 데이터 플로우 그래프가 유지됩니다.
-->

---
level: 2
---

# Intel Core Architecture: OOO Engine

<div class="flex justify-center mt-2">
  <img src="/images/07/slide26_1.png" class="h-80" />
</div>

<div class="text-sm text-center mt-2">

**Reorder Buffer** = Register Renaming + 동적 Data-Flow Graph 태깅/유지 장치

</div>

<!--
인텔 코어 아키텍처의 그림입니다. Reorder Buffer가 레지스터 리네이밍과 데이터 플로우 그래프를 유지합니다.
-->

---
level: 2
---

# Agenda Today

<div class="mt-4">

- ~~Latency, Throughput, and Latency Hiding~~
- Latency hiding을 위한 여러 microarchitecture 기법들
  - ~~Instruction-level pipelining~~
  - Loop-level pipelining
    - ~~Hardware approach - OOO Processor~~
    - <span class="text-orange-400 font-bold border border-orange-400 border-dashed px-2 py-1">Software approach - VLIW</span>
  - Thread-level pipelining (memory latency hiding)
    - Multi-core / GPU / NPU

</div>

<!--
같은 효과를 소프트웨어적으로 처리하는 VLIW에 대해 설명합니다.
이것이 나중에 GPU와 NPU의 차이와 굉장히 유사합니다.
-->

---
level: 2
---

# Loop을 Pipeline된 형태로 수행하고 싶으면...

<div class="grid grid-cols-2 gap-4 mt-4">
<div>
  <div class="flex gap-1">
    <img src="/images/07/slide28_1.png" class="h-28" />
    <img src="/images/07/slide28_2.png" class="h-28" />
  </div>
  <div class="flex gap-1 mt-1">
    <img src="/images/07/slide28_3.png" class="h-28" />
    <img src="/images/07/slide28_4.png" class="h-28" />
  </div>
</div>
<div class="flex flex-col justify-center text-sm">

OOO Processor의 문제:
- 동적 Data-Flow Graph 생성/관리가 **매우 복잡**
- Branch Prediction 실패 시 **Rollback** 필요
- 명령어 윈도우를 키울수록 복구 과정이 더 복잡

**대안**: 처음부터 Loop을 파이프라인된 형태로 만드는 것이 낫지 않나?

</div>
</div>

<!--
OOO 프로세서의 동적 데이터 플로우 그래프 관리는 매우 복잡합니다.
대안으로 소프트웨어가 미리 파이프라인된 형태로 만들어 하드웨어에 전달하는 방식이 있습니다.
-->

---
level: 2
---

# ... 처음부터 Loop을 그렇게 만드는 게 낫지 않나?

<div class="flex justify-center mt-4">
  <div class="flex gap-1 flex-wrap justify-center">
    <img src="/images/07/slide29_1.png" class="h-12" />
    <img src="/images/07/slide29_2.png" class="h-12" />
    <img src="/images/07/slide29_3.png" class="h-12" />
  </div>
</div>

<div class="mt-4">

- 소프트웨어적으로 루프를 **파이프라인된 형태로 미리 구성**
- 하드웨어는 소프트웨어가 만들어 놓은 파이프라인을 **그대로 반복 수행**
- 하드웨어가 훨씬 **단순**해지고 실행 **효율성** 향상 가능
- 이것이 **VLIW (Very Long Instruction Word)** 아키텍처

</div>

<!--
대안적인 방법: 소프트웨어적으로 루프를 미리 파이프라이닝된 형태로 만들어서 하드웨어에 전달합니다.
하드웨어는 복잡한 과정 없이 소프트웨어가 만들어 놓은 파이프라인을 그대로 수행합니다.
이러한 아키텍처를 VLIW라고 합니다.
-->

---
level: 2
---

# VLIW Architecture

<div class="flex justify-center mt-4">
  <img src="/images/07/slide30_1.png" class="h-64" />
</div>

- 여러 Functional Unit이 병렬로 처리 가능한 구조
- **명시적인(Explicit) 병렬 프로그래밍** - Sequential이 아닌 Parallel
- 하드웨어 제어 명령어가 매우 길어서 **Very Long Instruction Word**
- 각 사이클마다 HW가 어떤 일을 해야 하는지 명시적으로 표현

<!--
VLIW 아키텍처는 여러 Functional Unit이 병렬로 처리할 수 있도록 구성되어 있습니다.
순차적 프로그래밍이 아닌 명시적인 병렬 프로그래밍을 사용합니다.
-->

---
level: 2
---

# Very Long Instruction Word (VLIW) = Horizontal Encoding

<div class="flex justify-center mt-4">
  <img src="/images/07/slide31_1.png" class="h-48" />
</div>

<div class="grid grid-cols-2 gap-8 mt-4">
<div>

**Vertical Encoding** (RISC/CISC)
- 비트들이 인코딩되어 숨겨져 있음
- 디코딩 → HW 제어 신호로 펼쳐짐

</div>
<div>

**Horizontal Encoding** (VLIW)
- HW 구조에 맞춰 명령어가 펼쳐져 있음
- SW가 HW의 각 부분이 어떤 작업을 수행할지 **명시적으로 지정**

</div>
</div>

<!--
VLIW의 명령어 인코딩 방식은 호라이즌틀 인코딩이라고 할 수 있습니다.
핵심 차이: 호라이즌틀 인코딩에서는 하드웨어 디테일이 소프트웨어에 그대로 노출됩니다.
-->

---
level: 2
---

# Vertical vs. Horizontal Encoding

<div class="grid grid-cols-2 gap-4 mt-4">
<div>
  <img src="/images/07/slide32_1.png" class="h-48" />
  <div class="text-center text-sm mt-2">Vertical Encoding</div>
</div>
<div>
  <img src="/images/07/slide32_2.png" class="h-48" />
  <div class="text-center text-sm mt-2">Horizontal Encoding</div>
</div>
</div>

<div class="text-center mt-4">

**Can Be Hierarchical** - 상위 레벨은 Horizontal, 각 단위에서는 Vertical 인코딩 가능

</div>

<!--
두 인코딩 방식은 완전히 분리된 것이 아니라 계층적으로 사용될 수 있습니다.
핵심 차이점: 호라이즌틀 인코딩에서는 하드웨어 디테일이 소프트웨어에 그대로 노출됩니다.
-->

---
level: 2
---

# Modular Scheduling: SW Pipelining의 핵심 알고리즘

<div class="flex justify-center mt-4">
  <img src="/images/07/slide33_1.png" class="h-64" />
</div>

<div class="text-center mt-4">

**"Iterative Modulo Scheduling"** - Bob Rau (1992, HP Labs)

소프트웨어 파이프라이닝의 대표적 컴파일러 알고리즘

</div>

<!--
파이프라인을 생성하는 대표적인 컴파일러 알고리즘은 모듈러 스케줄링입니다.
Bob Rau가 1980년대에 개발하고 1992년에 논문으로 발표했습니다.
-->

---
level: 2
---

# Modular Scheduling 상세

<div class="grid grid-cols-2 gap-4 mt-4">
<div>
  <img src="/images/07/slide34_1.png" class="h-56" />
</div>
<div>
  <img src="/images/07/slide34_2.png" class="h-56" />
</div>
</div>

<div class="text-sm mt-4">

- OOO Processor가 하드웨어적으로 데이터 플로우 그래프를 만들어 처리하는 것과 유사한 작업을 **컴파일러가 소프트웨어적으로 수행**
- 이 알고리즘이 잘 설계되어 대부분의 컴파일러가 이 틀을 사용하여 SW Pipelining 구현

</div>

<!--
모듈러 스케줄링은 데이터 플로우 그래프를 하드웨어가 아닌 컴파일러가 소프트웨어적으로 처리합니다.
-->

---
level: 2
---

# Reconfigurable Architecture (Extreme VLIW)

<div class="grid grid-cols-2 gap-4 mt-4">
<div>
  <img src="/images/07/slide35_1.png" class="h-60" />
</div>
<div>
  <div class="flex flex-col gap-2">
    <img src="/images/07/slide35_2.png" class="h-28" />
    <img src="/images/07/slide35_3.png" class="h-28" />
  </div>
</div>
</div>

<div class="mt-4 text-sm">

- VLIW는 최근 **Reconfigurable Processor**라고도 불림
- HW의 다양한 부분을 제어하는 것 자체가 HW를 재구성하는 것과 유사
- 최근 출시되는 많은 **NPU들이 Reconfigurable Architecture 개념에 맞춰 설계**

</div>

<!--
VLIW는 최근에 재구성 가능 프로세서(Reconfigurable Processor)라고도 불립니다.
최근에 출시되는 많은 NPU들이 이러한 재구성 가능 아키텍처 개념에 맞춰 설계되고 있습니다.
-->

---
level: 2
---

# Loop-Level Pipelining Summary

<div class="grid grid-cols-2 gap-4 mt-4">
<div>
  <div class="flex gap-1">
    <img src="/images/07/slide36_1.png" class="h-28" />
    <img src="/images/07/slide36_2.png" class="h-28" />
  </div>
  <div class="flex gap-1 mt-1">
    <img src="/images/07/slide36_3.png" class="h-28" />
    <img src="/images/07/slide36_4.png" class="h-28" />
  </div>
</div>
<div class="flex flex-col justify-center">

- **Loop pipelining** = loop iteration을 중첩하여 latency hiding

<v-click>

- **OOO Processor**: HW가 동적으로 이 효과를 만들어냄
  - Tomasulo Algorithm (1960s)

</v-click>

<v-click>

- **VLIW Processor**: SW가 정적으로 이 효과를 만들어냄
  - Modular Scheduling (1992)

</v-click>

</div>
</div>

<!--
루프 파이프라이닝 두 가지 접근: OOO Processor는 HW가 동적으로, VLIW는 SW가 정적으로 처리합니다.
SW 접근의 장점: HW 단순화, 컴파일 시 더 다양한 최적화 가능.
SW 접근의 단점: 분기가 많은 프로그램에서 어려움, 캐시 미스 등 동적 이벤트 대응 어려움.
-->

---
level: 2
---

# Agenda Today

<div class="mt-4">

- ~~Latency, Throughput, and Latency Hiding~~
- Latency hiding을 위한 여러 microarchitecture 기법들
  - ~~Instruction-level pipelining~~
  - ~~Loop-level pipelining~~
  - <span class="text-orange-400 font-bold border border-orange-400 border-dashed px-2 py-1">Thread-level pipelining (= memory latency hiding)</span>
    - Multi-core / GPU / NPU

</div>

<!--
이제 스레드 레벨 파이프라이닝에 대해 설명할 것이며, 이는 GPU와 밀접하게 관련되어 있습니다.
-->

---
level: 2
---

# Intel CPU는 2000년대 변곡점을 지나감

<div class="flex justify-center mt-4">
  <img src="/images/07/slide38_1.png" class="h-64" />
</div>

- 1990년대: 클럭 속도 향상 + ILP 극대화의 황금기
- 2000년대: **Pentium 4** - 과도한 파이프라이닝으로 발열 문제 → 대실패
- **Dennard Scaling의 한계** → Clock Frequency 경쟁 종료

<!--
1990년대는 CPU 디자인의 황금기였습니다.
펜티엄 4의 실패 이후, 클럭 속도를 높이는 경쟁은 2000년대에 중단됩니다.
-->

---
level: 2
---

# Clock Frequency Scaling의 종료

<div class="flex justify-center mt-2">
  <img src="/images/07/slide39_1.png" class="h-72" />
</div>

- 트랜지스터 집적 → 열 밀도 상승 → 더 이상 해결 불가
- **인텔의 전환**: ILP 추구 → **Multi-Core** + **Multi-Threading**
- 인터넷/서버 시장 성장으로 병렬 처리 프로세서가 더 중요해짐

<!--
Dennard Scaling의 한계로 클럭 속도 경쟁이 종료되고, 멀티코어로 전환하게 됩니다.
-->

---
level: 2
---

# DRAM Bandwidth를 어떻게 최대한 활용하느냐?

<div class="flex justify-center mt-4">
  <img src="/images/07/slide40_1.png" class="h-16" />
</div>

<div class="flex justify-center mt-4">

```mermaid {scale: 0.65}
graph TD
    CU1["Compute Unit"] --- IC["Interconnect"]
    CU2["Compute Unit"] --- IC
    CU3["Compute Unit"] --- IC
    IC --- OCM1["On-Chip Mem"]
    IC --- OCM2["On-Chip Mem"]
    IC --- OCM3["On-Chip Mem"]
    OCM1 --- MW["Memory Wall 🧱"]
    OCM2 --- MW
    OCM3 --- MW
    MW --- DRAM["DRAM"]

    style MW fill:#ef4444,stroke:#ef4444,color:#fff
```

</div>

<div class="text-center mt-2">

현대 프로세서의 가장 큰 성능 병목: **Memory Wall** (오프칩 메모리 접근 속도)

</div>

<!--
현대 프로세서의 가장 큰 성능 병목 지점은 오프칩 메모리로의 접근입니다.
이를 Memory Wall이라고 부르며 프로세서 설계에서 가장 중요한 과제 중 하나입니다.
-->

---
level: 2
---

# Memory Wall 문제

<div class="grid grid-cols-2 gap-4 mt-4">
<div>
  <img src="/images/07/slide41_1.png" class="h-52" />
</div>
<div>
  <img src="/images/07/slide41_2.png" class="h-52" />
</div>
</div>

<div class="mt-4 text-center">

Memory Wall 문제를 가장 효과적으로 해결하는 방법: **Multithreading**

</div>

<!--
"Memory Wall"이라는 용어는 1994년경에 처음 등장한 것으로 알려져 있습니다.
메모리 레이턴시를 가장 효과적으로 해결할 수 있는 방법 중 하나가 멀티 스레딩입니다.
-->

---
level: 2
---

# Multithreading을 활용한 Memory Latency Hiding

<div class="flex flex-col items-center gap-2 mt-4">
  <img src="/images/07/slide42_2.png" class="h-36" />
  <img src="/images/07/slide42_1.png" class="h-28" />
</div>

<div class="text-center mt-4">

**Multithreading을 활용한 Memory Latency Hiding**

하나의 스레드가 메모리 접근으로 대기 중일 때 다른 스레드를 실행

</div>

<!--
멀티 스레딩을 활용하면 하나의 스레드가 메모리 접근으로 대기하는 동안 다른 스레드를 실행할 수 있습니다.
-->

---
level: 2
---

# 같은 시기 GPU는 Programmable Device로 변신

<div class="grid grid-cols-2 gap-4 mt-4">
<div>
  <img src="/images/07/slide43_1.png" class="h-56" />
</div>
<div>
  <img src="/images/07/slide43_2.png" class="h-56" />
</div>
</div>

<div class="text-sm mt-4">

- CPU가 Multi-Core로 전환하던 같은 시기 (2000년대)
- **그래픽스 프로세서**: Fixed-Function → **Programmable Device**로 변신
- Shader Programming의 등장

</div>

<!--
인텔 프로세서가 Dennard Scaling의 한계에 부딪혀 멀티 코어로 전환하는 시기에,
GPU도 Fixed-Function에서 Programmable Device로 변신하게 됩니다.
-->

---
level: 2
---

# CPU vs GPU: 설계 철학의 차이

<div class="flex justify-center mt-4">
  <img src="/images/07/slide44_1.png" class="h-72" />
</div>

- **GPU**: 픽셀/삼각형 단위의 **Massive Parallelism** 활용
- CPU 대비: **Computing Density** 높음, **동시 처리 스레드 수** 많음
- **Control 단순화**: OOO 엔진 등 복잡한 장치 제거, Throughput 극대화에 집중

<!--
GPU는 픽셀, 삼각형 단위의 엄청난 병렬성을 활용합니다.
싱글 스레드 성능을 위한 복잡한 장치를 제거하고, 처리량 극대화에 최적화되었습니다.
-->

---
level: 2
---

# CUDA and SIMT (Single Instruction Multiple Threads)

<div class="flex justify-center mt-4">
  <img src="/images/07/slide45_1.png" class="h-52" />
</div>

- **CUDA** (2007): Shader 아키텍처를 SW가 이해할 수 있는 프로그래밍 모델로 정리
- **SIMT**: SIMD와 유사하지만 GPU의 메모리 레이턴시 하이딩에 특화
- ThreadBlock, **Warp** 개념
- **Cache miss 발생 → 다른 Warp으로 switch** → Latency Hiding

<!--
CUDA는 2007년경에 등장하여 SIMT 프로그래밍 모델을 제시했습니다.
캐시 미스가 발생하면 다른 Warp으로 스위치하여 레이턴시를 숨깁니다.
-->

---
level: 2
---

# GPU: All About Hiding Latency

<div class="flex justify-center mt-4">
  <img src="/images/07/slide46_1.png" class="h-64" />
</div>

- GPU는 **"All About Hiding Latency"**라고 할 만큼 메모리 레이턴시 문제에 집중
- 현재 GPU는 2000~2010년 사이에 정의된 아키텍처와는 많이 달라짐
- ML의 특성에 맞게 변모 중이지만, 초기 설계 **철학은 여전히 유지**

<!--
GPU는 메모리 레이턴시 문제를 SIMT 아키텍처를 통해 효과적으로 해결했습니다.
처음 만들어졌을 때의 철학은 여전히 유지되고 있다고 생각합니다.
-->

---
level: 2
---

# NVIDIA GPU의 성장

<div class="flex justify-center mt-4">
  <img src="/images/07/slide47_1.png" class="h-72" />
</div>

- 원래 ML을 위해 설계된 것은 아니지만, ML에 매우 적합
- ML 붐과 함께 NVIDIA가 크게 성장
- 컴퓨팅 성능이 세대마다 급속히 향상

<!--
GPU는 머신 러닝을 위해 설계된 것은 아니지만 머신 러닝에 매우 적합합니다.
엔비디아는 ML 붐과 함께 크게 성장했습니다.
-->

---
level: 2
---

# Computing vs. Memory Bandwidth Gap

<div class="flex justify-center mt-4">
  <img src="/images/07/slide48_1.png" class="h-64" />
</div>

- 컴퓨팅 성능 향상 속도 vs. 메모리 대역폭 향상 속도: **갭이 점점 벌어짐**
- Blackwell GPU: 성능의 한계점에 도달한 것이 아닌가 하는 수준
- DeepSeek 등의 등장으로 **스케일업 vs. 효율성** 논의 활발

<!--
GPU의 컴퓨팅 성능이 향상되는 속도에 비해 메모리 대역폭은 따라가지 못하고 있습니다.
갭이 점점 더 벌어지고 있는 상황입니다.
-->

---
level: 2
---

# GPU의 Multithreading Overhead 논의

<div class="grid grid-cols-2 gap-4 mt-4">
<div>
  <img src="/images/07/slide49_1.png" class="h-52" />
</div>
<div class="text-sm flex flex-col justify-center">

> *"(1) GPGPU's multithreading overhead: It is not our intention to lessen GPGPUs' huge contribution to ML's recent success... Overhead or not, there were no alternatives, until other options came along"*

<div class="mt-2 text-xs text-gray-400">

https://www.sigarch.org/why-the-gpgpu-is-less-efficient-than-the-tpu-for-dnns

</div>

</div>
</div>

<div class="mt-4 text-sm">

- GPU의 SIMT 방식이 ML에 완벽하게 적합한지에 대한 의문 존재
- 최신 GPU는 기존 한계를 다양한 방법으로 극복 중

</div>

<!--
엔비디아가 처음 선택한 방법이 머신 러닝에 완벽하게 적합하다고 단정하기는 어렵습니다.
하지만 대안이 없었기에 GPU가 AI 가속기의 표준이 되었습니다.
-->

---
level: 2
---

# GPU vs NPU: 핵심 대비

<div class="grid grid-cols-2 gap-8 mt-4">
<div>

### HW Pipelining

<div class="flex gap-4 mt-4">
<div class="text-center">
  <img src="/images/07/slide50_2.png" class="h-28" />
  <div class="text-sm mt-1">OOO Processor</div>
</div>
<div class="text-center">
  <img src="/images/07/slide50_3.png" class="h-28" />
  <div class="text-sm mt-1">GPU</div>
</div>
</div>

</div>
<div>

### SW Pipelining

<div class="flex gap-4 mt-4">
<div class="text-center">
  <img src="/images/07/slide50_1.png" class="h-28" />
  <div class="text-sm mt-1">VLIW Processor</div>
</div>
<div class="text-center">
  <img src="/images/07/slide50_4.png" class="h-28" />
  <div class="text-sm mt-1">NPU</div>
</div>
</div>

</div>
</div>

<div class="text-center mt-4 text-sm">

**OOO : VLIW = GPU : NPU** - 같은 패턴의 HW vs. SW 접근

</div>

<!--
GPU가 복잡한 HW로 레이턴시를 숨기는 반면, NPU는 SW가 HW를 직접 제어합니다.
OOO Processor : VLIW = GPU : NPU 의 대응 관계입니다.
-->

---
level: 2
---

# NPU Architecture: Scratchpad Memory + DMA

<div class="flex justify-center mt-2">
  <img src="/images/07/slide51_1.png" class="h-8" />
</div>

<div class="flex justify-center mt-2">

```mermaid {scale: 0.55}
graph TD
    CU1["Compute Unit"] --- IC["Interconnect"]
    CU2["Compute Unit"] --- IC
    CU3["Compute Unit"] --- IC
    IC --- |"L1 DMA"| OCM1["On-Chip Mem<br/>(Scratchpad)"]
    IC --- |"L1 DMA"| OCM2["On-Chip Mem<br/>(Scratchpad)"]
    IC --- |"L1 DMA"| OCM3["On-Chip Mem<br/>(Scratchpad)"]
    OCM1 --- |"L2 DMA"| MW["Memory Wall 🧱"]
    OCM2 --- |"L2 DMA"| MW
    OCM3 --- |"L2 DMA"| MW
    MW --- DRAM["DRAM"]

    style OCM1 fill:#3b82f6,stroke:#3b82f6,color:#fff
    style OCM2 fill:#3b82f6,stroke:#3b82f6,color:#fff
    style OCM3 fill:#3b82f6,stroke:#3b82f6,color:#fff
    style MW fill:#ef4444,stroke:#ef4444,color:#fff
```

</div>

NPU의 핵심 특징:
- 온칩 메모리 = **캐시가 아닌 Scratchpad Memory**
- 데이터 이동 = **DMA로 명시적 프로그래밍**
- 모든 HW 유닛이 **SW에 노출** → 개별적으로 프로그래밍 가능

<!--
NPU의 가장 큰 특징은 온칩 메모리가 캐시가 아닌 스크래치패드 메모리이고,
데이터 이동이 DMA를 통해 명시적으로 프로그래밍된다는 점입니다.
-->

---
level: 2
---

# NPU: Horizontal Encoding & Command Stream

<div class="mt-4 text-sm">

NPU 내부 HW가 **횡적으로 펼쳐져** 있고, 각 유닛이 독립적으로 프로그래밍 가능:

</div>

<div class="flex justify-center mt-4">

| Compute Unit | Compute Unit | Compute Unit | L1 DMA | L1 DMA | L1 DMA | L2 DMA | L2 DMA | L2 DMA |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| cmd | cmd | cmd | cmd | cmd | cmd | cmd | cmd | cmd |

</div>

<div class="flex justify-center mt-4">

```mermaid {scale: 0.55}
graph TD
    CS["Command Stream"] --> CP["Command Processor"]
    CP --> SN["Sync Network"]
    SN --> U1["Unit 1"]
    SN --> U2["Unit 2"]
    SN --> U3["..."]
    SN --> UN["Unit N"]
```

</div>

<div class="text-sm mt-2">

- **Command Processor**가 소프트웨어의 계획을 받아 각 HW 유닛에 분배
- **Sync Network**로 서브태스크 간 순서 관계 유지
- VLIW의 **Horizontal Encoding**에 가까운 ISA

</div>

<!--
NPU의 하드웨어 유닛들이 횡적으로 펼쳐져 있고 각각 독립적으로 프로그래밍됩니다.
호라이즌틀 인코딩에 가까운 명령어 집합 아키텍처를 가지고 있습니다.
-->

---
level: 2
---

# NPU Compiler의 역할

<div class="grid grid-cols-2 gap-4 mt-4">
<div>
  <img src="/images/07/slide53_1.png" class="h-28" />
  <div class="text-center text-sm mt-1">Model as a Graph + Architecture Details</div>
</div>
<div>
  <img src="/images/07/slide53_2.png" class="h-28" />
  <div class="text-center text-sm mt-1">NPU Compiler가 실행 계획 생성</div>
</div>
</div>

<div class="mt-4">

| | **GPU** | **NPU** |
|---|---|---|
| **작업 분할** | HW가 동적으로 처리 | SW(컴파일러)가 정적으로 처리 |
| **스케줄링** | HW가 스레드 스케줄링 | 컴파일러가 전체 실행 계획 생성 |
| **HW 복잡도** | 높음 (스케줄링 로직) | 낮음 (실행만 담당) |
| **추상화 수준** | 높음 (CUDA) | 낮음 (HW 디테일 노출) |

</div>

<!--
GPU에서는 하드웨어가 내리는 결정을 NPU에서는 소프트웨어(컴파일러)가 내린다는 것이 핵심적인 차이점입니다.
컴파일러는 아키텍처의 모든 세부 사항을 고려하여 실행 계획을 생성합니다.
-->

---
level: 2
---

# Summary (1/2)

<div class="mt-4">

**Memory Wall → Memory Latency Hiding이 매우 중요**
- Memory Bandwidth를 최대한 잘 활용하는 것과 같은 의미

**CPU → Multi-Core Transition**
- Multithreading을 통한 memory latency hiding

**GPU → All About Hiding Memory Latency with Multithreading**
- CPU보다 Far more efficient
- Massive parallelism (pixels, triangles → ML workloads)

</div>

<!--
메모리 벽 문제가 중요하며, CPU는 멀티코어로, GPU는 멀티스레딩으로 해결합니다.
-->

---
level: 2
---

# Summary (2/2)

<div class="mt-4">

**GPU vs NPU - 핵심 대비**

</div>

<div class="grid grid-cols-2 gap-8 mt-4">
<div class="border border-blue-400 rounded p-4">

### GPU: Memory Latency Hiding with **HW**

- **Vertical encoding** (HW 디테일 숨김)
- HW가 동적으로 스레드 스케줄링
- Similar to **OOO Processor**

</div>
<div class="border border-orange-400 rounded p-4">

### NPU: Memory Latency Hiding with **SW**

- **Horizontal encoding** (HW 디테일 노출)
- Greater details of HW exposed to SW
- Similar to **VLIW (or Reconfigurable) Processor**

</div>
</div>

<!--
GPU는 HW 중심의 최적화(vertical encoding, OOO processor와 유사),
NPU는 SW 중심의 최적화(horizontal encoding, VLIW/reconfigurable processor와 유사)입니다.
-->

---
level: 2
layout: center
class: text-center
---

# 감사합니다
