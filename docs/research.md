# Research

- existing products
- nature of "ai workloads"
- existing solutions
- availability of data (carbon, and predictions)


### 1.1 Hardware Specification References
This research provides a technical breakdown of the hardware constants and energy-to-computation formulas used in the `hardwareConversion` module. The module facilitates energy-aware scheduling by converting physical power metrics into computational work units (FLOPS).

```cpp
--8<-- "PseudoCode/hardwareConversion.pseudo"
```

The scheduler utilizes specifications for two primary NVIDIA data center GPUs. The values in our `HW_LIB` are derived from official NVIDIA technical briefs.

#### **NVIDIA Tesla V100 (PCIe)**
*   **TDP (250W):** The Thermal Design Power represents the maximum power the GPU is expected to consume under heavy workloads.
*   **Performance (15.7 TFLOPS FP32):** Standard single-precision performance.
*   **Reference:** [NVIDIA V100 Datasheet](https://images.nvidia.com/content/technologies/volta/pdf/volta-v100-datasheet-update-us-1165301-r5.pdf)

#### **NVIDIA A100 (SXM4)**
*   **TDP (400W):** The SXM4 form factor allows for higher power delivery and thermal headroom compared to PCIe.
*   **Performance (19.5 TFLOPS FP32):** Non-tensor core peak performance for standard FP32 operations.
*   **Reference:** [NVIDIA A100 Datasheet](https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/a100/pdf/nvidia-a100-datasheet-us-nvidia-1758950-r4-web.pdf)

---

### 1.2 Explanation of Hardware Constants

| Constant | Value (Code) | Technical Justification |
| :--- | :--- | :--- |
| `FAN_SURGE_COEFF` | 2.5 | During the BIOS/POST phase, server fans typically spin up to 100% duty cycle to test hardware, consuming significantly more power than during steady-state operation. |
| `CONTAINER_LOAD_W` | 100W | Estimated overhead for the Host CPU, RAM, and NVMe drives when initializing a Docker/Apptainer container environment. |
| `TRANSFER_EFFICIENCY` | 0.45 | Data movement (loading models from disk to VRAM) is less power-intensive than active floating-point computation. We estimate power draw at 45% of peak TDP during I/O phases. |
| `effectiveness` | 0.95 | Real-world software overhead. Even highly optimized CUDA kernels rarely hit 100% of theoretical peak TFLOPS; 95% represents an "idealized" high-utilization scenario. |
| `sys_base` | 150-230W | Represents the "idling" power of the dual-socket server motherboard, fans, and idling CPUs that house the GPUs. |

---

### 1.3 Workload Scaling & Model Sizes

The `model_size` (GB) and `length` (minutes) parameters allow the scheduler to estimate the energy cost of specific AI workloads.

*   **Average Model Sizes:**
    *   **ResNet-50 / Computer Vision:** ~0.1 - 0.5 GB (Low transfer overhead).
    *   **BERT-Base / Medium NLP:** ~0.4 - 1.0 GB.
    *   **Llama-3-8B (Quantized):** ~5.0 - 8.0 GB.
    *   **Large Language Models (LLMs):** 40GB+ (Significant `e_load` energy required).

*   **Computational Translation:**
    The function `calculate_flo_per_kwh` translates physical energy into "Computational Currency":
    $$\text{FLO per kWh} = \text{Effectiveness} \times \frac{\text{TFLOPS} \times 10^{12} \times 3600}{\text{TDP} / 1000}$$
    This allows the scheduler to compare the "Green Efficiency" of different hardware generations.

---

### 1.4 Energy Calculation Methodology

The scheduler breaks down a job into three distinct energy phases:

#### **A. Startup Phase (`get_startup_energy_kwh`)**
Divided into the **BIOS Phase** (high fan usage) and **OS Phase** (base system + container initialization). This is a fixed cost regardless of the task length.
*   *V100 Estimate:* ~0.02 - 0.04 kWh per boot.

#### **B. Model Loading Phase (`get_load_energy_kwh`)**
Calculates the energy used while the `bus_gbps` (PCIe Gen3 vs NVLink) transfers the model into VRAM. 
*   **Formula:** $\text{Power}_{\text{load}} \times (\text{Model Size} / \text{Bus Speed})$.

#### **C. Execution Phase (`get_workload_amount`)**
The active computation phase. The total "work" is defined as the total FLOPS capable of being produced during the requested `length` at full power.

### 1.5 Summary of Calculated Outputs

When `convertRawJobRequest` is called, it returns:
1.  **Startup Overhead:** The energy "tax" of booting and loading the model, expressed in FLOPS.
2.  **Workload Amount:** The total computational "budget" of the job.
3.  **kWh per FLO:** The inverse efficiency, used to calculate the final carbon footprint or electricity cost of the specific hardware-workload pairing.