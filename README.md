# 🕸️ SolWallet Tracker

**Solana wallet bundler & cluster visualizer.** Paste a wallet address, get a force-directed graph of inflows/outflows with automatic bundler detection, CEX recognition, and drain alerts. Real on-chain data, real wallet labels, no API key required.

🔗 **Live demo**: https://fahmiegelo-debug.github.io/solwallet-tracker/

![Status](https://img.shields.io/badge/status-live-14f195) ![License](https://img.shields.io/badge/license-MIT-blue) ![Stack](https://img.shields.io/badge/stack-vis--network%20%2B%20solana%20rpc-9945ff)

## Why?

Arkham is powerful but heavy and locked behind sign-up. **SolWallet Tracker** is the opposite:

- 🎯 **One input, one click** — paste address → instant cluster graph
- 📦 **Bundler-focused detection** — primary use case is finding coordinated funding patterns
- 🌐 **No sign-up, no API key, no wallet connect** — works in the browser
- 🏷️ **Real wallet labels** — 127 verified entries from [solscanofficial/labels](https://github.com/solscanofficial/labels)
- 💰 **Free forever** — open-source, MIT, host yourself or use the live demo

## What it detects

The tool focuses on **bundler patterns** and a few critical adjacent flags:

| Pattern | What it means | When it fires |
|---------|---------------|---------------|
| 📦 **BUNDLER** | Wallet funded the target in a tight burst window | 3+ inflow txs, 0 outflow, all within ~50 slots |
| 💰 **FUNDER** | Pure deployer/sybil-funding pattern | ≥5 SOL inflow, ≤2 txs, 0 outflow |
| 🚨 **DRAIN** | Possible exit/rug destination | Receives >50% of target's outflow to user wallets |
| 🏦 **CEX** | Known centralized exchange hot wallet | Match in real Solscan label DB |
| ☠️ **HACKER** | Publicly reported hacker/exploit wallet | Match in Solscan hacker list |
| ⚠️ **FLAGGED** | Phishing, scam, drainer, FTX cold storage, etc. | Match in flagged list |
| 🛠️ **INFRA** | Programs, system accounts, wallet contracts | Match in program registry |

**Important:** bundler/funder/drain heuristics **only apply to unknown user wallets**. Known infrastructure (Pump.fun program, Raydium, Jupiter, Token Program, etc.) is excluded — every memecoin tx pays these, and flagging them as "bundler" would be noise.

## Real wallet label database

This repo ships with `wallet-labels.json` — 127 entries pulled from the official Solscan public labels repo:

- 19 **CEX hot wallets** (Binance, Coinbase, Kraken, Bybit, OKX, KuCoin, MEXC, Crypto.com, Gate.io, Bitget, etc.)
- 24 **hacker wallets** (publicly reported exploits, attributed by Solscan)
- 11 **flagged wallets** (FTX cold storage, Alameda, drainers, scam addresses)
- 70 **programs** (Pump.fun, Raydium AMM v4, Jupiter v6, Orca Whirlpool, Meteora, system programs, wallet contracts)
- 3 **trust tokens** (SOL, USDC, USDT)

To refresh the database:

```bash
curl -s https://raw.githubusercontent.com/solscanofficial/labels/main/labels.json -o solscan_raw.json
# regenerate wallet-labels.json with the script in /scripts/build-labels.py (or re-run the curation)
```

## Stack

- [vis-network 9.x](https://visjs.github.io/vis-network/) — force-directed graph
- [Solana JSON-RPC](https://docs.solana.com/api/http) — public mainnet, no key
- Vanilla HTML/CSS/JS — no build step, no framework
- Static deployment via GitHub Pages

## Quick start

```bash
git clone https://github.com/fahmiegelo-debug/solwallet-tracker.git
cd solwallet-tracker
python3 -m http.server 8000
# open http://localhost:8000
```

## How it works

1. **Fetch signatures** for target wallet via `getSignaturesForAddress` (last 80)
2. **Parse transactions** (up to 50) via `getTransaction` with `jsonParsed` encoding
3. **Extract transfers** — native SOL deltas + SPL `transfer`/`transferChecked` + System Program `transfer`
4. **Aggregate counterparties** — group by address, sum in/out, count txs, track signature set
5. **Classify** — apply bundler/funder/drain heuristics + match against real label DB
6. **Render** — vis-network force graph, edge weight ∝ volume

## Customize

- **Tx fetch limit**: `TX_FETCH_LIMIT` (default 80)
- **Parse limit**: `PARSE_TX_LIMIT` (default 50, RPC-heavy)
- **Min transfer**: `MIN_SOL_TRANSFER` (default 0.005 SOL — ignores dust)
- **Bundler thresholds**: `BUNDLER_MIN_TX`, `BUNDLER_SLOT_WINDOW`
- **Funder threshold**: `FUNDER_MIN_SOL`
- **Drain fraction**: `DRAIN_FRACTION`
- **RPC endpoints**: edit `RPC_ENDPOINTS` array, add Helius/QuickNode for higher throughput

## Use cases

- 🕵️ **Memecoin diligence** — find bundler clusters before aping a fresh token
- 🚨 **Rug detection** — see if deployer drained funds to known wallets
- 🐋 **Whale tracing** — map a known address's full counterparty graph
- 💼 **Compliance** — identify CEX exposure, OFAC-flagged interactions
- 🎯 **Sybil hunting** — visualize airdrop farm coordinated funding
- 🔍 **Forensics** — trace stolen funds through hops

## Limitations

- Public Solana RPC is rate-limited — for heavy use, plug in Helius/QuickNode/Triton
- Heuristics are conservative; manual judgment still required
- Only sampled history (last ~50 tx parsed); for deep historical, integrate paid indexer
- Bundler detection currently single-hop; multi-hop trace not yet implemented

## Roadmap

- [ ] Multi-hop expansion (click counterparty → expand its graph)
- [ ] Time-based filtering (slot range slider)
- [ ] Token transfer overlay (which memecoin moved between wallets)
- [ ] Helius webhook integration for live updates
- [ ] Export graph as PNG/SVG/JSON
- [ ] Save & share clusters via URL hash
- [ ] Auto-refresh `wallet-labels.json` via GitHub Action (weekly pull from solscanofficial/labels)

## License

MIT — fork it, ship it, charge for it.

## Credits

- Wallet labels: [solscanofficial/labels](https://github.com/solscanofficial/labels)
- Bundler heuristics inspired by [hiburhan/wallet-analyzer](https://github.com/hiburhan/wallet-analyzer) and [netvyxe/godmode](https://github.com/netvyxe/godmode)
- Built by [@fahmiegelo-debug](https://github.com/fahmiegelo-debug)
