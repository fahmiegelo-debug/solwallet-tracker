#!/usr/bin/env python3
"""
build-labels.py — Refresh wallet-labels.json from solscanofficial/labels.

Usage:
    python3 scripts/build-labels.py

Fetches the upstream labels.json, categorizes by tag (cex/hacker/flagged/program/token),
and writes a curated production label DB to wallet-labels.json.
"""
import json
import urllib.request
import sys
import pathlib
from collections import Counter

UPSTREAM = "https://raw.githubusercontent.com/solscanofficial/labels/main/labels.json"
OUT = pathlib.Path(__file__).parent.parent / "wallet-labels.json"

CEX_KEYWORDS = [
    'Binance', 'Coinbase', 'Kraken', 'Bybit', 'OKX', 'Gate', 'KuCoin',
    'Crypto.com', 'MEXC', 'Bitget', 'Bitfinex', 'BitMart', 'Huobi',
    'Bitkub', 'CoinEx', 'BingX', 'WhiteBIT', 'BTSE', 'Bitstamp',
]
NOTABLE_KEYWORDS = ['FTX', 'Alameda', 'Tornado', 'Drainer', 'Scam', 'Phishing', 'Exploit']
PROGRAM_TAG_KEYWORDS = {
    'Pump': 'pumpfun', 'Raydium': 'dex', 'Orca': 'dex', 'Jupiter': 'dex',
    'Meteora': 'dex', 'Lifinity': 'dex', 'Marinade': 'staking', 'Lido': 'staking',
    'Wormhole': 'bridge', 'Allbridge': 'bridge', 'deBridge': 'bridge',
    'Token Program': 'system', 'System Program': 'system', 'Memo': 'system',
    'Compute Budget': 'system', 'Associated Token': 'system',
    'Phantom': 'wallet', 'Solflare': 'wallet', 'Glow': 'wallet',
    'Mango': 'protocol', 'Solend': 'protocol', 'Tulip': 'protocol',
    'Drift': 'perps', 'Zeta': 'perps',
}


def fetch_upstream():
    print(f'Fetching {UPSTREAM}…')
    with urllib.request.urlopen(UPSTREAM, timeout=30) as r:
        return json.loads(r.read())


def categorize(src):
    labels = {}
    addr = src.get('address', {})
    prog = src.get('program', {})
    hack = src.get('hacker', {})
    trust = src.get('trust_token', {})

    # CEX hot wallets
    for k, v in addr.items():
        if not isinstance(v, str):
            continue
        if 'Validator' in v or 'Vote' in v:
            continue
        if any(kw.lower() in v.lower() for kw in CEX_KEYWORDS):
            labels[k] = {'name': v, 'tag': 'cex'}

    # Hackers
    for k, v in hack.items():
        labels[k] = {'name': v, 'tag': 'hacker'}

    # Other notable (FTX cold, drainers)
    for k, v in addr.items():
        if not isinstance(v, str):
            continue
        if any(kw.lower() in v.lower() for kw in NOTABLE_KEYWORDS):
            labels[k] = {'name': v, 'tag': 'flagged'}

    # Programs
    for k, v in prog.items():
        if not isinstance(v, str):
            continue
        for kw, t in PROGRAM_TAG_KEYWORDS.items():
            if kw.lower() in v.lower():
                labels[k] = {'name': v, 'tag': 'program'}
                break

    # Trust tokens (SOL, USDC, USDT)
    for k, v in trust.items():
        labels[k] = {'name': v, 'tag': 'token'}

    return labels


def main():
    src = fetch_upstream()
    labels = categorize(src)

    if len(labels) < 50:
        print(f'ERROR: only {len(labels)} entries — upstream format may have changed.', file=sys.stderr)
        sys.exit(1)

    sorted_labels = dict(sorted(labels.items(), key=lambda x: (x[1]['tag'], x[1]['name'])))
    tags = Counter(v['tag'] for v in labels.values())

    output = {
        '_source': UPSTREAM,
        '_generated_via': 'scripts/build-labels.py',
        '_count': len(labels),
        '_breakdown': dict(tags),
        'labels': sorted_labels,
    }

    OUT.write_text(json.dumps(output, indent=2))
    print(f'\n✓ Written {OUT}')
    print(f'  Total entries: {len(labels)}')
    print(f'  By tag: {dict(tags)}')


if __name__ == '__main__':
    main()
