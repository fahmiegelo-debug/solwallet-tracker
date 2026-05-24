// SolWallet Tracker — Solana wallet cluster visualizer
// Uses public Solana JSON-RPC (no key needed), with graceful fallback to local demo dataset.

// ─────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────
const RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-rpc.publicnode.com',
];
const TX_FETCH_LIMIT = 60;        // signatures to fetch per wallet
const PARSE_TX_LIMIT = 40;        // transactions to actually parse (RPC heavy)
const MIN_SOL_TRANSFER = 0.005;   // ignore dust
const DEMO_DATA_URL = 'demo-data.json';

// Known CEX/protocol labels (add more as needed)
const KNOWN_LABELS = {
  '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1': { name: 'Raydium AMM', kind: 'dex' },
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': { name: 'Raydium V4', kind: 'dex' },
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM': { name: 'Binance Hot 2', kind: 'cex' },
  '2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S': { name: 'Coinbase 2', kind: 'cex' },
  '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9': { name: 'Bybit Hot', kind: 'cex' },
  'AC5RDfQFmDS1deWZos921JfqscXdByf8BKHs5ACWjtW2': { name: 'Bybit Cold', kind: 'cex' },
  'H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS': { name: 'Coinbase 1', kind: 'cex' },
  '2AQdpHJ2JpcEgPiATUXjQxA8QmafFegfQwSLWSprPicm': { name: 'Kraken', kind: 'cex' },
  'FWznbcNXWQuHTawe9RxvQ2LdCENssh12dsznf4RiouN5': { name: 'OKX 1', kind: 'cex' },
  '3iqGCt3pxNNmmEsZTVxDU3pgxK37LxCM4nEyokbLfMgg': { name: 'OKX 2', kind: 'cex' },
  'HXqzZuPG7TGLhgYGAkAzH67tXmHvY1jGsFdMoFLyP2Bo': { name: 'Gate.io', kind: 'cex' },
  '3LKZU3iQcWN6jdfxRsLT5p2ezk9PzaCjVouvY3FhJW5T': { name: 'Jupiter v6', kind: 'protocol' },
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': { name: 'Jupiter Token', kind: 'protocol' },
  '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU': { name: 'Wormhole Bridge', kind: 'protocol' },
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': { name: 'Token Program', kind: 'system' },
  '11111111111111111111111111111111': { name: 'System Program', kind: 'system' },
  'ComputeBudget111111111111111111111111111111': { name: 'Compute Budget', kind: 'system' },

  // Jito MEV tip accounts (8 official) — bukan bundler wallet, ini infra validator tip pool
  '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5': { name: 'Jito Tip 1', kind: 'mev' },
  'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe': { name: 'Jito Tip 2', kind: 'mev' },
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY': { name: 'Jito Tip 3', kind: 'mev' },
  'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49': { name: 'Jito Tip 4', kind: 'mev' },
  'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh': { name: 'Jito Tip 5', kind: 'mev' },
  'ADuUkR4vqLUMWXxW9gh6D6L8pivKeVBBjNhVgNjCggAk': { name: 'Jito Tip 6', kind: 'mev' },
  'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL': { name: 'Jito Tip 7', kind: 'mev' },
  '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT': { name: 'Jito Tip 8', kind: 'mev' },
  // Jito ecosystem
  'jtojtomepa8beP8AuQc6eXt5FriJwfNVBz8VJbBVxn3': { name: 'Jito Token (JTO)', kind: 'protocol' },
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': { name: 'jitoSOL', kind: 'protocol' },
  // Other infra & MEV
  'noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV': { name: 'Helius Nominal', kind: 'mev' },
  'temporalnoo1d3dECtzcsp6ZN7NRWhmUFSttMD3FnD4j': { name: 'Temporal Bot', kind: 'mev' },
  'NextbLockBwx9MakeC9X9PfP1RY29kPVDpNhT7qnmW': { name: 'NextBlock', kind: 'mev' },
  '0xFLAGCv1gaiPHnQK5yiUiQAitH4eGbQp2nDYvhVXp': { name: 'FlagToken', kind: 'protocol' },
};

const COLORS = {
  target:   '#14f195',
  inflow:   '#5eaaff',
  outflow:  '#9945ff',
  bundler:  '#ffa726',
  cex:      '#ff6ec7',
  drain:    '#ff4d6d',
  protocol: '#a78bfa',
  mev:      '#ffd54f',
  system:   '#5e677d',
};

// ─────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────
const STATE = {
  network: null,
  nodes: null,
  edges: null,
  target: null,
  walletData: null,
  selectedWallet: null,
  physicsOn: true,
  loadingDemo: null,
};

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

function shortAddr(a, n = 4) {
  if (!a) return '';
  return a.length > 12 ? `${a.slice(0, n)}…${a.slice(-n)}` : a;
}

function fmtSOL(n) {
  if (n == null) return '—';
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(2) + 'K SOL';
  if (Math.abs(n) >= 1) return n.toFixed(2) + ' SOL';
  return n.toFixed(4) + ' SOL';
}

function isValidSolAddr(a) {
  if (!a) return false;
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a.trim());
}

function setStatus(msg, show = true) {
  $('graph-status').classList.toggle('show', show);
  $('status-text').textContent = msg || '';
}

function clearGraph() {
  if (STATE.network) {
    STATE.network.destroy();
    STATE.network = null;
  }
  STATE.nodes = null;
  STATE.edges = null;
  STATE.target = null;
  STATE.walletData = null;
  STATE.selectedWallet = null;
  $('graph-empty').style.display = 'flex';
  $('graph-legend').style.display = 'none';
  renderEmptySidebar();
}

function renderEmptySidebar() {
  $('sidebar').innerHTML = `
    <div class="panel-empty" id="panel-empty">
      <div style="font-size: 36px; margin-bottom: 8px; opacity: 0.5">🔮</div>
      Track a wallet to see<br>cluster analysis, top counterparties,<br>and pattern flags here.
    </div>
  `;
}

// ─────────────────────────────────────────────────────────
// SOLANA RPC
// ─────────────────────────────────────────────────────────
async function rpc(method, params, attempt = 0) {
  const endpoint = RPC_ENDPOINTS[attempt % RPC_ENDPOINTS.length];
  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    if (j.error) throw new Error(j.error.message || JSON.stringify(j.error));
    return j.result;
  } catch (err) {
    if (attempt < RPC_ENDPOINTS.length - 1) {
      return rpc(method, params, attempt + 1);
    }
    throw err;
  }
}

async function fetchSignatures(addr, limit = TX_FETCH_LIMIT) {
  return rpc('getSignaturesForAddress', [addr, { limit }]);
}

async function fetchTransaction(sig) {
  return rpc('getTransaction', [sig, { maxSupportedTransactionVersion: 0, encoding: 'jsonParsed' }]);
}

// Parse an RPC tx into a list of {from, to, lamports, mint?, type}
function parseTransfers(tx, target) {
  const transfers = [];
  if (!tx || !tx.meta || !tx.transaction) return transfers;

  const acctKeys = tx.transaction.message.accountKeys.map(k => typeof k === 'string' ? k : k.pubkey);
  const pre = tx.meta.preBalances || [];
  const post = tx.meta.postBalances || [];

  // Native SOL deltas (subtract fee from fee-payer)
  const fee = tx.meta.fee || 0;
  for (let i = 0; i < acctKeys.length; i++) {
    let delta = (post[i] - pre[i]) / 1e9;
    if (i === 0) delta += fee / 1e9;     // fee-payer paid the fee, add it back
    if (Math.abs(delta) < MIN_SOL_TRANSFER) continue;
    if (acctKeys[i] === target) {
      transfers.push({
        addr: acctKeys[i],
        lamports: delta,
        kind: delta > 0 ? 'in' : 'out',
        sig: tx.transaction.signatures[0],
        slot: tx.slot,
      });
    }
  }

  // SPL transfers via inner / outer instructions (best effort)
  const instr = tx.transaction.message.instructions || [];
  const inner = (tx.meta.innerInstructions || []).flatMap(x => x.instructions);
  for (const ix of [...instr, ...inner]) {
    if (!ix.parsed) continue;
    if (ix.parsed.type === 'transfer' || ix.parsed.type === 'transferChecked') {
      const info = ix.parsed.info;
      const amount = (info.tokenAmount?.uiAmount ?? (info.amount ? Number(info.amount) / 1e9 : 0));
      if (!info.source || !info.destination) continue;
      if (info.source === target) {
        transfers.push({ addr: info.destination, lamports: -amount, kind: 'out', sig: tx.transaction.signatures[0], slot: tx.slot, mint: info.mint });
      } else if (info.destination === target) {
        transfers.push({ addr: info.source, lamports: amount, kind: 'in', sig: tx.transaction.signatures[0], slot: tx.slot, mint: info.mint });
      }
    }
  }

  return transfers;
}

// Aggregate transfers into per-wallet summary
function aggregateCounterparties(allTransfers, target) {
  const byAddr = new Map();
  for (const t of allTransfers) {
    if (t.addr === target) continue;
    if (!byAddr.has(t.addr)) {
      byAddr.set(t.addr, {
        addr: t.addr,
        in: 0, out: 0,
        inCount: 0, outCount: 0,
        firstSlot: t.slot, lastSlot: t.slot,
        sigs: new Set(),
      });
    }
    const w = byAddr.get(t.addr);
    if (t.lamports > 0) { w.in += t.lamports; w.inCount++; }
    else { w.out += -t.lamports; w.outCount++; }
    w.firstSlot = Math.min(w.firstSlot, t.slot);
    w.lastSlot = Math.max(w.lastSlot, t.slot);
    w.sigs.add(t.sig);
  }
  return Array.from(byAddr.values()).map(w => ({
    ...w,
    sigs: Array.from(w.sigs),
    net: w.in - w.out,
    txCount: w.inCount + w.outCount,
  }));
}

// ─────────────────────────────────────────────────────────
// DEMO DATASET (loaded on demand)
// ─────────────────────────────────────────────────────────
async function loadDemo() {
  if (STATE.loadingDemo) return STATE.loadingDemo;
  STATE.loadingDemo = fetch(DEMO_DATA_URL).then(r => r.json());
  return STATE.loadingDemo;
}

async function getDemoData(addr) {
  try {
    const all = await loadDemo();
    return all[addr] || null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// PATTERN DETECTION
// ─────────────────────────────────────────────────────────
function classifyWallet(w, target, allWallets) {
  const labels = [];
  const known = KNOWN_LABELS[w.addr];

  // Tag known infrastructure first
  if (known) {
    if (known.kind === 'cex') labels.push({ tag: 'cex', label: 'CEX', name: known.name });
    else if (known.kind === 'dex' || known.kind === 'protocol') labels.push({ tag: 'protocol', label: known.kind.toUpperCase(), name: known.name });
    else if (known.kind === 'mev') labels.push({ tag: 'mev', label: 'MEV', name: known.name + ' — validator tip / MEV infra' });
    else labels.push({ tag: 'system', label: 'SYS', name: known.name });
  }

  // CRITICAL: bundler/funder/drain heuristics ONLY apply to unknown user wallets,
  // not to CEX hot wallets, DEX programs, MEV tip accounts, or system programs.
  // Jito tip transfers are infrastructure activity — every MEV bundle pays them.
  const isInfrastructure = !!known;

  if (!isInfrastructure) {
    // Bundler heuristic: 3+ inflow tx within close slot range (originated in same slot batch)
    if (w.inCount >= 3 && w.outCount === 0 && (w.lastSlot - w.firstSlot) < 50) {
      labels.push({ tag: 'bundler', label: 'BUNDLER', name: 'Funded the target in burst' });
    }
    // Funder heuristic: large single inflow with no outflow
    if (w.in > 5 && w.inCount <= 2 && w.outCount === 0) {
      labels.push({ tag: 'funder', label: 'FUNDER', name: 'Sent SOL to target only' });
    }
    // Drain heuristic: target sent >50% of total volume here, exclude infra outflow from denominator
    const totalOutToUserWallets = allWallets
      .filter(x => !KNOWN_LABELS[x.addr])
      .reduce((s, x) => s + x.out, 0);
    if (totalOutToUserWallets > 0 && w.out / totalOutToUserWallets > 0.5 && w.out > 1) {
      labels.push({ tag: 'drain', label: 'DRAIN', name: 'Received >50% of outflow to user wallets' });
    }
    // Cluster heuristic: appears in many same sigs as target's other counterparties
    const sigsShared = w.sigs.length;
    if (sigsShared >= 5) {
      labels.push({ tag: 'cluster', label: 'CLUSTER', name: 'Part of frequent group' });
    }
  }

  return labels;
}

function pickColor(labels, kind) {
  for (const l of labels) {
    if (l.tag === 'drain') return COLORS.drain;
    if (l.tag === 'cex') return COLORS.cex;
    if (l.tag === 'mev') return COLORS.mev;
    if (l.tag === 'bundler') return COLORS.bundler;
    if (l.tag === 'funder') return COLORS.bundler;
    if (l.tag === 'protocol') return COLORS.protocol;
    if (l.tag === 'system') return COLORS.system;
    if (l.tag === 'cluster') return '#a78bfa';
  }
  return kind === 'in' ? COLORS.inflow : COLORS.outflow;
}

// ─────────────────────────────────────────────────────────
// GRAPH RENDER
// ─────────────────────────────────────────────────────────
function renderGraph(target, wallets) {
  $('graph-empty').style.display = 'none';
  $('graph-legend').style.display = 'block';

  const nodes = new vis.DataSet();
  const edges = new vis.DataSet();

  // root
  nodes.add({
    id: target,
    label: shortAddr(target),
    color: { background: COLORS.target, border: '#0a0' },
    font: { color: '#0a0', size: 14, face: 'JetBrains Mono', strokeWidth: 0, bold: true },
    size: 30,
    shape: 'dot',
    borderWidth: 3,
    title: `🎯 Target wallet\n${target}`,
  });

  for (const w of wallets) {
    const labels = classifyWallet(w, target, wallets);
    const known = KNOWN_LABELS[w.addr];
    const kind = w.in > w.out ? 'in' : 'out';
    const color = pickColor(labels, kind);
    const sizeBase = Math.min(28, 10 + Math.log10(1 + w.txCount * 4) * 6);

    const labelTxt = known ? known.name : shortAddr(w.addr);
    const tooltip = [
      `${known ? '🏷️ ' + known.name + '\n' : ''}${w.addr}`,
      `In:  ${fmtSOL(w.in)}  (${w.inCount} tx)`,
      `Out: ${fmtSOL(w.out)}  (${w.outCount} tx)`,
      labels.length ? '\n' + labels.map(l => `[${l.label}] ${l.name}`).join('\n') : '',
    ].join('\n');

    nodes.add({
      id: w.addr,
      label: labelTxt,
      color: { background: color, border: color },
      font: { color: '#fff', size: 11, face: 'JetBrains Mono' },
      size: sizeBase,
      shape: 'dot',
      title: tooltip,
      _data: { ...w, labels },
    });

    // edge
    const edgeColor = kind === 'in' ? COLORS.inflow : COLORS.outflow;
    const width = Math.min(6, 1 + Math.log10(1 + (w.in + w.out)) * 1.4);
    edges.add({
      from: kind === 'in' ? w.addr : target,
      to:   kind === 'in' ? target : w.addr,
      arrows: { to: { enabled: true, scaleFactor: 0.6 } },
      color: { color: edgeColor, opacity: 0.5 },
      width,
      smooth: { enabled: true, type: 'curvedCW', roundness: 0.1 },
      label: w.txCount > 1 ? `${w.txCount}×` : '',
      font: { color: '#9ba4b8', size: 10, face: 'JetBrains Mono', strokeWidth: 0 },
    });
  }

  STATE.nodes = nodes;
  STATE.edges = edges;
  STATE.target = target;
  STATE.walletData = wallets;

  const opts = {
    interaction: { hover: true, tooltipDelay: 100, zoomView: true, dragView: true, multiselect: false },
    physics: {
      enabled: STATE.physicsOn,
      barnesHut: { gravitationalConstant: -8000, centralGravity: 0.25, springLength: 140, springConstant: 0.04, damping: 0.7, avoidOverlap: 0.4 },
      stabilization: { iterations: 200, fit: true },
    },
    nodes: {
      borderWidth: 2,
      shadow: { enabled: true, color: 'rgba(0,0,0,0.5)', size: 8, x: 0, y: 4 },
    },
    edges: {
      hoverWidth: w => w + 0.5,
    },
  };

  STATE.network = new vis.Network($('network'), { nodes, edges }, opts);

  STATE.network.on('click', (params) => {
    if (params.nodes.length === 1) {
      const id = params.nodes[0];
      if (id === target) {
        renderTargetSidebar(target, wallets);
      } else {
        const node = nodes.get(id);
        renderWalletDetail(node);
      }
      STATE.selectedWallet = id;
    }
  });

  // initial sidebar
  renderTargetSidebar(target, wallets);
}

// ─────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────
function renderTargetSidebar(target, wallets) {
  const inflow = wallets.reduce((s, w) => s + w.in, 0);
  const outflow = wallets.reduce((s, w) => s + w.out, 0);
  const txCount = wallets.reduce((s, w) => s + w.txCount, 0);
  const uniqueCounter = wallets.length;

  const allLabels = wallets.flatMap(w => classifyWallet(w, target, wallets).map(l => ({ ...l, addr: w.addr })));
  const bundlerCount = allLabels.filter(l => l.tag === 'bundler').length;
  const funderCount = allLabels.filter(l => l.tag === 'funder').length;
  const cexCount = allLabels.filter(l => l.tag === 'cex').length;
  const drainCount = allLabels.filter(l => l.tag === 'drain').length;
  const mevCount = allLabels.filter(l => l.tag === 'mev').length;
  const protocolCount = allLabels.filter(l => l.tag === 'protocol').length;

  const insights = [];
  if (bundlerCount > 0) insights.push({ kind: 'warn', icon: '📦', text: `<strong>${bundlerCount} bundler-pattern wallet${bundlerCount > 1 ? 's' : ''}</strong> sent SOL to this address in tight burst windows. Often indicates coordinated funding.` });
  if (funderCount > 0) insights.push({ kind: 'info', icon: '💰', text: `<strong>${funderCount} pure funder${funderCount > 1 ? 's' : ''}</strong> sent SOL only (no return). Could be deployer wallets or sybil farm.` });
  if (cexCount > 0) insights.push({ kind: 'info', icon: '🏦', text: `<strong>${cexCount} CEX hot wallet${cexCount > 1 ? 's' : ''}</strong> in the graph. Indicates fiat on/off-ramp.` });
  if (drainCount > 0) insights.push({ kind: 'alert', icon: '🚨', text: `<strong>${drainCount} drain destination${drainCount > 1 ? 's' : ''}</strong> received over 50% of total outflow to user wallets. Possible exit/rug pattern.` });
  if (mevCount > 0) insights.push({ kind: 'info', icon: '⚡', text: `<strong>${mevCount} MEV / Jito tip account${mevCount > 1 ? 's' : ''}</strong> — wallet uses MEV bundles or transaction acceleration. Not a counterparty, just infrastructure.` });
  if (protocolCount > 0) insights.push({ kind: 'info', icon: '⚙️', text: `<strong>${protocolCount} DEX/protocol interaction${protocolCount > 1 ? 's' : ''}</strong> (Raydium, Jupiter, Wormhole, etc). Active trader profile.` });
  if (uniqueCounter > 30) insights.push({ kind: 'info', icon: '🌐', text: `Highly connected wallet — ${uniqueCounter} unique counterparties. Likely active trader, MM, or hub.` });
  if (insights.length === 0) insights.push({ kind: 'info', icon: '✨', text: 'No suspicious cluster pattern detected from sampled history. Looks like normal activity.' });

  const sortedWallets = [...wallets].sort((a, b) => (b.in + b.out) - (a.in + a.out));

  $('sidebar').innerHTML = `
    <div class="section">
      <div class="section-title">Target Wallet <span class="badge">TRACED</span></div>
      <div class="target-card">
        <div class="target-addr">${target} <button class="copy-btn" data-copy="${target}">Copy</button></div>
        <div class="target-meta">
          <div class="meta-cell"><div class="meta-label">Inflow</div><div class="meta-value" style="color: var(--accent)">+${fmtSOL(inflow)}</div></div>
          <div class="meta-cell"><div class="meta-label">Outflow</div><div class="meta-value" style="color: var(--info)">−${fmtSOL(outflow)}</div></div>
          <div class="meta-cell"><div class="meta-label">Counterparties</div><div class="meta-value">${uniqueCounter}</div></div>
          <div class="meta-cell"><div class="meta-label">Tx Count</div><div class="meta-value">${txCount}</div></div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Cluster Insights</div>
      <div class="insights">
        ${insights.map(i => `
          <div class="insight ${i.kind}">
            <div class="insight-icon">${i.icon}</div>
            <div class="insight-text">${i.text}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Top Counterparties <span class="badge">${wallets.length}</span></div>
      <div class="wallet-list">
        ${sortedWallets.slice(0, 12).map(w => {
          const labels = classifyWallet(w, target, wallets);
          const known = KNOWN_LABELS[w.addr];
          const isIn = w.in > w.out;
          return `
            <div class="wallet-item" data-addr="${w.addr}">
              <div class="wallet-row1">
                <span class="wallet-addr-short">${known ? known.name : shortAddr(w.addr, 5)}</span>
                <span class="wallet-amount ${isIn ? 'amount-in' : 'amount-out'}">${isIn ? '+' : '−'}${fmtSOL(Math.max(w.in, w.out))}</span>
              </div>
              <div class="wallet-meta">
                <span>${w.txCount} tx · ${isIn ? 'inflow' : 'outflow'}</span>
                <span>${labels.slice(0, 2).map(l => `<span class="tag tag-${l.tag}">${l.label}</span>`).join(' ')}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Quick Links</div>
      <div class="wallet-list">
        <a class="wallet-item" target="_blank" href="https://solscan.io/account/${target}" style="text-decoration: none; display: block">
          <div class="wallet-row1">
            <span class="wallet-addr-short">View on Solscan</span>
            <span class="wallet-amount amount-in">↗</span>
          </div>
          <div class="wallet-meta"><span>solscan.io</span><span></span></div>
        </a>
        <a class="wallet-item" target="_blank" href="https://gmgn.ai/sol/address/${target}" style="text-decoration: none; display: block">
          <div class="wallet-row1">
            <span class="wallet-addr-short">View on GMGN</span>
            <span class="wallet-amount amount-in">↗</span>
          </div>
          <div class="wallet-meta"><span>gmgn.ai</span><span></span></div>
        </a>
        <a class="wallet-item" target="_blank" href="https://birdeye.so/profile/${target}?chain=solana" style="text-decoration: none; display: block">
          <div class="wallet-row1">
            <span class="wallet-addr-short">View on Birdeye</span>
            <span class="wallet-amount amount-in">↗</span>
          </div>
          <div class="wallet-meta"><span>birdeye.so</span><span></span></div>
        </a>
      </div>
    </div>
  `;

  // wire up
  $('sidebar').querySelectorAll('[data-addr]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      const addr = el.dataset.addr;
      const node = STATE.nodes.get(addr);
      if (node) {
        STATE.network.focus(addr, { scale: 1.4, animation: { duration: 600 } });
        renderWalletDetail(node);
      }
    });
  });
  $('sidebar').querySelectorAll('[data-copy]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(el.dataset.copy);
      el.textContent = 'Copied!';
      setTimeout(() => el.textContent = 'Copy', 1500);
    });
  });
}

function renderWalletDetail(node) {
  const w = node._data;
  const known = KNOWN_LABELS[w.addr];
  const labels = w.labels || [];
  const isIn = w.in > w.out;

  $('sidebar').innerHTML = `
    <div class="section">
      <div class="section-title">
        <span>← Counterparty</span>
        <button class="copy-btn" id="back-btn">Back to target</button>
      </div>
      <div class="target-card">
        <div class="target-addr">${w.addr} <button class="copy-btn" data-copy="${w.addr}">Copy</button></div>
        ${known ? `<div style="margin-top: 8px; font-size: 13px; color: var(--text-0)"><strong>${known.name}</strong> <span style="color: var(--text-2); text-transform: uppercase; font-size: 10px">· ${known.kind}</span></div>` : ''}
        <div class="tag-row">
          ${labels.map(l => `<span class="tag tag-${l.tag}" title="${l.name}">${l.label}</span>`).join('')}
          ${labels.length === 0 ? '<span class="tag tag-cluster" style="opacity: 0.5">UNLABELED</span>' : ''}
        </div>
        <div class="target-meta">
          <div class="meta-cell"><div class="meta-label">Sent to target</div><div class="meta-value" style="color: var(--accent)">${fmtSOL(w.in)}</div></div>
          <div class="meta-cell"><div class="meta-label">Received from</div><div class="meta-value" style="color: var(--info)">${fmtSOL(w.out)}</div></div>
          <div class="meta-cell"><div class="meta-label">Tx count</div><div class="meta-value">${w.txCount}</div></div>
          <div class="meta-cell"><div class="meta-label">Direction</div><div class="meta-value" style="font-size: 13px">${isIn ? '↓ Inflow' : '↑ Outflow'}</div></div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Why this label?</div>
      <div class="insights">
        ${labels.length === 0 ? '<div class="insight info"><div class="insight-icon">🤷</div><div class="insight-text">No automated label triggered for this wallet. Open it on Solscan or GMGN for deeper inspection.</div></div>' : ''}
        ${labels.map(l => `
          <div class="insight ${l.tag === 'drain' ? 'alert' : (l.tag === 'bundler' ? 'warn' : 'info')}">
            <div class="insight-icon">${l.tag === 'cex' ? '🏦' : l.tag === 'bundler' ? '📦' : l.tag === 'funder' ? '💰' : l.tag === 'drain' ? '🚨' : l.tag === 'protocol' ? '⚙️' : l.tag === 'mev' ? '⚡' : l.tag === 'system' ? '🛠️' : l.tag === 'cluster' ? '🕸️' : '🏷️'}</div>
            <div class="insight-text"><strong>${l.label}</strong> — ${l.name}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Sample Signatures <span class="badge">${w.sigs.length}</span></div>
      <div class="wallet-list">
        ${w.sigs.slice(0, 6).map(s => `
          <a class="wallet-item" target="_blank" href="https://solscan.io/tx/${s}" style="text-decoration: none; display: block">
            <div class="wallet-row1">
              <span class="wallet-addr-short">${shortAddr(s, 6)}</span>
              <span class="wallet-amount amount-in">↗</span>
            </div>
            <div class="wallet-meta"><span>Solscan</span><span>${s.length} chars</span></div>
          </a>
        `).join('')}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Quick Links</div>
      <div class="wallet-list">
        <a class="wallet-item" target="_blank" href="https://solscan.io/account/${w.addr}" style="text-decoration: none; display: block">
          <div class="wallet-row1"><span class="wallet-addr-short">Solscan</span><span class="wallet-amount amount-in">↗</span></div>
          <div class="wallet-meta"><span>Account explorer</span><span></span></div>
        </a>
        <a class="wallet-item" target="_blank" href="https://gmgn.ai/sol/address/${w.addr}" style="text-decoration: none; display: block">
          <div class="wallet-row1"><span class="wallet-addr-short">GMGN</span><span class="wallet-amount amount-in">↗</span></div>
          <div class="wallet-meta"><span>Trade history & PnL</span><span></span></div>
        </a>
        <a class="wallet-item" target="_blank" href="https://birdeye.so/profile/${w.addr}?chain=solana" style="text-decoration: none; display: block">
          <div class="wallet-row1"><span class="wallet-addr-short">Birdeye</span><span class="wallet-amount amount-in">↗</span></div>
          <div class="wallet-meta"><span>Trader dashboard</span><span></span></div>
        </a>
      </div>
    </div>
  `;

  $('back-btn').addEventListener('click', () => {
    renderTargetSidebar(STATE.target, STATE.walletData);
    STATE.network.fit({ animation: { duration: 600 } });
  });
  $('sidebar').querySelectorAll('[data-copy]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(el.dataset.copy);
      el.textContent = 'Copied!';
      setTimeout(() => el.textContent = 'Copy', 1500);
    });
  });
}

// ─────────────────────────────────────────────────────────
// MAIN TRACK FLOW
// ─────────────────────────────────────────────────────────
async function trackWallet(addr) {
  addr = addr.trim();
  if (!isValidSolAddr(addr)) {
    alert('Invalid Solana address. Should be 32-44 base58 characters.');
    return;
  }
  $('btn-track').disabled = true;
  setStatus('Loading…');

  try {
    // Try demo data first (instant, demonstrates capability without RPC delay)
    const demo = await getDemoData(addr);
    if (demo) {
      setStatus('Loading demo cluster…');
      await new Promise(r => setTimeout(r, 400));
      renderGraph(addr, demo.wallets);
      setStatus('', false);
      return;
    }

    // Real RPC path
    setStatus('Fetching signatures…');
    const sigs = await fetchSignatures(addr, TX_FETCH_LIMIT);
    if (!sigs || sigs.length === 0) {
      setStatus('', false);
      alert('No transactions found for this address (or RPC rate-limited). Try a demo address from the header.');
      $('btn-track').disabled = false;
      return;
    }

    setStatus(`Parsing ${Math.min(sigs.length, PARSE_TX_LIMIT)} transactions…`);
    const slice = sigs.slice(0, PARSE_TX_LIMIT);
    const allTransfers = [];

    // batch in parallel waves of 5 (RPC nicety)
    const wave = 5;
    for (let i = 0; i < slice.length; i += wave) {
      const chunk = slice.slice(i, i + wave);
      const txs = await Promise.all(chunk.map(s => fetchTransaction(s.signature).catch(() => null)));
      for (const tx of txs) {
        if (tx) allTransfers.push(...parseTransfers(tx, addr));
      }
      setStatus(`Parsing transactions… ${Math.min(i + wave, slice.length)}/${slice.length}`);
    }

    if (allTransfers.length === 0) {
      setStatus('', false);
      alert('Could not parse transfers from on-chain data. The wallet might only have program calls or be very new. Try a demo address.');
      $('btn-track').disabled = false;
      return;
    }

    setStatus('Building graph…');
    const wallets = aggregateCounterparties(allTransfers, addr);
    renderGraph(addr, wallets);
    setStatus('', false);
  } catch (err) {
    console.error(err);
    setStatus('', false);
    alert('Tracking failed: ' + err.message + '\n\nPublic Solana RPC may be rate-limited. Try a demo address from the header.');
  } finally {
    $('btn-track').disabled = false;
  }
}

// ─────────────────────────────────────────────────────────
// EVENT WIRING
// ─────────────────────────────────────────────────────────
$('btn-track').addEventListener('click', () => {
  trackWallet($('addr-input').value);
});
$('addr-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') trackWallet(e.target.value);
});
$('btn-clear').addEventListener('click', () => {
  $('addr-input').value = '';
  clearGraph();
});
document.querySelectorAll('[data-addr]').forEach(b => {
  b.addEventListener('click', () => {
    const a = b.dataset.addr;
    $('addr-input').value = a;
    trackWallet(a);
  });
});
$('btn-zoom-in').addEventListener('click', () => STATE.network && STATE.network.moveTo({ scale: STATE.network.getScale() * 1.25, animation: { duration: 200 } }));
$('btn-zoom-out').addEventListener('click', () => STATE.network && STATE.network.moveTo({ scale: STATE.network.getScale() * 0.8, animation: { duration: 200 } }));
$('btn-fit').addEventListener('click', () => STATE.network && STATE.network.fit({ animation: { duration: 600 } }));
$('btn-physics').addEventListener('click', (e) => {
  if (!STATE.network) return;
  STATE.physicsOn = !STATE.physicsOn;
  STATE.network.setOptions({ physics: { enabled: STATE.physicsOn } });
  e.currentTarget.classList.toggle('active', STATE.physicsOn);
});
