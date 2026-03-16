# Solana

> 研究项目Solana区块链，Rust

## 文档

* https://www.solana-program.com/
* https://examples.anchor-lang.com/
* https://github.com/solana-developers/program-examples

## DAPP

* npm i @solana/web3.js

## 环境安装

* https://solana.com/zh/docs/intro/installation
* https://docs.anza.xyz/

* solana
* avm
* anchor
* surfpool
* rust
* agave-install

## 节点部署

* https://docs.anza.xyz/
* 源码编译


##  Solana

* solana config get
* solana config set --url https://api.devnet.solana.com
* cat ~/.config/solana/cli/config.yml
* solana balance
* solana address
* solana address -k keypair.json
* cargo new project_name --lib
* cargo build-
* cargo build-sbf --manifest-path=./program/Cargo.toml --sbf-out-dir=./program/target/
* cargo test-sbf
* solana program show Program_ID
* solana program deploy taget.so
* solana program close Program_ID


## Anchor

* anchor init project_name
* anchor build
* anchor test
* anchor deploy
* anchor idl upgrade --filepath ./target/idl/helloworld.json 8Q5gN8ajGRqajS1g7wVGdcavnvZLnZrWYJfRczzXcRdC



## ERROR

```
cargo build-sbf error: not a directory: '/home/ubuntu/.local/share/solana/install/releases/stable-f5a29bf666df34ddb5b6b4c6a0aaa803d8cb8bbe/solana-release/bin/platform-tools-sdk/sbf/dependencies/platform-tools/rust/lib'
```

```
rm -rf ~/.local/share/solana
rm -rf ~/.config/solana
rm -rf ~/.cache/solana
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
```