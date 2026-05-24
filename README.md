# 🕸️ SolWallet Tracker

**Solana wallet cluster visualizer.** Paste a wallet address, get a force-directed graph of inflows/outflows, automatic bundler/funder/CEX detection, and pattern flags. Like Arkham — but cleaner, simpler, and 100% free.

🔗 **Live demo**: https://fahmiegelo-debug.github.io/solwallet-tracker/

![Status](https://img.shields.io/badge/status-live-14f195) ![License](https://img.shields.io/badge/license-MIT-blue) ![Stack](https://img.shields.io/badge/stack-vis--network%20%2B%20solana%20rpc-9945ff)

## Why?

Arkham is powerful but feels heavy and locked behind sign-up. **SolWallet Tracker** is the opposite:

- 🎯 **One input, one click** — paste address → instant graph
- 🌐 **No sign-up, no API key, no wallet connect** — works in the browser
- 🕸️ **Cluster detection** — bundlers, funders, CEX hot wallets, drain destinations auto-flagged
- 🎨 **Better aesthetics** — Solana-themed dark UI, force layout, no noise
- 💰 **Free forever** — open-source, MIT, host yourself or use the live demo

## Features

- 🔗 **Force-directed graph** of wallet connections (vis-network)
- 🏷️ **Auto-labeling** — known CEX/protocol wallets recognized (Binance, Coinbase, Bybit, Kraken, OKX, Gate, Raydium, Jupiter, Wormhole)
- 📦 **Bundler detection** — wallets that funded target in tight burst windows
- 💰 **Funder detection** — pure inflow with no return (sybil/farm pattern)
- 🚨 **Drain detection** — wallets receiving >50% of total outflow (rug/exit pattern)
- 🌐 **Cluster detection** — wallets sharing many sigs with target
- 📊 **Sidebar insights** — actionable findings: "3 bundler wallets sent SOL in burst", "2 drain destinations received 70% of outflow"
- 🔍 **Click any node** — drill into counterparty: tags, signatures, deep links to Solscan/GMGN/Birdeye
- ⚛︎ **Physics toggle** — pause layout to inspect cleanly
- ⚡ **Demo dataset** — 3 pre-loaded clusters (bundler, CEX, rugger) work instantly even if RPC is rate-limited

## Stack

- [vis-network 9.x](https://visjs.github.io/vis-network/) — force graph
- [Solana JSON-RPC](https://docs.solana.com/api/http) — public mainnet endpoint, no key required
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

1. **Fetch signatures** for the target wallet via `getSignaturesForAddress`
2. **Parse transactions** (up to 40) via `getTransaction` with `jsonParsed` encoding
3. **Extract transfers** — native SOL deltas + SPL parsed `transfer` / `transferChecked` instructions
4. **Aggregate counterparties** — group by address, sum in/out, count txs, track signatures
5. **Classify** — apply pattern heuristics + known-label database
6. **Render** — vis-network force graph with edge weights proportional to volume

## Pattern heuristics

Heuristics **only apply to unknown user wallets**. Known infrastructure (CEX hot wallets, DEX programs, Jito tip accounts, system programs) is excluded — Jito tips are paid by every MEV bundle and would otherwise trigger false bundler/drain flags.

| Pattern | Trigger | Applies to |
|---------|---------|------------|
| **CEX** | Address matches known CEX hot wallet database | Any |
| **Protocol** | Raydium, Jupiter, Orca, Wormhole, etc. | Any |
| **MEV** | Jito tip accounts, NextBlock, Helius nominal, Temporal | Any |
| **Bundler** | 3+ inflow tx, 0 outflow, all within ~50 slots | User wallets only |
| **Funder** | Single large inflow >5 SOL, 0 outflow | User wallets only |
| **Drain** | Receives >50% of target's total outflow **to user wallets** | User wallets only |
| **Cluster** | Shares 5+ signatures (frequent co-occurrence) | User wallets only |

## Known-label database

Currently labels these wallets out-of-the-box:

- **CEX**: Binance, Coinbase, Bybit, Kraken, OKX, Gate.io
- **DEX**: Raydium AMM v4, Orca
- **Aggregator**: Jupiter v6
- **Bridge**: Wormhole
- **System**: Token Program, System Program, Compute Budget

Add more via `KNOWN_LABELS` in `app.js`.

## Customize

- **Tx fetch limit**: change `TX_FETCH_LIMIT` (default 60)
- **Parse limit**: change `PARSE_TX_LIMIT` (default 40, RPC-heavy)
- **Min transfer**: `MIN_SOL_TRANSFER` (default 0.005 SOL — ignores dust)
- **RPC endpoints**: edit `RPC_ENDPOINTS` array, add Helius/QuickNode for higher throughput

## Use cases

- 🕵️ **Memecoin diligence** — find bundler clusters before aping a fresh token
- 🚨 **Rug detection** — see if deployer drained funds to known wallets
- 🐋 **Whale tracking** — map a known address's full counterparty graph
- 💼 **Compliance** — identify CEX exposure, OFAC-flagged interactions
- 🎯 **Sybil hunting** — visualize airdrop farm clusters
- 🔍 **Forensics** — trace stolen funds through hops

## Roadmap

- [ ] Multi-hop expansion (click counterparty → expand its graph)
- [ ] Time-based filtering (slot range slider)
- [ ] SOL value lookup at slot time (USD attribution)
- [ ] Token transfer overlay (which memecoin moved between wallets)
- [ ] Helius webhook integration for live updates
- [ ] Export graph as PNG/SVG/JSON
- [ ] Save & share clusters via URL hash
- [ ] EVM support (chain switcher)

## Limitations

- Public RPC is rate-limited — for heavy use, plug in Helius/QuickNode/Triton
- Heuristics are conservative; manual judgment still required
- Only sampled history (last ~40 tx parsed); for deep historical, integrate paid indexer

## License

MIT — fork it, ship it, charge for it. Just don't be evil.

## Author

Built by [@fahmiegelo-debug](https://github.com/fahmiegelo-debug). Part of an open-source toolkit for crypto traders & researchers.
