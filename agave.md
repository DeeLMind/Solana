# Agave

## agave-install

作用：

* 安装 Agave 工具链
* 切换不同版本的 Agave
* 管理本机当前使用的 validator / CLI 版本

适用场景：

* 想安装指定版本的 Solana/Agave
* 本地开发环境需要和某个集群版本保持一致
* 排查版本不兼容问题

可理解为：

* 类似 Rust 里的 `rustup`
* 或 Node 里的版本管理器

常见思路：

* 安装某个版本
* 查看当前版本
* 切换到另一个版本

## agave-install-init

作用：

* 初始化 Agave 安装环境
* 首次把 Agave 工具链准备到本地
* 配置默认可执行文件位置

适用场景：

* 第一次安装 Agave
* 本机还没有完整的 Agave 运行环境
* 需要重建本地 Agave 工具链

可理解为：

* 给 `agave-install` 做初始化准备
* 先把安装器和本地目录结构准备好

## agave-ledger-tool

作用：

* 检查本地 ledger
* 分析区块、slot、账户和历史数据
* 排查 validator 启动或同步问题
* 在某些情况下修复或导出 ledger 信息

适用场景：

* `validator` 起不来
* 本地测试链或节点 ledger 损坏
* 想看某个 slot / block 是否存在
* 想分析本地账本数据

常见用途：

* 查看 ledger 基本状态
* 检查某个 slot
* 输出区块或账户相关信息
* 排查本地节点卡住、崩溃、回滚等问题

---

## agave-ledger-tool 教学：`test-ledger`

### 1. 先认识你的 `test-ledger`

你当前这个目录已经是一个完整的本地 ledger：

* `test-ledger/genesis.bin`
* `test-ledger/rocksdb/`
* `test-ledger/snapshots/`
* `test-ledger/snapshot-200-...tar.zst`
* `test-ledger/snapshot-300-...tar.zst`
* `test-ledger/validator.log`

这说明：

* 本地 validator 跑过
* 账本数据已经落盘
* 还有 snapshot 可供恢复

### 2. `agave-ledger-tool` 的核心用法

它最常见的形式就是：

```bash
agave-ledger-tool -l test-ledger <subcommand>
```

这里：

* `-l test-ledger` 指定 ledger 目录
* `<subcommand>` 是具体操作，比如看 slot、看 block、校验 ledger

### 3. 第一件事：先看帮助

不同版本的 Agave，子命令会有差异，所以先看帮助最稳：

```bash
agave-ledger-tool --help
agave-ledger-tool -l test-ledger --help
```

再继续看某个子命令的帮助：

```bash
agave-ledger-tool -l test-ledger <subcommand> --help
```

### 4. 你最应该练的几个方向

#### 看 ledger 基本状态

目的：

* 确认 ledger 是否完整
* 看 slot 范围
* 看是否有 snapshot

先从帮助里找这些关键词相关的子命令：

* `bounds`
* `slot`
* `genesis`
* `verify`
* `print`

#### 看某个 slot / block

目的：

* 某个 slot 是否存在
* 这个 block 里有哪些交易
* 是否有你关心的程序调用

用法还是同样的套路：

```bash
agave-ledger-tool -l test-ledger <查看slot或block的子命令> --help
```

#### 校验 ledger

目的：

* 判断 rocksdb / snapshot / blockstore 是否有问题
* 排查 validator 启动失败

同样先从帮助中找 `verify` 一类命令。

### 5. 结合你这个目录怎么排查

如果你的本地链起不来，优先看这几个东西：

#### `validator.log`

```bash
tail -n 100 test-ledger/validator.log
```

这里通常能直接看到：

* snapshot 恢复失败
* rocksdb 损坏
* 端口冲突
* genesis 或 tower 问题

#### `snapshots/` 和 `snapshot-*.tar.zst`

你这里已经有：

* `snapshots/300`
* `snapshot-200-...`
* `snapshot-300-...`

说明这个 ledger 至少已经推进到过 `slot 300` 附近。

#### `rocksdb/`

这是主要账本数据目录。  
如果这里损坏，validator 和 ledger-tool 往往都会报错。

### 6. 一个很实用的学习顺序

建议你按这个顺序上手：

1. 看帮助

```bash
agave-ledger-tool --help
```

2. 指向你的本地 ledger

```bash
agave-ledger-tool -l test-ledger --help
```

3. 找和这几个词相关的子命令

* `bounds`
* `genesis`
* `slot`
* `verify`
* `print`

4. 再看具体帮助

```bash
agave-ledger-tool -l test-ledger <subcommand> --help
```

### 7. 你要先记住的点

* `genesis.bin` 是创世配置
* `rocksdb/` 是主要账本数据
* `snapshots/` 是快照恢复数据
* `validator.log` 是最直接的排错入口
* `agave-ledger-tool` 分析的是 ledger 目录，不是钱包地址

### 8. 当前环境说明

我刚检查过，这台环境里现在没有这个命令：

```bash
agave-ledger-tool not found
```

所以我没法直接替你跑示例输出。  
但等你本机装好后，第一条最值得跑的是：

```bash
agave-ledger-tool -l test-ledger --help
```
