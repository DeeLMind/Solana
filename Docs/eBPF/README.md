# Solana 相关虚拟机教学文档

这份文档放在 `eBPF` 目录下，目标不是只讲 Linux 的 eBPF，而是把 **Solana 生态里和“程序执行”相关的 VM / 运行时 / 加载器** 一次梳理清楚。

很多资料会把这些概念混着说：

- `eBPF`
- `sBPF`
- `rBPF` / `solana_rbpf` / `solana-sbpf`
- `SVM`
- `Sealevel`
- `BPF Loader / Loader v3 / Loader v4`

它们彼此有关，但不是同一个层次。

## 一张图先看懂

```text
Rust / Anchor 源码
        |
        v
LLVM 编译
        |
        v
sBPF ELF 字节码
        |
        v
Loader 把程序部署到链上
        |
        v
SVM 负责账户模型、syscall、CU 计量、CPI、执行上下文
        |
        v
sBPF VM（历史上常见说法是 rBPF VM）
        |
        v
Sealevel 在交易层做并行调度
```

一句话总结：

- `eBPF` 是祖先。
- `sBPF` 是 Solana 自己定制过的 BPF 字节码格式。
- `rBPF` / `solana-sbpf` 是执行这类字节码的 VM 实现。
- `SVM` 是更高一层的 Solana 执行环境。
- `Sealevel` 是并行交易运行时，不等于字节码 VM。
- `Loader` 负责部署、升级、关闭程序，不负责解释业务逻辑。

## 1. eBPF

`eBPF` 本来不是 Solana 发明的，它来自 Berkeley Packet Filter 演化出来的执行模型，最早主要用于操作系统和网络过滤场景。

对 Solana 来说，`eBPF` 的意义主要是：

- 它提供了一套成熟、紧凑、易沙箱化的指令模型。
- Solana 没有直接照搬 Linux eBPF，而是在它基础上做了自己的变体。

所以在 Solana 语境里，`eBPF` 更像是“血缘来源”，不是你最终在链上跑的精确格式。

## 2. sBPF

`sBPF` 可以理解为 **Solana Bytecode Format**，也常被描述为 Solana 定制版的 eBPF。

它是 Solana 链上程序真正面向的字节码格式，特点是：

- 由 LLVM 工具链编译出来。
- 以 ELF 形式存储和部署。
- 带有 Solana 特有的限制、syscall 约定和执行语义。
- 不是标准 Linux eBPF，不能简单把两者当成完全兼容。

如果你写的是 Rust 或 Anchor 程序，最后部署到链上的 `.so`，本质上就是装着 `sBPF` 的 ELF。

## 3. rBPF / solana_rbpf / solana-sbpf

这是最容易混淆的一层。

很多人会说“Solana VM 是 rBPF”，这种说法只说对了一部分。

更准确地说：

- `rBPF` 最初是一个用户态 eBPF VM 项目。
- Solana 很早以前基于它做过自己的执行器实现，因此社区里常见 `solana_rbpf` 这个名字。
- 现在 Anza 维护的仓库名已经更明确，叫 `solana-sbpf`，表示它执行的是 Solana 版本的 BPF。

这一层真正做的事是：

- 解释或 JIT 执行 `sBPF` 指令。
- 管理寄存器、栈、内存映射。
- 做 verifier / 指令约束检查。

所以如果你问“**哪个 VM 真正在执行 Solana 程序字节码**”，答案最接近：

- `rBPF VM`（历史叫法）
- `solana-sbpf VM`（现在更准确的叫法）

## 4. SVM

`SVM` 是 **Solana Virtual Machine**。

它不是单纯的字节码解释器，而是更完整的链上执行环境。你可以把它理解成：

- 外层是 `SVM`
- 里面用 `sBPF VM` 去跑程序字节码

`SVM` 负责的东西包括：

- 账户读写与权限检查
- rent / executable / owner 等账户语义
- compute units 计量
- syscall 暴露
- CPI（Cross Program Invocation）
- 程序缓存
- 指令执行上下文

所以开发者说“程序跑在 SVM 上”是对的；
但如果继续追问“字节码是谁一条条执行的”，答案还是 `sBPF VM`。

## 5. Sealevel

`Sealevel` 是 Solana 的并行运行时。

它和 VM 的关系是：

- `Sealevel` 负责在交易层做并行调度。
- 它根据交易声明的账户读写集合，尽量并行执行互不冲突的交易。
- 真正执行程序指令时，底层仍然会落到 `SVM + sBPF VM` 这一套。

所以：

- `Sealevel` 更像“并行执行引擎 / runtime”
- 不是“字节码虚拟机”

这是审计和面试里非常常见的混淆点。

## 6. Loader v1 / v2 / v3 / v4

这些通常也会被叫成 “BPF Loader”，但它们 **不是 VM**。

它们的职责是管理程序生命周期，例如：

- 部署程序
- 重部署程序
- 升级程序
- 关闭程序
- 管理 authority

常见版本：

- `BPFLoader1111111111111111111111111111111111`
- `BPFLoader2111111111111111111111111111111111`
- `BPFLoaderUpgradeab1e11111111111111111111111`（v3）
- `LoaderV411111111111111111111111111111111111`（v4）

理解要点：

- Loader 决定程序怎么被装载、升级、管理。
- VM 决定程序字节码怎么被执行。
- 这两个层次不能混为一谈。

## 7. 到底有哪些“和 Solana 相关的虚拟机”

如果按“主线开发和审计最该知道”的口径，可以分成下面几类。

### A. 核心主线

1. `sBPF VM`
   - Solana 程序字节码的直接执行器。
   - 历史上常被称为 `rBPF VM`。

2. `SVM`
   - Solana 的完整执行环境。
   - 内含账户模型、syscall、CU、CPI 等运行时规则。

3. `Sealevel`
   - 严格说不是 VM。
   - 但它是 Solana 程序真正跑起来时不可分割的并行执行层。

### B. 血缘与基础

4. `eBPF`
   - Solana VM 设计的来源之一。
   - 不是 Solana 当前链上程序的最终原生执行格式。

### C. 容易被误当成 VM 的配套组件

5. `Loader v1/v2/v3/v4`
   - 不是 VM。
   - 是程序加载器和生命周期管理器。

## 8. 开发者最实用的记忆法

记下面四句基本就不会乱：

1. 代码最终被编译成 `sBPF`。
2. `sBPF` 由 `rBPF / solana-sbpf` 这类 VM 执行。
3. 程序整体运行在 `SVM` 提供的执行环境里。
4. 交易并行是 `Sealevel` 负责，不是 Loader，也不是单纯的字节码 VM。

## 9. 审计时为什么必须分清这些层次

因为不同层次对应不同风险面：

- `sBPF VM`
  - 指令语义、栈限制、内存映射、verifier、JIT/解释器行为。
- `SVM`
  - 账户权限、owner、signer、CPI、syscall、compute budget。
- `Sealevel`
  - 并行执行、账户锁、交易级别竞争与状态冲突。
- `Loader`
  - 升级权限、程序可变性、authority 移交、部署状态。

如果把它们全部统称成“Solana VM”，分析时很容易漏掉真正的问题边界。

## 10. 一个常见误区

误区：

- “Solana 就是 eBPF VM。”

更准确的说法：

- Solana 使用了 **定制化的 sBPF 字节码**。
- 字节码由 **sBPF VM / rBPF 系实现** 执行。
- 程序运行在 **SVM** 之中。
- 交易并行由 **Sealevel** 调度。

## 11. 推荐延伸阅读

- Solana Program Execution
  - https://solana.com/docs/core/programs/program-execution
- Solana Programs / Loader Programs
  - https://solana.com/docs/core/programs
- Solana Deploying Programs
  - https://solana.com/zh/docs/programs/deploying
- Anza `solana-sbpf`
  - https://github.com/anza-xyz/sbpf
- SPL docs 对 Sealevel 的描述
  - https://spl.solana.com/

## 12. 最后一句话

如果你只想记住一个最简答案：

- **Solana 主线执行 VM 是 `sBPF VM`（历史上常叫 `rBPF`），而它所在的完整执行环境叫 `SVM`，并行运行时叫 `Sealevel`。**
