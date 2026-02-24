---
layout: cover
---

# Week 1: Pytorch의 기술적인 배경

Pytorch + NPU 온라인 모임 #1 | 2024-12-04

<div class="abs-tl m-6">
  <span @click="$slidev.nav.go(1)" class="cursor-pointer opacity-50 hover:opacity-100 text-sm">
    ← 목차로 돌아가기
  </span>
</div>

---
level: 2
---

# 환영합니다

<!--
어젯밤에 오늘 어쩌면은 오프라인 모임이고 뭐고 다 못할 수도 있겠다 생각이 들었었는데 아침에 일어나 보니까 상황이 좀 정리가 된 것 같아서 예정대로 진행을 하면 되겠구나 라고 해서 열었습니다만, 기술적인 이슈와 예상하지 못한 이슈로 약간 해커톤 수준으로 창의적으로 지금 두 개의 Google Meet을 띄워서 컴퓨터에서 동시에 브로드캐스트를 해보는 아주 색다른 경험을 해보고 있는 것 같습니다. 오늘 준비한 내용을 최선을 다해서 전달을 해보도록 하겠습니다. 일단 환영합니다.
-->

---
level: 2
---

# 랩장 소개

- 리벨리온에서 SW를 개발하고 있습니다
- 컴파일러 연구 / 개발을 오랫동안 해 왔습니다
- Pytorch에 관심이 매우 높습니다
  - 리벨리온 NPU를 Pytorch에 붙이는 일을 하고 있습니다
  - Pytorch Foundation에서 리벨리온을 대표하는 일을 하고 있습니다
  - Pytorch KR의 Pytorch Core SIG를 만들고, 운영시작하려 합니다

<!--
저는 리벨리온에서 소프트웨어를 개발을 하고 있고 compiler 연구 개발을 꽤 오랫동안 해왔고요. 그다음에 PyTorch에 대한 관심이 매우 높습니다. 지금 리벨리온에서는 NPU를 PyTorch에 이제 붙이는 일을 하고 있고 그리고 PyTorch Foundation에 리벨리온이 최근에 이제 가입을 해서 거기에서 리벨리온을 대표를 하는 일도 하고 있고요. 그리고 PyTorch KR에도 PyTorch Core SIG를 만들어서 관심 있는 분들과 함께 커뮤니티 활동도 해볼 생각입니다.
-->

---
level: 2
---

# 랩 1기 목표

**랩 차원의 목표**

- Pytorch internal에 관심있는 사람들을 모으고 싶습니다
- Pytorch internal에 대해 함께 공부하고 성장하고 싶습니다
- 더욱 더 많은 사람들이 Pytorch internal을 쉽게 공부할 수 있도록 저희가 함께 공부한 결과를 강의자료로 정리, 공유하고 싶습니다

**개인적인 목표**

- 개인적으로는 공부한 내용을 바탕으로 리벨리온 NPU를 Pytorch에 더 잘 붙여보고 싶습니다
- 많은 분들이 Pytorch upstream에 기여할 수 있으면 좋겠습니다

<!--
저희가 이제 랩을 만약에 저희가 매끄럽게 첫 번째 길을 잘 끝내면 그다음에도 계속해볼 생각인데 일단 첫 번째 랩의 목표는 일단 PyTorch internal에 관심 있는 사람들이 얼마큼 되는지 그래서 다 같이 한번 모여보면 좋겠다라고 생각을 했고요. 그거는 일단 많은 분들께서 관심을 가져주시고 또 오늘 참여를 해 주셔서 일단 첫 단추는 잘 잠근 게 아닌가 그렇게 생각이 들고요. 그리고 다 같이 그런 PyTorch가 실제 안에는 어떻게 생겼는지라고 하는 것들에 대해서 같이 공부하고 성장을 할 수 있으면 좋을 것 같고요. 그리고 그게 이제 저희에서 끝나는 게 아니라 저희가 이제 같이 공부한 그런 결과는 저희가 잘 정리를 해서 더 많은 분들께서 쉽게 PyTorch 안이 어떻게 생겼는지 공부를 하실 수 있도록 공유를 할 수 있으면 좋을 것 같아요.

그리고 이제 제 개인적으로는 제 본업이 리벨리온에서 개발을 하고 있는 거기 때문에 여기서 같이 공부한 것들이 이제 그 업무에 잘 활용이 되면 좋겠다 라고 생각을 하고 있고 그리고 저희가 가지고 있는 목표 중에 하나가 그냥 저희가 private fork를 가지고 있는 게 아니라 upstream을 하는 거여서 저희뿐만이 아니라 여기 계신 많은 분들이 같이 PyTorch upstream에 기여를 해서 한국이 PyTorch upstream에서 큰 그러한 지분을 가져갈 수 있으면 좋겠다 이렇게 개인적으로는 생각을 하고 있어요.
-->

---
level: 2
---

# 랩 운영 방안

**랩 구성원들의 역할**

- 랩장: 랩 운영 총괄. 강의자료 초안 작성
- Offline 참여자: 강의전 강의자료 보강. Q&A 대응
- Online 참여자: 강의 혹은 강의자료에 대한 피드백 혹은 질문 → 강의자료 품질 향상에 기여

**온라인 모임**

- 12월 4일부터 매주 수요일 저녁 7시 - 휴일 제외 총 12회
- 매주 강의 전에 강의 slide 배포 (GitHub + Google Group을 통한 공지)
  - 강의 자료에 대한 간단한 질문은 slide에 코멘트로
  - 좀더 복잡한 질문은 GitHub repo에 issue로

**GitHub repo 운영**

- https://github.com/PyTorchKorea/pytorchcore-kr

<!--
운영 체계: 총괄 및 강의자료 제작 담당. 오프라인 참여자는 온라인 강의 전 강의자료 리뷰 및 보강 참여. 온라인 참여자는 강의 참여 및 강의자료에 대한 사전 피드백/질문 제공을 통한 품질 향상 기여. 총 12회 강의 예정. 당초 회당 1시간 계획이나 유동적 운영 가능. 강의 전 슬라이드 사전 배포 및 공지 진행. Google Group과 GitHub repo를 커뮤니케이션 채널로 활용.
-->

---
level: 2
---

# ML Framework

AI Ecosystem의

<v-clicks>

- **OS**이자 (AI 가속기를 추상화된 computing resource로 제공)
- **Programming Language**이자 (Model을 쉽게 작성할 수 있도록 API 제공)
- **Compiler** (작성된 모델을 computing resource로 mapping)

</v-clicks>

<div v-click class="mt-8 text-center text-xl text-orange-400 font-bold">
  다양한 기술적인 background가 혼재되어 있음!
</div>

<!--
머신러닝 프레임워크의 정의: 파이토치(PyTorch), 텐서플로우(TensorFlow), 잭스(JAX) 등을 포함. AI 에코시스템에서 AI 가속기를 위한 운영체제 역할. 프로그램 언어 제공 및 모델 작성 기능 제공. 컴파일러 역할로서 단순히 AI 가속기에 매핑하는 것이 아니라, 트랜스포메이션 과정을 통해 하드웨어 타겟에 최적화. 다양한 기술의 융합을 통해 컴파일러 기능을 수행.

질문: 파이토치(PyTorch)의 경우, ML 컴파일러의 이름이 있을까요?
답변: PyTorch 2.0에서는 Dynamo과 Inductor가 주요 ML 컴파일러로 작동하며, Triton도 도메인 특화 언어를 통해 컴파일러 기능을 지원함.
-->

---
level: 2
---

# 오늘 다룰 topic들

<div class="grid grid-cols-2 gap-4">
<div>

**ML Framework: background**

- Heterogeneous computing with GPU
  - Graphics: OpenGL (1992), DirectX (1995)
  - GPGPU: HLSL (2002), CUDA (2007), OpenCL (2009), HSA (2011)
- Supercomputing
  - Fast multiplication - BLAS (1979), cuBLAS (2017), cuTLASS (2019)
  - Distributed programming - MPI (1992)
- ML compiler
  - XLA (Google), TensorRT (Nvidia), TVM (OctoAI), Glow (Meta), etc
- Numerical Computing for Data Science
  - Matlab (1970s), R (1993), NumPy (2005)

</div>
<div>

**Design space**

- Two (or three) language problems
- Eager vs. graph mode
  - Define-and-run and define-by-run
- Interpretation vs. {just-in-time, ahead of time} compilation

<div class="mt-4 font-bold text-lg">

**Convergence on Pytorch**

</div>
</div>
</div>

<!--
제가 정리해본 내용은 대략 이 정도인데요, 이 자료들을 한 장씩 넘겨 가면서 제가 생각하는 부분들을 공유해 드리려고 합니다. 우선 제가 전달하고 싶은 핵심 메시지는 "머신러닝 프레임워크란 게 그냥 갑자기 어디선가 뚝 떨어진 것이 아니라, 이전의 훌륭한 연구들과 산업적 성과가 축적되어 만들어진 결과물"이라는 점입니다. 그 역사와 과정을 하나씩 살펴보면, 굉장히 중요한 기술적 흐름들이 있었고, 결국 이런 흐름들이 합쳐져서 우리가 지금 쓰고 있는 머신러닝 프레임워크가 되었죠. 이 주제들을 한 장씩 보면서 같이 이야기 나누면 좋겠습니다.
-->

---
level: 2
---

# Heterogeneous Computing with GPU

CPU와 GPU를 함께 활용, 더 빠르게 계산할 수 있도록 해주는 시스템

- 일반적으로 CPU가 특정 계산을 GPU에게 offloading함으로써 성능 향상

**시작점은 GUI, 컴퓨터 게임 등을 위한 Graphics**

- OpenGL (1992) - 실리콘 그래픽스가 개발한 Graphics API
- DirectX (1995) - Microsoft가 개발한 Graphics API
  - Windows PC의 보급과 함께 실질적인 업계 표준으로 자리잡음
  - Nvidia, ATI (2006년 AMD와 합병)등이 성장하게된 동력

**2000년대 초 shader programming의 등장**

- Graphics 개발자가 high-level programming 언어를 사용, GPU를 programming하기 시작
  - DirectX 8부터 시작. DirectX 9에서 HLSL 정의
- Nvidia의 GeForce 3 (2001) : shader programmable한 최초의 GPU

<!--
Heterogeneous Computing은 CPU와 GPU를 함께 활용하여 더 빠르게 계산할 수 있도록 해주는 시스템입니다. 이 개념은 일반적으로 CPU가 수행하던 계산 중 일부를 GPU에게 offloading하여 성능을 향상시키는 방식입니다.

이 기술은 그래픽스(Graphics)에서 시작되었습니다. 1992년 OpenGL은 실리콘 그래픽스에서 개발한 그래픽스 API로, 프로그래머가 그래픽스 연산을 소프트웨어적으로 프로그래밍할 수 있는 시작점이었습니다. 1995년 DirectX는 Windows PC 환경에서 GPU의 성능 향상과 함께 주요 표준으로 자리 잡았으며, NVIDIA와 ATI의 성장을 촉진시킨 중요한 계기가 되었습니다. 2000년대 초에는 Shader Programming이 등장하여 GPU가 프로그래밍 가능한 디바이스로 진화했습니다. 2001년 NVIDIA GeForce 3가 최초의 shader programmable GPU입니다.
-->

---
level: 2
---

# Heterogeneous Computing: GPGPU의 등장

**2007년 CUDA와 함께 GPGPU의 등장**

- Nvidia가 개발한 GPU를 위한 일반적인 parallel programming model
- 초기에는 High-Performance Computing (HPC) 시장을 타겟으로 함
- Deep learning의 등장과 함께 AI 가속기를 위한 programming model로 진화

**이후 다른 플랫폼들도 등장**

- Apple이 주도한 OpenCL (2008)
- AMD/ARM이 주도한 HSA (2011)
- 그러나 OpenCL과 HSA는 상용화에서 한계를 보였고, **CUDA가 사실상 표준**으로 자리잡음

<!--
2007년 NVIDIA는 CUDA(Compute Unified Device Architecture)를 발표하며 GPGPU(General Purpose GPU)의 시대를 열었습니다. 초기 CUDA는 머신러닝보다는 고성능 컴퓨팅(HPC)을 위한 병렬 프로그래밍 모델로 설계되었습니다. GPU의 성능이 슈퍼컴퓨터 수준에 가까워지면서, 이를 일반 개발자들이 활용할 수 있도록 CUDA를 도입한 것입니다.

이후 Apple의 OpenCL(2008), AMD/ARM의 HSA(2011)도 등장했지만 상용화에서 한계를 보였고, CUDA가 사실상 표준으로 자리 잡았습니다. 오늘날 PyTorch와 같은 머신러닝 프레임워크 내부에서도 CUDA 기반의 API가 광범위하게 사용되고 있으며, 많은 후발 주자들이 이를 기반으로 비슷한 구조를 구축하고 있습니다.
-->

---
level: 2
---

# Supercomputing

엄청나게 복잡한 계산을 처리하기 위한 computing 기술

- 응용분야: scientific research and simulation (physics, astrophysics, climate modeling 등)

**보통 많은 수의 컴퓨터를 네트워크로 연결하고 큰 계산을 나누어 처리**

- 대규모 인터넷 서비스도 계산 총량은 엄청나지만 많은 수의 독립된, 간단한 계산을 처리하는 점이 다름
- "Fault"의 처리가 수퍼컴퓨팅에서 매우 중요 (vs. 대규모 인터넷 서비스)

**다양한 parallel/distributed programming model이 등장**

- 개념적인 모델 - SIMD, SPMD, MIMD
- 구현 표준 - MPI, OpenMP

<!--
슈퍼컴퓨팅이란 엄청나게 복잡한 계산을 처리하기 위한 고성능 컴퓨팅 기술입니다. 슈퍼컴퓨팅은 많은 수의 컴퓨터를 네트워크로 연결해 하나의 큰 계산을 분산 처리하는 방식으로 작동합니다. 인터넷 서비스와의 본질적 차이는 fault 처리의 중요성입니다. 머신러닝의 경우에도 대규모 분산 학습에서는 fault 처리가 중요해집니다. MPI(Message Passing Interface)는 파이토치에서 구현된 분산 프로그래밍 모델의 기반이 되기도 합니다.
-->

---
level: 2
---

# Supercomputing: Matrix Multiplication

**Matrix multiplication이 가장 중요한 요소**

- 과학에서 다루는 많은 자연 현상들이 선형대수로 표현됨
- 선형대수의 가장 중요한 개념들은 결국 matrix multiplication로 귀결됨

**자연스럽게, matrix multiplication을 빠르게 처리할 수 있는 다양한 최적화 기술들이 등장**

- Algorithmic efficiency 측면: Strassen algorithm, DeepMind's AlphaTensor

**큰 matmul에 최적화된 보편적인 library의 등장**

- **BLAS** (Basic Linear Algebra Subprograms, 1979)
  - 다양한 linear algebra 문제에 적용할 수 있는 low-level API
  - Matrix multiplication을 위한 **GEMM** 포함
- 각 HW vendor들은 그들의 HW에 최적화된 BLAS 구현 출시
  - Nvidia: cuBLAS (2017), cuTLASS (2018)

<!--
슈퍼컴퓨팅에서 가장 중요한 요소 중 하나는 매트릭스 곱셈(Matrix Multiplication)입니다. 많은 자연 현상과 과학적 문제들이 선형대수로 표현되며, 선형대수에서 가장 중요한 연산이 바로 매트릭스 곱셈입니다. 매트릭스 곱셈의 연산량은 매트릭스 크기에 따라 큐빅(N^3)에 비례하기 때문에, 이를 얼마나 빠르게 처리할 수 있는지가 전체 시스템의 성능에 큰 영향을 미칩니다.

Strassen 알고리즘은 매트릭스 곱셈의 복잡도를 낮추는 고급 알고리즘이며, 딥마인드의 AlphaTensor는 매트릭스 곱셈 커널을 최적화하여 계산 속도를 크게 향상시켰습니다.

BLAS는 1979년에 처음 발표된 저수준 API로, GEMM(General Matrix Multiply)을 포함합니다. NVIDIA의 cuBLAS는 클로즈드 소스로 제공되지만, cuTLASS는 오픈소스 라이브러리로 누구나 접근 가능합니다.
-->

---
level: 2
---

# ML Compiler

정적인 graph로 전환된 ML model을 특정 hardware에 맞게 최적화해주는 컴파일러

<v-clicks>

- ML framework으로 개발자들이 표현한 model은 대부분 "동적"
- ML compiler를 적용하기 위해선
  - 동적으로 표현된 model을 특정한 "정적" model로 고정하고
  - 이를 ML compiler가 이해할 수 있는 format으로 전환
  - 최종적으로 HW가 실행할 수 있는 binary를 생성

</v-clicks>

<v-click>

**서버에서 GPU로 훈련된 모델을 On-Device AI 가속기에서 수행하기 위해 많이 쓰임**

- Qualcomm Snapdragon / Samsung Exynos / Google Tensor

**서버에서도 점점 활성화되고 있는 추세**

- Google TPU + {TensorFlow, JAX} + XLA
- Nvidia GPU + {TensorFlow, Pytorch} + TensorRT
- Rebellions NPU + {TensorFlow, Pytorch} + RBLN Compiler
- **Pytorch 2.0의 등장으로 더욱 가속화될 것**

</v-click>

<!--
ML 컴파일러란 정적 그래프 형태로 변환된 ML 모델을 특정 하드웨어에 최적화된 형태로 변환해주는 역할을 합니다. PyTorch와 같은 동적 프레임워크에서는 모델의 표현 방식이 동적이라 이를 정적 모델로 변환하고 최적화된 바이너리를 생성해야 합니다. PyTorch 1.x에서는 JIT Trace가 있었지만 제한적이었고, PyTorch 2.0에서 ML 컴파일러 기능이 대폭 강화되었습니다.
-->

---
level: 2
---

# Numerical Computing for Data Science

**Data science**

- 통계, 컴퓨터 과학, 수학 등의 도구를 활용, 데이터를 분석하여 대상을 이해하는 융합 학문
- 많은 과학자 / 엔지니어들이 업무의 일부로 자연스럽게 data scientist 역할을 수행

**Data scientist들은 손쉽게 접근할 수 있는 도구를 선호**

- Predefined math functions
- Interactive mode
- Visualization

**Numpy의 등장과 함께 Python이 대세로 자리잡음**

- SAS (1966), SPSS (1968), Matlab (1970s), R (1993) 등이 선구적인 역할
- Numpy (2005)의 등장과 함께 Python이 대세가 됨
  - SciPy, Matplotlib, pandas, scikit, ...
- Jupyter의 등장으로 더욱더 많은 사람들이 쉽게 접근할 수 있게 됨
- **ML도 사용성 측면에서 같은 추세**

<!--
데이터 사이언스를 정의하면: 통계, 컴퓨터 과학, 수학 등 정량적인 도구들을 활용해 대량의 데이터를 분석하고 이해하는 융합 학문입니다. 데이터 사이언티스트들은 이미 존재하는 데이터를 손쉽게 가공하고 필요한 정보를 얻어내는 데 더 관심을 둡니다. SAS, SPSS, Matlab, R 등이 선구적인 역할을 했고, NumPy(2005)의 등장과 함께 Python이 대세가 되었습니다. Jupyter의 등장으로 더욱 많은 사람들이 쉽게 접근할 수 있게 되었고, ML도 같은 추세를 따르고 있습니다.
-->

---
level: 2
---

# Two (or More) Language Problems

<div class="grid grid-cols-[1fr_3fr] gap-6 mt-4">

<div class="flex items-center justify-center">
  <div class="text-center p-4 bg-red-500/20 rounded-lg border border-red-400">
    <span class="text-lg font-bold">Python의<br/>성능 문제</span>
  </div>
</div>

<div>

<v-clicks>

<div class="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-400/30">
  <span class="font-bold text-blue-300">해결책 #1</span> — 고성능 Python compiler를 개발
  <div class="text-sm ml-4 mt-1 opacity-80">Cython 성능이 점점 좋아지고 있음 / PyPy같은 대안 프로젝트도 존재</div>
</div>

<div class="mb-4 p-3 bg-green-500/10 rounded-lg border border-green-400/30">
  <span class="font-bold text-green-300">해결책 #2</span> — Python 언어를 증강
  <div class="text-sm ml-4 mt-1 opacity-80">Modular의 Mojo 프로젝트</div>
</div>

<div class="mb-4 p-3 bg-orange-500/10 rounded-lg border border-orange-400/30">
  <span class="font-bold text-orange-300">해결책 #3</span> — 다른 언어로 작성된 모듈과 binding
  <div class="text-sm ml-4 mt-1 opacity-80">pybind11: Python + C++11 → Numpy, Pytorch</div>
  <div class="text-sm ml-4 mt-1 opacity-80">+ 추가로 가속기로 offloading</div>
</div>

</v-clicks>

</div>
</div>

---
level: 2
---

# Eager vs. Graph Mode

<div class="grid grid-cols-2 gap-8">
<div>

### Eager mode

- API 호출 → operator가 **곧바로 실행**됨

### Graph mode

- API 호출 → graph를 **점진적으로 생성**
- Graph가 완성되면 목적에 맞게 변환 적용 후 수행
  - Back propagation을 위한 backward graph 생성
  - 성능 향상을 위한 최적화 수행 (예: op fusion)

</div>
<div>

### Graph mode를 접근하는 방법

**TF1의 접근법 (define-and-run)**
- 개발자에게 명시적으로 graph를 생성

**Pytorch, TF2, JAX의 접근법 (define-by-run)**
- 개발자는 eager mode를 가정하고 model 작성
- 개발자가 작성한 eager mode기반 model으로부터 graph를 추출

</div>
</div>

<div class="mt-4 grid grid-cols-2 gap-4 text-center text-sm">
  <div class="p-2 bg-yellow-500/10 rounded border border-yellow-400/30">TF2, Pytorch → Eager, Graph 모두 가능</div>
  <div class="p-2 bg-blue-500/10 rounded border border-blue-400/30">JAX → Graph만 가능</div>
</div>

<!--
Graph mode는 API가 호출될 때 실질적으로 그래프가 점진적으로 생성되는 과정입니다. Eager mode와 graph mode를 구분할 수 있지만, backward propagation을 실행하기 위해 forward graph를 eager mode로 돌리게 되면 두 가지를 동시에 하고 있다고 볼 수 있습니다. Forward 단계에서는 eager mode로 계산이 진행되지만, Backward 단계에서는 graph mode가 적용됩니다.
-->

---
level: 2
---

# TF1 vs. Pytorch Examples

<div class="grid grid-cols-2 gap-8">
<div>

### TF1

```python
a = tf.constant([[3, 3]])
b = tf.constant([[2, 2]])
c = tf.matmul(a, b)

with tf.Session() as s:
    print(c.eval())
```

<div class="mt-4 text-sm p-2 bg-yellow-500/10 rounded border border-yellow-400/30">
"c"는 matmul의 결과를 의미하지만 실제 결과값을 알기위해선 "eval"을 호출하여 그래프를 실행해야함
</div>

</div>
<div>

### Pytorch

```python
x1 = torch.rand(2, 3)
x2 = torch.rand(2, 3)
y = x1 + x2
print(y)
```

<div class="mt-4 text-sm p-2 bg-green-500/10 rounded border border-green-400/30">
"y"는 "+"가 실행된 결과를 가지고 있음. Pytorch eager mode에서는 별도의 그래프 실행 과정이 필요 없음
</div>

</div>
</div>

<!--
TensorFlow 1.x 버전에서는 TF Constant와 TF Matmul과 같은 연산자를 사용하여 계산 그래프를 구성합니다. 이러한 연산자들은 실제 계산을 수행하지 않고, 계산 과정을 그래프로 만드는 역할을 합니다. 계산 그래프는 TF Session을 생성한 뒤에 실행(evaluate)할 수 있으며, 그래프를 실행하면 비로소 실제 계산 결과를 얻을 수 있습니다.

PyTorch에서는 eager mode라고 불리는 방식을 사용합니다. 이 모드에서는 각 줄의 연산을 즉시 수행하며, 결과를 바로 확인할 수 있습니다.
-->

---
level: 2
---

# Graph Capture: TF2 | Pytorch 2

<div class="grid grid-cols-2 gap-8">
<div>

### TF2

```python
g = tf.Graph()
with g.as_default():
    c = tf.constant(3)
    assert c.graph is g
```

</div>
<div>

### Pytorch 1 & 2

```python
def Foo(x, y):
    a = torch.sin(x)
    b = torch.cos(y)
    return a + b

foo = Foo
x = torch.rand(3, 4)
y = torch.rand(3, 4)

# Pytorch 1
traced_foo = torch.jit.trace(foo, (x, y))
traced_foo(x, y)

# Pytorch 2
optimized_foo = torch.compile(foo)
optimized_foo(x, y)
```

</div>
</div>

<!--
그래프 캡쳐에 대해 설명드리겠습니다. TF1의 경우에는 프로그래머들에게 명시적으로 그래프를 그려달라고 요청했습니다. 반면에 TF2나 PyTorch 2에서는 eager 모드로 모델을 만들어주면 거기서 자체적으로 그래프를 뽑아내는 방식을 사용하고 있죠. TF2는 TF1의 흔적이 아직 남아있어서 어정쩡한 느낌이 있습니다. PyTorch 1과 2는 모두 100% eager 모드를 지원하는데, PyTorch 1에서는 jit.trace를 이용하고 PyTorch 2에서는 torch.compile을 이용합니다.
-->

---
level: 2
---

# This is not new

<div class="grid grid-cols-2 gap-8 mt-4">
<div>

Eager mode에서 graph를 추출하는 기법의 역사적 배경:

<v-clicks>

- **Trace scheduling** for VLIW compiler (1981)
- **Out-Of-Order Execution** in Pentium Pro (1995)
- **Trace cache** (1996)
- **Chrome V8 Engine** (2008)

</v-clicks>

</div>
<div>

<img src="/images/01/slide16_1.png" class="rounded shadow-lg" alt="Trace Scheduling paper by Joseph A. Fisher, 1981" />

<div class="text-xs mt-2 opacity-60">
Fisher, J.A. "Trace Scheduling: A Technique for Global Microcode Compaction" IEEE Trans. on Computers, 1981
</div>

</div>
</div>

<!--
PGO(프로파일 가이드 최적화): 프로그램의 동적인 특성을 컴파일 타임에 활용해 최적화를 수행하는 개념. 트레이스 스케줄링은 PGO에서 사용하는 특정 기법 중 하나로, 동적인 실행 경로(Trace)를 추출하여 성능을 최적화합니다. 브랜치 예측을 통해 자주 실행되는 경로를 추적하고, 이 경로에 최적화된 스케줄링을 수행합니다.
-->

---
level: 2
---

# Convergence on Pytorch

<div class="flex justify-center mt-4">
  <img src="/images/01/slide17_1.png" class="h-96 rounded shadow-lg" alt="vLLM tweet - PyTorch as a Narrow Waist for hardware abstractions" />
</div>

<!--
머신러닝 프레임워크에 방대한 양의 백그라운드가 있긴 하지만, 그런 것들이 시간이 흘러감에 따라 점점 더 잘 정리되어 사람들이 "이런 문제는 이렇게 풀면 좋겠다"라고 하는 것이 5년, 10년 전보다는 지금 훨씬 더 잘 정립되어 있는 것 같습니다. 그리고 그런 것들이 잘 통합되어 있는 형태가 파이토치입니다. 지금은 거의 파이토치로 표준화되고 있는 게 아닌가라는 생각이 듭니다. VLM이 업스트림에서 하드웨어를 지원하기 위해서는 PyTorch를 narrow waist로 활용하는 것이 핵심입니다.
-->

---
level: 2
---

# Pytorch 2.0

<v-clicks>

- **NumPy-like experience**
- **Heterogeneous computing** as an underneath foundation
- **MPI-like** distributed programming model
- Integration with **compute libraries / ML compiler**
- Three language layers: **Python → C++ → kernel language** (ex: CUDA, Triton)
- **Define-by-run** /w graph capturing with TorchDynamo
- Support both **training and inference**

</v-clicks>

<!--
PyTorch 2.0의 특징은 PyTorch 1.0의 성질을 거의 모두 inherit했으며, 개발자들이 NumPy를 사용하는 것과 비슷한 경험을 할 수 있도록 설계되었습니다. Heterogeneous Computing이 기본적인 기반으로 자리 잡고 있고, Distributed Programming Model을 제공합니다. Python → C++ → kernel language의 세 가지 언어 레이어로 구성되어 있으며, TorchDynamo를 통한 graph capturing, training과 inference 모두 지원합니다.
-->

---
level: 2
---

# Pytorch 2.0: Backend Integration Points

**Various backend integration points**

| Mode | Integration |
|------|-------------|
| Eager mode | As a new dispatch target |
| Graph mode (JIT & AOT) | As a backend to TorchDynamo |
| Graph mode (codegen) | As a backend to Inductor |

<!--
Backend integration points로는 Eager mode에서는 새로운 dispatch target으로, Graph mode에서는 TorchDynamo와 Inductor의 backend로 통합할 수 있습니다.
-->

---
level: 2
---

# 향후 강의 계획

<div class="grid grid-cols-2 gap-8">
<div>

### Pytorch internal: 기초 (3회)

1. Pytorch internal에 대한 개요
2. Pytorch eager mode
3. Pytorch graph mode
4. Putting things together: training, finetuning, inference

</div>
<div>

### Pytorch internal: 심화 (8회)

1. Pytorch + Nvidia GPU
2. Pytorch + parallelism
3. Pytorch + LLM + inference
4. Pytorch + 리벨리온 NPU

</div>
</div>

<!--
앞으로의 강의 구성은 크게 파이토치 인터널의 '기초'와 '심화' 두 파트로 나누어 진행합니다. 기초 파트에서는 전체 인터널 개요, eager 모드, 그래프 모드, 그리고 이러한 내용들이 실제 트레이닝, 파인튜닝, 인퍼런스에서 어떻게 활용되는지 다룹니다. 심화 파트는 GPU와 파이토치의 연동, 분산 프로그래밍, LLM 인퍼런스, 그리고 NPU와의 연동에 대해 다룹니다.
-->

---
level: 2
layout: center
class: text-center
---

# 감사합니다
