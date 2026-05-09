import { Node, pingColor } from './types';

// ─── LineChart ────────────────────────────────────────────────────────────────
export function LineChart({ series, colors, width = 320, height = 80, labels }: {
  series: number[][]; colors: string[]; width?: number; height?: number; labels?: string[];
}) {
  const pad = { t: 8, b: 20, l: 28, r: 8 };
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;
  const allVals = series.flat();
  const mn = 0, mx = Math.max(...allVals, 10);
  const toX = (i: number, len: number) => pad.l + (i / (len - 1)) * W;
  const toY = (v: number) => pad.t + H - ((v - mn) / (mx - mn || 1)) * H;
  const yTicks = [0, Math.round(mx * 0.5), Math.round(mx)];

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {yTicks.map(t => (
        <g key={t}>
          <line x1={pad.l} y1={toY(t)} x2={pad.l + W} y2={toY(t)} stroke="#1e2428" strokeWidth="1" />
          <text x={pad.l - 4} y={toY(t) + 3} fontSize="7" fill="#4b5563" textAnchor="end">{t}</text>
        </g>
      ))}
      {['-60s', '-45s', '-30s', '-15s', 'NOW'].map((lbl, i) => (
        <text key={lbl} x={pad.l + (i / 4) * W} y={height - 4} fontSize="7" fill="#4b5563" textAnchor="middle">{lbl}</text>
      ))}
      {series.map((data, si) => {
        if (data.length < 2) return null;
        const pts = data.map((v, i) => `${toX(i, data.length)},${toY(v)}`).join(' ');
        const area = `M${pad.l},${pad.t + H} ` + data.map((v, i) => `L${toX(i, data.length)},${toY(v)}`).join(' ') + ` L${pad.l + W},${pad.t + H} Z`;
        return (
          <g key={si}>
            <path d={area} fill={colors[si]} fillOpacity="0.07" stroke="none" />
            <polyline points={pts} fill="none" stroke={colors[si]} strokeWidth="1.5" strokeLinejoin="round" />
          </g>
        );
      })}
      {labels && labels.map((lbl, i) => (
        <g key={lbl} transform={`translate(${pad.l + i * 80}, ${height - 2})`}>
          <line x1="0" y1="-8" x2="12" y2="-8" stroke={colors[i]} strokeWidth="1.5" />
          <text x="16" y="-5" fontSize="7" fill={colors[i]}>{lbl}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── WorldMap ────────────────────────────────────────────────────────────────
export function WorldMap({ nodes, activeNode, relayNode }: { nodes: Node[]; activeNode: Node | null; relayNode: Node | null }) {
  const youX = 15, youY = 38;

  return (
    <div className="relative w-full overflow-hidden rounded" style={{ height: 220, background: '#060a0c' }}>
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={`${(i + 1) * 10}`} x2="100" y2={`${(i + 1) * 10}`} stroke="#1e3a2f" strokeWidth="0.3" />
        ))}
        {Array.from({ length: 19 }, (_, i) => (
          <line key={`v${i}`} x1={`${(i + 1) * 5}`} y1="0" x2={`${(i + 1) * 5}`} y2="100" stroke="#1e3a2f" strokeWidth="0.3" />
        ))}
      </svg>

      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet">
        <ellipse cx="48" cy="30" rx="5" ry="6" fill="#22c55e" opacity="0.3" />
        <ellipse cx="20" cy="28" rx="8" ry="9" fill="#22c55e" opacity="0.3" />
        <ellipse cx="27" cy="50" rx="5" ry="8" fill="#22c55e" opacity="0.3" />
        <ellipse cx="50" cy="44" rx="5" ry="7" fill="#22c55e" opacity="0.3" />
        <ellipse cx="68" cy="30" rx="14" ry="8" fill="#22c55e" opacity="0.3" />
        <ellipse cx="80" cy="50" rx="5" ry="4" fill="#22c55e" opacity="0.3" />
      </svg>

      {activeNode && relayNode && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d={`M ${youX} ${youY} Q ${(youX + relayNode.x) / 2} ${Math.min(youY, relayNode.y) - 18} ${relayNode.x} ${relayNode.y}`}
            fill="none" stroke="#22c55e" strokeWidth="0.5" strokeOpacity="0.9"
            strokeDasharray="4 2" className="flow-path"
          />
          <path
            d={`M ${relayNode.x} ${relayNode.y} Q ${(relayNode.x + 72) / 2} ${Math.min(relayNode.y, 30) - 12} 72 38`}
            fill="none" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.9"
            strokeDasharray="4 2" className="flow-path"
          />
          <circle cx={youX} cy={youY} r="1.5" fill="#22c55e" />
          <circle cx={youX} cy={youY} r="3" fill="none" stroke="#22c55e" strokeWidth="0.4" opacity="0.4" className="pulse-dot" />
          <circle cx={relayNode.x} cy={relayNode.y} r="1.8" fill="#22c55e" />
          <circle cx={relayNode.x} cy={relayNode.y} r="4" fill="none" stroke="#22c55e" strokeWidth="0.4" opacity="0.4" className="pulse-dot" />
          <circle cx="72" cy="38" r="1.5" fill="#38bdf8" />
        </svg>
      )}

      {nodes.map(node => (
        <div key={node.id} className="absolute" style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%,-50%)' }}>
          <div className="w-2 h-2 rounded-full" style={{ background: pingColor(node.ping), boxShadow: `0 0 4px ${pingColor(node.ping)}` }} />
        </div>
      ))}

      <div className="absolute" style={{ left: `${youX}%`, top: `${youY}%`, transform: 'translate(-50%,-50%)' }}>
        <div className="w-2.5 h-2.5 rounded-full bg-white" style={{ boxShadow: '0 0 6px rgba(255,255,255,0.6)' }} />
      </div>

      <button className="absolute bottom-3 right-3 px-3 py-1.5 text-xs font-medium rounded"
        style={{ background: '#1e2428', color: '#d1d5db', border: '1px solid #252c30' }}>
        SHOW ALL NODES
      </button>
    </div>
  );
}

// ─── Toggle ──────────────────────────────────────────────────────────────────
export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className="relative rounded-full transition-all shrink-0"
      style={{ width: 40, height: 22, background: on ? '#22c55e' : '#1e2428', boxShadow: on ? '0 0 8px rgba(34,197,94,0.4)' : 'none' }}>
      <span className="absolute top-1 rounded-full transition-all"
        style={{ width: 14, height: 14, background: '#fff', left: on ? 22 : 4 }} />
    </button>
  );
}

// ─── Slider ──────────────────────────────────────────────────────────────────
export function Slider({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <input type="range" min={min} max={max} value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-1 rounded-full outline-none cursor-pointer"
      style={{ accentColor: '#22c55e' }} />
  );
}

// ─── Select ──────────────────────────────────────────────────────────────────
export function Select({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded text-xs outline-none"
      style={{ background: '#1a1f22', border: '1px solid #252c30', color: '#d1d5db' }}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}
