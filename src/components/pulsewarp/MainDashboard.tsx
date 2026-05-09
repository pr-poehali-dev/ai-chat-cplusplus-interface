import { Node, ConnStatus, pingColor } from './types';
import { WorldMap } from './PulseWidgets';
import Icon from '@/components/ui/icon';

// ─── ActiveRoute + Map ───────────────────────────────────────────────────────
function ActiveRouteMap({ relayNode, activeNode, conn, ping }: {
  relayNode: Node; activeNode: Node | null; conn: ConnStatus; ping: number;
}) {
  return (
    <div className="col-span-9 md:col-span-7 flex flex-col gap-3">
      <div className="rounded p-4" style={{ background: '#0c0f11', border: '1px solid var(--pw-border)' }}>
        <div className="text-xs font-bold tracking-widest mb-3" style={{ color: '#9ca3af' }}>ACTIVE ROUTE</div>
        <div className="flex items-center justify-between mb-4">
          {/* YOU */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded flex items-center justify-center"
              style={{ background: '#1a1f22', border: '1px solid var(--pw-border2)' }}>
              <Icon name="Monitor" size={20} style={{ color: '#9ca3af' }} />
            </div>
            <div className="text-xs text-center" style={{ color: '#6b7280' }}>192.168.1.100</div>
          </div>
          {/* Arrow YOU → RELAY */}
          <div className="flex-1 flex items-center px-2">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #22c55e, #22c55e88)' }} />
            <div className="w-2 h-2 border-r-2 border-t-2 rotate-45 shrink-0" style={{ borderColor: '#22c55e', marginLeft: -4 }} />
          </div>
          {/* RELAY NODE */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="text-xs font-bold tracking-widest mb-1" style={{ color: '#6b7280' }}>RELAY NODE</div>
            <div className="w-10 h-10 rounded flex items-center justify-center"
              style={{ background: '#0f1a13', border: '1px solid #22c55e55' }}>
              <Icon name="Server" size={18} style={{ color: '#22c55e' }} />
            </div>
            <div className="text-xs text-center" style={{ color: '#22c55e' }}>{relayNode.name}</div>
          </div>
          {/* Arrow RELAY → SERVER */}
          <div className="flex-1 flex items-center px-2">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #22c55e88, #38bdf888)' }} />
            <div className="w-2 h-2 border-r-2 border-t-2 rotate-45 shrink-0" style={{ borderColor: '#38bdf8', marginLeft: -4 }} />
          </div>
          {/* GAME SERVER */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="text-xs font-bold tracking-widest mb-1" style={{ color: '#6b7280' }}>GAME SERVER</div>
            <div className="w-10 h-10 rounded flex items-center justify-center"
              style={{ background: '#0f1620', border: '1px solid #38bdf855' }}>
              <Icon name="Database" size={18} style={{ color: '#38bdf8' }} />
            </div>
            <div className="text-xs text-center" style={{ color: '#38bdf8' }}>93.184.216.34:27015</div>
          </div>
        </div>
        <WorldMap nodes={[]} activeNode={activeNode} relayNode={activeNode} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: 'PING',        value: conn === 'connected' ? String(ping)       : '--', unit: 'ms',   color: pingColor(ping) },
          { label: 'JITTER',      value: conn === 'connected' ? '12'               : '--', unit: 'ms',   color: '#38bdf8' },
          { label: 'PACKET LOSS', value: conn === 'connected' ? '0.2'              : '--', unit: '%',    color: '#22c55e' },
          { label: 'THROUGHPUT',  value: conn === 'connected' ? '245'              : '--', unit: 'Mbps', color: '#9ca3af' },
          { label: 'STABILITY',   value: conn === 'connected' ? '98'               : '--', unit: '%',    color: '#22c55e' },
        ].map(m => (
          <div key={m.label} className="rounded p-3" style={{ background: '#0c0f11', border: '1px solid var(--pw-border)' }}>
            <div className="text-xs tracking-wider mb-1" style={{ color: '#374151' }}>{m.label}</div>
            <div className="flex items-end gap-1">
              <span className="font-bold text-xl font-mono" style={{ color: m.color }}>{m.value}</span>
              <span className="text-xs mb-0.5" style={{ color: '#4b5563' }}>{m.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Bottom row ───────────────────────────────────────────────────────────────
function BrandPanel() {
  return (
    <div className="col-span-9 md:col-span-2 rounded p-4 flex flex-col justify-between"
      style={{ background: 'linear-gradient(160deg, #0a0f0c 60%, #0f1a12)', border: '1px solid #1e3a2a', minHeight: 220 }}>
      <div>
        <div className="font-bold text-sm leading-tight" style={{ color: '#fff' }}>PULSEWARP</div>
        <div className="font-bold text-sm" style={{ color: '#22c55e' }}>NEXUS X</div>
        <div className="text-xs mt-2 leading-relaxed" style={{ color: '#4b5563' }}>
          THE ULTIMATE<br />NETWORK OPTIMIZER<br />FOR GAMERS
        </div>
      </div>
      <div className="flex items-center justify-center flex-1 py-4">
        <svg viewBox="0 0 60 60" width="70" height="70">
          <defs>
            <linearGradient id="xgrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#166534" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <line x1="8" y1="8" x2="52" y2="52" stroke="url(#xgrad)" strokeWidth="5" strokeLinecap="round" />
          <line x1="52" y1="8" x2="8" y2="52" stroke="url(#xgrad)" strokeWidth="5" strokeLinecap="round" />
          <circle cx="30" cy="30" r="18" fill="none" stroke="#22c55e" strokeWidth="0.5" opacity="0.3" />
          <circle cx="30" cy="30" r="28" fill="none" stroke="#22c55e" strokeWidth="0.3" opacity="0.15" />
        </svg>
      </div>
    </div>
  );
}

function FeaturesPanel() {
  const features = [
    { icon: 'Route',    title: 'SMART ROUTING',       desc: 'Find the best path to game servers' },
    { icon: 'Layers',   title: 'PACKET OPTIMIZATION', desc: 'Advanced loss recovery & compression' },
    { icon: 'Globe',    title: 'MULTI-NODE NETWORK',  desc: 'Hundreds of nodes worldwide' },
    { icon: 'Shield',   title: 'STABLE CONNECTION',   desc: 'Adaptive control & real-time monitoring' },
    { icon: 'Wifi',     title: 'LOW LATENCY',         desc: 'Reduce ping and improve hit reg' },
    { icon: 'Gamepad2', title: 'BUILT FOR GAMING',    desc: 'Designed for competitive gamers' },
  ];
  return (
    <div className="col-span-9 md:col-span-3 rounded p-4" style={{ background: '#0c0f11', border: '1px solid var(--pw-border)' }}>
      <div className="font-bold text-sm mb-1" style={{ color: '#fff' }}>PULSEWARP NEXUS X</div>
      <div className="text-xs tracking-widest mb-4" style={{ color: '#4b5563' }}>DOMINATE EVERY CONNECTION</div>
      <div className="grid grid-cols-2 gap-3">
        {features.map(f => (
          <div key={f.title} className="flex gap-2">
            <div className="w-7 h-7 rounded flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: '#22c55e18', border: '1px solid #22c55e33' }}>
              <Icon name={f.icon as string} size={13} style={{ color: '#22c55e' }} fallback="Circle" />
            </div>
            <div>
              <div className="font-bold" style={{ color: '#9ca3af', fontSize: '10px' }}>{f.title}</div>
              <div className="leading-snug" style={{ color: '#374151', fontSize: '10px' }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RouteDetails({ relayNode, protocol }: { relayNode: Node; protocol: string }) {
  const rows = [
    ['RELAY NODE',  relayNode.name],
    ['LOCATION',    `${relayNode.city}, ${relayNode.country}`],
    ['DISTANCE',    '1421 km'],
    ['HOP COUNT',   '2'],
    ['PROTOCOL',    protocol],
    ['ENCRYPTION',  'AES-256-GCM'],
  ];
  return (
    <div className="col-span-9 md:col-span-2 rounded p-4" style={{ background: '#0c0f11', border: '1px solid var(--pw-border)' }}>
      <div className="text-xs font-bold tracking-widest mb-3" style={{ color: '#9ca3af' }}>ROUTE DETAILS</div>
      <div className="space-y-2 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 py-1" style={{ borderBottom: '1px solid var(--pw-border)' }}>
            <span style={{ color: '#4b5563' }}>{k}</span>
            <span style={{ color: '#9ca3af' }}>{v}</span>
          </div>
        ))}
      </div>
      {/* Mini route diagram */}
      <div className="mt-3 pt-3 flex items-center gap-1" style={{ borderTop: '1px solid var(--pw-border)' }}>
        <div className="flex flex-col items-center gap-1">
          <Icon name="Monitor" size={16} style={{ color: '#6b7280' }} />
          <span style={{ color: '#374151', fontSize: '9px' }}>YOU</span>
        </div>
        <div className="flex-1 flex items-center">
          <div className="flex-1 h-px" style={{ background: '#22c55e55' }} />
          <span style={{ color: '#22c55e', fontSize: '9px', padding: '0 4px' }}>{relayNode.ping}ms</span>
          <div className="flex-1 h-px" style={{ background: '#22c55e55' }} />
        </div>
        <div className="flex flex-col items-center gap-1">
          <Icon name="Server" size={16} style={{ color: '#22c55e' }} />
          <span style={{ color: '#374151', fontSize: '9px' }}>RELAY</span>
        </div>
        <div className="flex-1 h-px" style={{ background: '#38bdf855' }} />
        <div className="flex flex-col items-center gap-1">
          <Icon name="Database" size={16} style={{ color: '#38bdf8' }} />
          <span style={{ color: '#374151', fontSize: '9px' }}>SERVER</span>
        </div>
      </div>
    </div>
  );
}

// ─── MainDashboard ────────────────────────────────────────────────────────────
interface MainDashboardProps {
  relayNode: Node; activeNode: Node | null; conn: ConnStatus;
  ping: number; protocol: string;
}

export default function MainDashboard({ relayNode, activeNode, conn, ping, protocol }: MainDashboardProps) {
  return (
    <div className="col-span-12 xl:col-span-9 grid grid-cols-9 gap-3">
      {/* Top: Connection panel slot is rendered in Index, here we only render the 7-col right part */}
      <ActiveRouteMap relayNode={relayNode} activeNode={activeNode} conn={conn} ping={ping} />

      {/* Bottom row */}
      <BrandPanel />
      <FeaturesPanel />
      <RouteDetails relayNode={relayNode} protocol={protocol} />
    </div>
  );
}
