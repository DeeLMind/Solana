# Surfpool 详细教程

## 1. Surfpool 是什么

Surfpool 是一个面向 Solana 开发者的本地开发工具，可以把它理解成 `solana-test-validator` 的增强版。

它的核心价值有四个：

* 可以作为 `solana-test-validator` 的替代品来启动本地链
* 可以更方便地结合 Anchor 项目进行本地开发和测试
* 支持拉取真实主网状态做本地模拟，而不是只跑一条“纯空白链”
* 除了链本身，还在往基础设施即代码（Infrastructure as Code, IaC）方向扩展

如果你以前的工作流是：

* 写合约
* `anchor build`
* `solana-test-validator`
* `anchor test`

那么 Surfpool 的定位就是：尽量少改你的习惯，但给你更真实、更快、更容易复现的本地环境。

## 2. Surfpool 适合什么场景

Surfpool 尤其适合下面这些情况：

* 你想在本地复现更接近主网或 devnet 的账户状态
* 你在写 Anchor 程序，希望本地测试更稳定
* 你不想手动维护很多本地测试账户、代币账户、程序部署步骤
* 你要排查某个链上状态相关的问题，希望能够“先复制状态，再本地复现”

简单说：

* `solana-test-validator` 更像一个基础本地链
* `Surfpool` 更像一个更工程化、更贴近真实环境的本地 Solana 开发平台

## 3. 安装 Surfpool

### 3.1 官方安装方式

官方 README 给出的安装命令是：

```bash
curl -sL https://run.surfpool.run/ | bash
```

安装完成后验证：

```bash
surfpool --version
```

如果你看到版本号，说明安装成功。

### 3.2 源码安装

如果你希望自己编译：

```bash
git clone https://github.com/solana-foundation/surfpool.git
cd surfpool
cargo surfpool-install
```

### 3.3 Docker 方式

官方 README 也给了 Docker 方式：

```bash
docker run surfpool/surfpool --version
```

## 4. 使用前准备

在使用 Surfpool 之前，建议先准备好这几个基础工具：

* `solana`
* `rust`
* `anchor`
* `avm`

常见检查命令：

```bash
solana --version
anchor --version
rustc --version
```

再检查 Solana CLI 当前配置：

```bash
solana config get
```

通常你会看到：

* RPC URL
* WebSocket URL
* Keypair 路径

如果你是做本地测试，后面通常要把 RPC 切到本地地址，例如：

```bash
solana config set --url http://127.0.0.1:8899
```

## 5. Surfpool 最基础的启动方式

最常见的命令就是：

```bash
surfpool start
```

这条命令的作用可以先理解为：

* 启动一个本地 Solana 开发网络
* 如果当前目录能识别出是项目目录，它会尝试结合项目上下文工作

你还可以查看帮助：

```bash
surfpool start --help
```

这是第一步一定要会的命令，因为不同版本参数可能会有差异，帮助信息最权威。

## 6. Surfpool 和 solana-test-validator 的关系

Surfpool 官方 README 直接把它描述为 `solana-test-validator` 的 drop-in replacement。

这个说法的意思不是“所有细节都完全一样”，而是：

* 你的很多 CLI、Anchor、测试脚本思路可以继续沿用
* 你不需要推翻整套开发流程
* 可以把 Surfpool 理解成更高级的本地验证器

所以迁移时可以用这种思路：

之前：

```bash
solana-test-validator
```

现在：

```bash
surfpool start
```

然后继续用：

```bash
solana address
solana balance
anchor build
anchor test
```

## 7. 在 Anchor 项目里怎么用

这部分最重要，因为你仓库里已经有一个 Anchor 项目：

[Anchor.toml](/Users/deelmind/Documents/Solana/Program/Anchor/helloworld/Anchor.toml)

当前这个配置里：

* `provider.cluster = "devnet"`
* 钱包路径是 `~/.config/solana/id.json`

也就是说，你现在这个项目默认是偏向 devnet 的，不是本地链。

### 7.1 先进入项目目录

```bash
cd /Users/deelmind/Documents/Solana/Program/Anchor/helloworld
```

### 7.2 构建程序

```bash
anchor build
```

### 7.3 启动 Surfpool

```bash
surfpool start
```

官方 README 提到：如果当前目录是 Anchor 项目，Surfpool 会尝试：

* 自动生成基础设施配置
* 部署你的 Solana 程序到本地网络
* 提供更结构化的本地开发环境

你可以把它理解成：Surfpool 比传统本地验证器更“懂 Anchor 项目”。

### 7.4 把客户端指向本地链

如果你准备跑本地测试，需要确认你的客户端和 CLI 指向 Surfpool 暴露的本地 RPC。

通常是：

```bash
solana config set --url http://127.0.0.1:8899
```

然后确认：

```bash
solana config get
```

### 7.5 Anchor.toml 的本地测试建议

你当前文件是：

[Anchor.toml](/Users/deelmind/Documents/Solana/Program/Anchor/helloworld/Anchor.toml)

如果你的目标是“本地测试”，建议注意这件事：

* 当前 `[programs.devnet]` 和 `provider.cluster = "devnet"` 更适合 devnet 部署
* 做纯本地测试时，通常需要改成 `localnet` 思路，或者通过环境变量把 RPC 指到本地

常见思路有两种：

第一种，直接改配置偏向本地：

```toml
[provider]
cluster = "localnet"
wallet = "~/.config/solana/id.json"
```

第二种，不改太多文件，通过命令行或环境变量控制测试指向本地 RPC。

如果你以后要同时维护 `devnet` 和 `localnet`，第二种更灵活。

## 8. 一个典型工作流

下面是一套比较实用的 Surfpool + Anchor 工作流。

### 8.1 编译程序

```bash
anchor build
```

### 8.2 启动本地网络

```bash
surfpool start
```

### 8.3 检查钱包和余额

```bash
solana address
solana balance
```

### 8.4 运行测试

```bash
anchor test
```

如果你已经自己启动了 Surfpool，有些场景会希望避免 Anchor 再起一个本地 validator，这时可以根据你的项目脚本考虑：

```bash
anchor test --skip-local-validator
```

是否使用这条命令，要看你当前测试脚本和 Anchor 版本的行为。

### 8.5 用 CLI 查看程序

```bash
solana program show <PROGRAM_ID>
```

### 8.6 查看账户或交易

```bash
solana account <ACCOUNT_PUBKEY>
solana confirm <SIGNATURE>
```

## 9. Surfpool 相比传统本地链的优势

### 9.1 更接近真实链上状态

这是 Surfpool 最值得关注的点。

传统本地 validator 经常面临的问题是：

* 账户状态都要自己造
* SPL Token、真实程序依赖、复杂账户关系不好复现
* 某些 bug 只在“真实链状态”下出现

Surfpool 的设计方向就是减少这些痛点。

### 9.2 更适合复杂协议测试

当你的程序依赖：

* 外部程序
* 已存在账户
* 真实 token mint
* 更复杂的账户上下文

Surfpool 的优势会比普通本地链更明显。

### 9.3 更适合团队协作

因为它强调 IaC 思路，所以团队可以更容易统一：

* 本地环境
* 测试环境
* 部署过程

这样“我这里能跑，你那里不行”的问题会少很多。

## 10. 常用命令整理

### 10.1 Surfpool

```bash
surfpool --version
surfpool start
surfpool start --help
```

### 10.2 Solana CLI

```bash
solana config get
solana config set --url http://127.0.0.1:8899
solana address
solana balance
solana program show <PROGRAM_ID>
```

### 10.3 Anchor

```bash
anchor build
anchor test
anchor test --skip-local-validator
anchor deploy
```

## 11. 你这个项目里怎么落地

结合你当前仓库，推荐你这样实践：

### 方案一：把 Surfpool 当本地开发链

适合你现在先学流程、验证 hello world 程序。

步骤：

1. 进入 Anchor 项目目录
2. 执行 `anchor build`
3. 执行 `surfpool start`
4. 把 Solana CLI RPC 切到本地
5. 运行 `anchor test`

对应目录：

* Anchor 项目目录：[Program/Anchor/helloworld](/Users/deelmind/Documents/Solana/Program/Anchor/helloworld)
* 配置文件：[Anchor.toml](/Users/deelmind/Documents/Solana/Program/Anchor/helloworld/Anchor.toml)

### 方案二：保留 devnet 配置，把 Surfpool 当独立实验环境

适合你不想动现有 devnet 配置，只是临时学习或做本地实验。

做法：

* 保持 `Anchor.toml` 现状
* 启动 Surfpool
* 单独把当前终端的 RPC 指到本地
* 在本地终端里跑测试或 CLI 操作

这样不会影响你原来 devnet 的使用习惯。

## 12. 常见问题

### 12.1 `anchor test` 还是连到 devnet

原因通常有几个：

* `Anchor.toml` 里 `provider.cluster` 还是 `devnet`
* 终端环境变量覆盖了配置
* 你的测试脚本里手动指定了 RPC

排查顺序建议：

1. 看 `Anchor.toml`
2. 看 `solana config get`
3. 看测试脚本

### 12.2 本地链起来了，但程序没部署成功

先检查：

```bash
anchor build
```

再看：

```bash
surfpool start --help
```

因为不同版本的 Surfpool 对项目自动识别和部署参数可能略有差异。

### 12.3 钱包没余额

本地链里需要确认：

* 你当前用的是哪个 keypair
* 当前 RPC 是不是本地地址
* Surfpool 是否提供默认测试资金或 faucet 能力

先用下面两条命令确认上下文：

```bash
solana address
solana balance
```

### 12.4 本地测试和 devnet 测试混了

这是初学者最常见的问题之一。

建议养成两个习惯：

* 跑测试前先执行 `solana config get`
* 明确区分“本地实验终端”和“devnet 部署终端”

## 13. 学习 Surfpool 时最应该抓住的重点

如果你是第一次接触 Surfpool，不要一开始就被它的 IaC、Studio、Cloud、SQL 等概念吓到。

建议先按下面顺序学：

1. 先把它当作更强的 `solana-test-validator`
2. 学会 `surfpool start`
3. 学会把 Anchor 项目接到本地 RPC
4. 学会在本地复现真实账户状态相关问题
5. 最后再看更高级的 IaC、索引、场景模拟能力

这样学习成本最低，也最容易建立直觉。

## 14. 一套最小可运行示例

在你的环境里，可以先这样练习：

```bash
cd /Users/deelmind/Documents/Solana/Program/Anchor/helloworld
anchor build
surfpool start
solana config set --url http://127.0.0.1:8899
solana config get
anchor test --skip-local-validator
```

如果这套流程能跑通，你就已经完成了 Surfpool 的最小入门。

## 15. 总结

一句话总结：

Surfpool 就是一个更适合现代 Solana 开发的本地开发环境，尤其适合 Anchor 项目、本地模拟、以及接近真实链状态的测试。

对于你当前仓库，最实用的切入方式不是先研究全部高级功能，而是先完成这件事：

* 在 `Program/Anchor/helloworld` 里成功用 Surfpool 跑起本地链
* 把 Anchor 测试接到本地 RPC
* 跑通一次 `anchor build + surfpool start + anchor test`

做到这一步，你就真正入门了。

## 参考资料

* Surfpool 官方文档：<https://docs.surfpool.run/>
* Surfpool GitHub：<https://github.com/solana-foundation/surfpool>
* Solana 官方文档：<https://solana.com/docs>
* Anchor 文档：<https://www.anchor-lang.com/>
