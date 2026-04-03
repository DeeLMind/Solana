# Solana Vulnerability Examples

这个目录根据 Solana Foundation 的 `security.md` 整理，目标不是做成“清单摘抄”，而是把每一类漏洞都写成可教学、可对照、可继续扩展的示例材料。

参考来源：

- `solana-dev-skill/skill/references/security.md`
- GitHub: https://github.com/solana-foundation/solana-dev-skill/blob/main/skill/references/security.md

整理日期：

- 2026-03-28

## 目录结构

- [01-core-validation.md](./01-core-validation.md)
  - Missing Owner Checks
  - Missing Signer Checks
  - Arbitrary CPI Attacks
  - Reinitialization Attacks
- [02-account-relationships.md](./02-account-relationships.md)
  - PDA Sharing Vulnerabilities
  - Type Cosplay Attacks
  - Duplicate Mutable Accounts
  - Revival Attacks
  - Data Matching Vulnerabilities
- [03-pinocchio-hardening.md](./03-pinocchio-hardening.md)
  - Sysvar Spoofing
  - Bump Canonicalization
  - Lamport Griefing
  - Missing Writable / Read-Only Enforcement
- [04-token-2022-risks.md](./04-token-2022-risks.md)
  - Transfer Fee Accounting
  - `calculate_fee` vs `calculate_inverse_fee`
  - Permanent Delegate Authority

## 阅读方式

建议按下面顺序看：

1. 先看 `01-core-validation.md`
2. 再看 `02-account-relationships.md`
3. 如果你在做 Pinocchio / Native 程序，再看 `03-pinocchio-hardening.md`
4. 如果你接受 Token-2022 资产，再重点看 `04-token-2022-risks.md`

## 每节统一结构

每种漏洞都按统一结构展开：

- 漏洞成因
- 攻击路径
- 修补方案
- Anchor 示例
- Pinocchio 示例
- Native Solana 示例

## 说明

- 这里的代码以“教学可读性”为优先，不保证可直接编译。
- 示例重点在于突出安全边界，而不是构建完整业务程序。
- 如果你愿意继续扩展，这个目录很适合再加 `tests/` 或 `exploit-scenarios/`。
