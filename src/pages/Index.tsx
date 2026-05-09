import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '@/components/ui/icon';

// ─── Types ───────────────────────────────────────────────────────────────────
type TabId = 'dashboard' | 'nodes' | 'routes' | 'statistics' | 'settings';
type ConnStatus = 'disconnected' | 'connecting' | 'connected';
type SettingsTab = 'GENERAL' | 'CONNECTION' | 'PROTOCOL' | 'ADVANCED' | 'ABOUT';

interface Node {
  id: string; name: string; city: string; country: string;
  flag: string; ping: number;
  x: number; y: number; // % on map
}

// ─── Static data ─────────────────────────────────────────────────────────────
const NODES: Node[] = [
  { id:'fra03', name:'Frankfurt-03', city:'Frankfurt', country:'Germany',     flag:'🇩🇪', ping:23,  x:48.5, y:32 },
  { id:'ams02', name:'Amsterdam-02', city:'Amsterdam', country:'Netherlands', flag:'🇳🇱', ping:28,  x:46,   y:29 },
  { id:'war01', name:'Warsaw-01',    city:'Warsaw',    country:'Poland',      flag:'🇵🇱', ping:31,  x:52,   y:28 },
  { id:'lon04', name:'London-04',    city:'London',    country:'UK',          flag:'🇬🇧', ping:35,  x:43,   y:27 },
  { id:'nyc05', name:'New York-05',  city:'New York',  country:'USA',         flag:'🇺🇸', ping:62,  x:21,   y:31 },
  { id:'sao02', name:'São Paulo-02', city:'São Paulo', country:'Brazil',      flag:'🇧🇷', ping:78,  x:28,   y:62 },
  { id:'sgp01', name:'Singapore-01', city:'Singapore', country:'Singapore',   flag:'🇸🇬', ping:112, x:75,   y:55 },
  { id:'tyo01', name:'Tokyo-01',     city:'Tokyo',     country:'Japan',       flag:'🇯🇵', ping:130, x:82,   y:33 },
];

const GAMES = ['Counter-Strike 2','Valorant','Apex Legends','Warzone','Fortnite','PUBG','Battlefield 2042'];
const SERVERS_LIST = ['Official DS #15','Official DS #07','Community #3','Ranked EU #2','Faceit EU #1'];
const PROTOCOLS = ['PulseWarp Core v7','PulseWarp Core v6','WireGuard','OpenVPN'];
const REGIONS = ['Europe','North America','Asia Pacific','South America','Auto'];

function pingColor(p: number) {
  if (p <= 40)  return '#22c55e';
  if (p <= 80)  return '#eab308';
  return '#ef4444';
}
function clamp(v:number,mn:number,mx:number){return Math.min(mx,Math.max(mn,v));}
function lerp(a:number,b:number,t:number){return a+(b-a)*t;}
function pad2(n:number){return String(n).padStart(2,'0');}

// ─── Mini SVG chart ──────────────────────────────────────────────────────────
function LineChart({ series, colors, width=320, height=80, labels }:{
  series: number[][]; colors: string[]; width?:number; height?:number; labels?:string[];
}) {
  const pad = { t:8, b:20, l:28, r:8 };
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;
  const allVals = series.flat();
  const mn = 0, mx = Math.max(...allVals, 10);
  const toX = (i:number, len:number) => pad.l + (i/(len-1))*W;
  const toY = (v:number) => pad.t + H - ((v-mn)/(mx-mn||1))*H;

  const yTicks = [0, Math.round(mx*0.5), Math.round(mx)];

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {/* Grid */}
      {yTicks.map(t => (
        <g key={t}>
          <line x1={pad.l} y1={toY(t)} x2={pad.l+W} y2={toY(t)} stroke="#1e2428" strokeWidth="1"/>
          <text x={pad.l-4} y={toY(t)+3} fontSize="7" fill="#4b5563" textAnchor="end">{t}</text>
        </g>
      ))}
      {/* X labels */}
      {['-60s','-45s','-30s','-15s','NOW'].map((lbl,i) => (
        <text key={lbl} x={pad.l + (i/4)*W} y={height-4} fontSize="7" fill="#4b5563" textAnchor="middle">{lbl}</text>
      ))}
      {/* Lines */}
      {series.map((data, si) => {
        if (data.length < 2) return null;
        const pts = data.map((v,i) => `${toX(i,data.length)},${toY(v)}`).join(' ');
        const area = `M${pad.l},${pad.t+H} ` + data.map((v,i) => `L${toX(i,data.length)},${toY(v)}`).join(' ') + ` L${pad.l+W},${pad.t+H} Z`;
        return (
          <g key={si}>
            <path d={area} fill={colors[si]} fillOpacity="0.07" stroke="none"/>
            <polyline points={pts} fill="none" stroke={colors[si]} strokeWidth="1.5" strokeLinejoin="round"/>
          </g>
        );
      })}
      {/* Legend */}
      {labels && labels.map((lbl,i) => (
        <g key={lbl} transform={`translate(${pad.l + i*80}, ${height-2})`}>
          <line x1="0" y1="-8" x2="12" y2="-8" stroke={colors[i]} strokeWidth="1.5"/>
          <text x="16" y="-5" fontSize="7" fill={colors[i]}>{lbl}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── World Map with nodes ────────────────────────────────────────────────────
function WorldMap({ nodes, activeNode, relayNode }:{nodes:Node[]; activeNode:Node|null; relayNode:Node|null}) {
  const youX = 15, youY = 38; // approx user location %

  return (
    <div className="relative w-full overflow-hidden rounded" style={{ height: 220, background: '#060a0c' }}>
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
        {Array.from({length:9},(_,i)=>(
          <line key={`h${i}`} x1="0" y1={`${(i+1)*10}`} x2="100" y2={`${(i+1)*10}`} stroke="#1e3a2f" strokeWidth="0.3"/>
        ))}
        {Array.from({length:19},(_,i)=>(
          <line key={`v${i}`} x1={`${(i+1)*5}`} y1="0" x2={`${(i+1)*5}`} y2="100" stroke="#1e3a2f" strokeWidth="0.3"/>
        ))}
      </svg>

      {/* World map silhouette (simplified SVG continents) */}
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet">
        {/* Europe */}
        <ellipse cx="48" cy="30" rx="5" ry="6" fill="#22c55e" opacity="0.3"/>
        {/* North America */}
        <ellipse cx="20" cy="28" rx="8" ry="9" fill="#22c55e" opacity="0.3"/>
        {/* South America */}
        <ellipse cx="27" cy="50" rx="5" ry="8" fill="#22c55e" opacity="0.3"/>
        {/* Africa */}
        <ellipse cx="50" cy="44" rx="5" ry="7" fill="#22c55e" opacity="0.3"/>
        {/* Asia */}
        <ellipse cx="68" cy="30" rx="14" ry="8" fill="#22c55e" opacity="0.3"/>
        {/* Australia */}
        <ellipse cx="80" cy="50" rx="5" ry="4" fill="#22c55e" opacity="0.3"/>
      </svg>

      {/* Connection arcs */}
      {activeNode && relayNode && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* You → Relay */}
          <path
            d={`M ${youX} ${youY} Q ${(youX+relayNode.x)/2} ${Math.min(youY,relayNode.y)-18} ${relayNode.x} ${relayNode.y}`}
            fill="none" stroke="#22c55e" strokeWidth="0.5" strokeOpacity="0.9"
            strokeDasharray="4 2" className="flow-path"
          />
          {/* Relay → Server */}
          <path
            d={`M ${relayNode.x} ${relayNode.y} Q ${(relayNode.x+72)/2} ${Math.min(relayNode.y,30)-12} 72 38`}
            fill="none" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.9"
            strokeDasharray="4 2" className="flow-path"
          />
          {/* Glow circles */}
          <circle cx={youX} cy={youY} r="1.5" fill="#22c55e"/>
          <circle cx={youX} cy={youY} r="3" fill="none" stroke="#22c55e" strokeWidth="0.4" opacity="0.4" className="pulse-dot"/>
          <circle cx={relayNode.x} cy={relayNode.y} r="1.8" fill="#22c55e"/>
          <circle cx={relayNode.x} cy={relayNode.y} r="4" fill="none" stroke="#22c55e" strokeWidth="0.4" opacity="0.4" className="pulse-dot"/>
          <circle cx="72" cy="38" r="1.5" fill="#38bdf8"/>
        </svg>
      )}

      {/* Node dots */}
      {nodes.map(node => (
        <div key={node.id} className="absolute" style={{ left:`${node.x}%`, top:`${node.y}%`, transform:'translate(-50%,-50%)' }}>
          <div className="w-2 h-2 rounded-full" style={{ background: pingColor(node.ping), boxShadow:`0 0 4px ${pingColor(node.ping)}` }}/>
        </div>
      ))}

      {/* YOU dot */}
      <div className="absolute" style={{ left:`${youX}%`, top:`${youY}%`, transform:'translate(-50%,-50%)' }}>
        <div className="w-2.5 h-2.5 rounded-full bg-white" style={{ boxShadow:'0 0 6px rgba(255,255,255,0.6)' }}/>
      </div>

      {/* SHOW ALL NODES button */}
      <button className="absolute bottom-3 right-3 px-3 py-1.5 text-xs font-medium rounded"
        style={{ background:'#1e2428', color:'#d1d5db', border:'1px solid #252c30' }}>
        SHOW ALL NODES
      </button>
    </div>
  );
}

// ─── Toggle ──────────────────────────────────────────────────────────────────
function Toggle({ on, onChange }:{on:boolean; onChange:(v:boolean)=>void}) {
  return (
    <button onClick={()=>onChange(!on)} className="relative rounded-full transition-all shrink-0"
      style={{ width:40, height:22, background: on ? '#22c55e' : '#1e2428', boxShadow: on ? '0 0 8px rgba(34,197,94,0.4)' : 'none' }}>
      <span className="absolute top-1 rounded-full transition-all" style={{ width:14, height:14, background:'#fff', left: on ? 22 : 4 }}/>
    </button>
  );
}

// ─── Slider ──────────────────────────────────────────────────────────────────
function Slider({ value, onChange, min, max }:{value:number; onChange:(v:number)=>void; min:number; max:number}) {
  return (
    <input type="range" min={min} max={max} value={value}
      onChange={e=>onChange(Number(e.target.value))}
      className="w-full h-1 rounded-full outline-none cursor-pointer"
      style={{ accentColor:'#22c55e' }}/>
  );
}

// ─── Select ──────────────────────────────────────────────────────────────────
function Select({ value, options, onChange }:{value:string; options:string[]; onChange:(v:string)=>void}) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      className="w-full px-3 py-2 rounded text-xs outline-none"
      style={{ background:'#1a1f22', border:'1px solid #252c30', color:'#d1d5db' }}>
      {options.map(o=><option key={o}>{o}</option>)}
    </select>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function Index() {
  const [tab, setTab]           = useState<TabId>('dashboard');
  const [conn, setConn]         = useState<ConnStatus>('disconnected');
  const [relayNode, setRelayNode]   = useState<Node>(NODES[0]);
  const [activeNode, setActiveNode] = useState<Node|null>(null);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('GENERAL');

  // Settings state
  const [autoSelect, setAutoSelect]   = useState(true);
  const [protocol, setProtocol]       = useState(PROTOCOLS[0]);
  const [region, setRegion]           = useState(REGIONS[0]);
  const [maxPing, setMaxPing]         = useState(100);
  const [maxLoss, setMaxLoss]         = useState(5);
  const [selectedGame, setSelectedGame]   = useState(GAMES[0]);
  const [selectedServer, setSelectedServer] = useState(SERVERS_LIST[0]);

  // Live metrics
  const [ping, setPing]         = useState(23);
  const [jitter, setJitter]     = useState(12);
  const [loss, setLoss]         = useState(0.2);
  const [throughput, setThroughput] = useState(245);
  const [stability, setStability]   = useState(98);
  const [sessionSec, setSessionSec] = useState(0);

  // Chart histories (60 points = 60s)
  const [pingH, setPingH]     = useState<number[]>(Array(60).fill(23));
  const [jitterH, setJitterH] = useState<number[]>(Array(60).fill(12));
  const [lossH, setLossH]     = useState<number[]>(Array(60).fill(0.2));

  const targetPing   = useRef(23);
  const targetJitter = useRef(12);
  const targetLoss   = useRef(0.2);

  useEffect(() => {
    const t = setInterval(() => {
      if (conn !== 'connected') return;
      setSessionSec(s => s+1);

      targetPing.current   = clamp(targetPing.current   + (Math.random()-0.45)*4, 8, 90);
      targetJitter.current = clamp(targetJitter.current + (Math.random()-0.5)*2,  2, 40);
      targetLoss.current   = clamp(targetLoss.current   + (Math.random()-0.6)*0.15, 0, 4);

      const np = Math.round(lerp(ping, targetPing.current, 0.3));
      const nj = Math.round(lerp(jitter, targetJitter.current, 0.3));
      const nl = parseFloat(lerp(loss, targetLoss.current, 0.3).toFixed(1));
      const nt = clamp(throughput + (Math.random()-0.4)*8, 180, 320);
      const ns = clamp(stability  + (Math.random()-0.45)*0.8, 88, 100);

      setPing(np); setJitter(nj); setLoss(nl);
      setThroughput(Math.round(nt)); setStability(Math.round(ns));
      setPingH(h   => [...h.slice(-59), np]);
      setJitterH(h => [...h.slice(-59), nj]);
      setLossH(h   => [...h.slice(-59), nl]);
    }, 1000);
    return () => clearInterval(t);
  }, [conn, ping, jitter, loss, throughput, stability]);

  const handleConnect = () => {
    if (conn === 'disconnected') {
      setConn('connecting');
      setTimeout(() => { setConn('connected'); setActiveNode(relayNode); setSessionSec(0); }, 2000);
    } else if (conn === 'connected') {
      setConn('disconnected'); setActiveNode(null); setSessionSec(0);
    }
  };

  const sessionTime = `${pad2(Math.floor(sessionSec/3600))}:${pad2(Math.floor((sessionSec%3600)/60))}:${pad2(sessionSec%60)}`;

  const TABS: {id:TabId; label:string; icon:string}[] = [
    {id:'dashboard',  label:'DASHBOARD',   icon:'LayoutDashboard'},
    {id:'nodes',      label:'NODES',       icon:'Circle'},
    {id:'routes',     label:'ROUTES',      icon:'Route'},
    {id:'statistics', label:'STATISTICS',  icon:'BarChart2'},
    {id:'settings',   label:'SETTINGS',    icon:'Settings'},
  ];

  const connColor = conn==='connected' ? '#22c55e' : conn==='connecting' ? '#eab308' : '#ef4444';

  return (
    <div className="min-h-screen text-sm" style={{ background:'var(--pw-bg)', color:'var(--pw-text)', fontFamily:'IBM Plex Sans, Inter, sans-serif' }}>

      {/* ── TOP NAV ── */}
      <header style={{ background:'#0c0f11', borderBottom:'1px solid var(--pw-border)' }}>
        <div className="max-w-[1400px] mx-auto flex items-center px-4 py-0" style={{ height:52 }}>
          {/* Logo */}
          <div className="flex items-center gap-2 mr-8">
            <div className="w-8 h-8 flex items-center justify-center">
              <svg viewBox="0 0 32 32" width="28" height="28">
                <polygon points="16,2 30,10 30,22 16,30 2,22 2,10" fill="none" stroke="#22c55e" strokeWidth="1.5"/>
                <polygon points="16,8 24,13 24,19 16,24 8,19 8,13" fill="#22c55e" fillOpacity="0.15"/>
                <text x="16" y="20" textAnchor="middle" fontSize="9" fill="#22c55e" fontWeight="bold">PW</text>
              </svg>
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide" style={{ color:'#fff', lineHeight:1.2 }}>PULSEWARP</div>
              <div className="text-xs font-bold tracking-widest" style={{ color:'#22c55e', lineHeight:1.2 }}>NEXUS X</div>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex items-center gap-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-4 py-3 text-xs font-medium tracking-widest transition-all relative"
                style={{ color: tab===t.id ? '#22c55e' : '#6b7280' }}>
                <Icon name={t.icon as string} size={13} fallback="Circle"/>
                {t.label}
                {tab===t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background:'#22c55e' }}/>}
              </button>
            ))}
          </nav>

          {/* Window controls */}
          <div className="ml-auto flex items-center gap-2">
            <button className="w-3.5 h-3.5 rounded-full" style={{ background:'#374151' }}/>
            <button className="w-3.5 h-3.5 rounded-full" style={{ background:'#374151' }}/>
            <button className="w-3.5 h-3.5 rounded-full" style={{ background:'#ef4444' }}/>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-3 grid grid-cols-12 gap-3">

        {/* ══ MAIN CONTENT (left 9 cols) ════════════════════════════════════ */}
        <div className="col-span-12 xl:col-span-9 grid grid-cols-9 gap-3">

          {/* ── CONNECTION panel (left 2 cols) ── */}
          <div className="col-span-9 md:col-span-2 flex flex-col gap-3">
            <div className="rounded p-4 flex flex-col gap-3" style={{ background:'#0c0f11', border:'1px solid var(--pw-border)' }}>
              <div className="text-xs font-bold tracking-widest" style={{ color:'#9ca3af' }}>CONNECTION</div>
              <div>
                <div className="text-xs font-medium" style={{ color:'#22c55e' }}>
                  {conn==='connected' ? 'OPTIMIZED' : conn==='connecting' ? 'CONNECTING...' : 'DISCONNECTED'}
                </div>
                <div className="flex items-end gap-1 mt-1">
                  <span className="font-bold text-3xl" style={{ color:connColor, fontFamily:'monospace', lineHeight:1 }}>
                    {conn==='connected' ? ping : '--'}
                  </span>
                  <span className="text-xs mb-1" style={{ color:'#6b7280' }}>ms</span>
                </div>
                <div className="text-xs uppercase tracking-wider mt-0.5" style={{ color:'#374151' }}>PING</div>
                {/* Sparkline */}
                <div className="mt-2" style={{ height:32 }}>
                  <svg width="100%" viewBox="0 0 120 32" preserveAspectRatio="none">
                    {pingH.length>1 && (() => {
                      const mn=Math.min(...pingH), mx=Math.max(...pingH,mn+1);
                      const pts=pingH.map((v,i)=>`${(i/(pingH.length-1))*120},${32-((v-mn)/(mx-mn))*28}`).join(' ');
                      return <polyline points={pts} fill="none" stroke="#22c55e" strokeWidth="1.2" strokeLinejoin="round" opacity="0.8"/>;
                    })()}
                  </svg>
                </div>
              </div>

              <div className="space-y-2 pt-1" style={{ borderTop:'1px solid var(--pw-border)' }}>
                {[
                  { label:'PACKET LOSS', value: conn==='connected' ? `${loss.toFixed(1)} %` : '-- %', color: loss>2 ? '#ef4444' : '#22c55e' },
                  { label:'JITTER',      value: conn==='connected' ? `${jitter} ms`            : '-- ms', color:'#22c55e' },
                ].map(m=>(
                  <div key={m.label} className="pt-2" style={{ borderTop:'1px solid var(--pw-border)' }}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background:m.color }}/>
                      <span className="font-bold text-lg" style={{ color:m.color, fontFamily:'monospace' }}>{m.value}</span>
                    </div>
                    <div className="text-xs tracking-wider mt-0.5" style={{ color:'#374151' }}>{m.label}</div>
                  </div>
                ))}
              </div>

              <div className="pt-2 space-y-2" style={{ borderTop:'1px solid var(--pw-border)' }}>
                <div>
                  <div className="text-xs tracking-wider" style={{ color:'#374151' }}>PROTOCOL</div>
                  <div className="text-xs mt-0.5" style={{ color:'#9ca3af' }}>{protocol}</div>
                </div>
                <div>
                  <div className="text-xs tracking-wider" style={{ color:'#374151' }}>SESSION TIME</div>
                  <div className="text-xs font-mono mt-0.5" style={{ color:'#9ca3af' }}>{sessionTime}</div>
                </div>
              </div>

              <button onClick={handleConnect} disabled={conn==='connecting'}
                className="w-full py-2.5 rounded text-xs font-bold tracking-widest transition-all mt-1"
                style={{
                  background: conn==='connected' ? 'transparent' : '#22c55e22',
                  color: conn==='connected' ? '#ef4444' : conn==='connecting' ? '#eab308' : '#22c55e',
                  border: `1px solid ${conn==='connected' ? '#ef444455' : conn==='connecting' ? '#eab30855' : '#22c55e55'}`,
                }}>
                {conn==='connected' ? 'DISCONNECT' : conn==='connecting' ? 'CONNECTING...' : 'CONNECT'}
              </button>
            </div>
          </div>

          {/* ── ACTIVE ROUTE + MAP (7 cols) ── */}
          <div className="col-span-9 md:col-span-7 flex flex-col gap-3">

            {/* Active Route header */}
            <div className="rounded p-4" style={{ background:'#0c0f11', border:'1px solid var(--pw-border)' }}>
              <div className="text-xs font-bold tracking-widest mb-3" style={{ color:'#9ca3af' }}>ACTIVE ROUTE</div>
              <div className="flex items-center justify-between mb-4">
                {/* YOU */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background:'#1a1f22', border:'1px solid var(--pw-border2)' }}>
                    <Icon name="Monitor" size={20} style={{ color:'#9ca3af' }}/>
                  </div>
                  <div className="text-xs text-center" style={{ color:'#6b7280' }}>192.168.1.100</div>
                </div>
                {/* Arrow */}
                <div className="flex-1 flex items-center px-2">
                  <div className="flex-1 h-px" style={{ background:'linear-gradient(90deg, #22c55e, #22c55e88)' }}/>
                  <div className="w-2 h-2 border-r-2 border-t-2 rotate-45 shrink-0" style={{ borderColor:'#22c55e', marginLeft:-4 }}/>
                </div>
                {/* Relay Node */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="text-xs font-bold tracking-widest mb-1" style={{ color:'#6b7280' }}>RELAY NODE</div>
                  <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background:'#0f1a13', border:'1px solid #22c55e55' }}>
                    <Icon name="Server" size={18} style={{ color:'#22c55e' }}/>
                  </div>
                  <div className="text-xs text-center" style={{ color:'#22c55e' }}>{relayNode.name}</div>
                </div>
                {/* Arrow */}
                <div className="flex-1 flex items-center px-2">
                  <div className="flex-1 h-px" style={{ background:'linear-gradient(90deg, #22c55e88, #38bdf888)' }}/>
                  <div className="w-2 h-2 border-r-2 border-t-2 rotate-45 shrink-0" style={{ borderColor:'#38bdf8', marginLeft:-4 }}/>
                </div>
                {/* Game Server */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="text-xs font-bold tracking-widest mb-1" style={{ color:'#6b7280' }}>GAME SERVER</div>
                  <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background:'#0f1620', border:'1px solid #38bdf855' }}>
                    <Icon name="Database" size={18} style={{ color:'#38bdf8' }}/>
                  </div>
                  <div className="text-xs text-center" style={{ color:'#38bdf8' }}>93.184.216.34:27015</div>
                </div>
              </div>

              {/* Map */}
              <WorldMap nodes={NODES} activeNode={activeNode} relayNode={activeNode}/>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-5 gap-2">
              {[
                { label:'PING',        value: conn==='connected'?ping:'--',         unit:'ms',   color: pingColor(ping) },
                { label:'JITTER',      value: conn==='connected'?jitter:'--',       unit:'ms',   color:'#38bdf8' },
                { label:'PACKET LOSS', value: conn==='connected'?loss.toFixed(1):'--', unit:'%', color: loss>2?'#ef4444':'#22c55e' },
                { label:'THROUGHPUT',  value: conn==='connected'?throughput:'--',   unit:'Mbps', color:'#9ca3af' },
                { label:'STABILITY',   value: conn==='connected'?stability:'--',    unit:'%',    color:'#22c55e' },
              ].map(m=>(
                <div key={m.label} className="rounded p-3" style={{ background:'#0c0f11', border:'1px solid var(--pw-border)' }}>
                  <div className="text-xs tracking-wider mb-1" style={{ color:'#374151' }}>{m.label}</div>
                  <div className="flex items-end gap-1">
                    <span className="font-bold text-xl font-mono" style={{ color:m.color }}>{m.value}</span>
                    <span className="text-xs mb-0.5" style={{ color:'#4b5563' }}>{m.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── BOTTOM ROW ── */}
          {/* Brand panel */}
          <div className="col-span-9 md:col-span-2 rounded p-4 flex flex-col justify-between"
            style={{ background:'linear-gradient(160deg, #0a0f0c 60%, #0f1a12)', border:'1px solid #1e3a2a', minHeight:220 }}>
            <div>
              <div className="font-bold text-sm leading-tight" style={{ color:'#fff' }}>PULSEWARP</div>
              <div className="font-bold text-sm" style={{ color:'#22c55e' }}>NEXUS X</div>
              <div className="text-xs mt-2 leading-relaxed" style={{ color:'#4b5563' }}>
                THE ULTIMATE<br/>NETWORK OPTIMIZER<br/>FOR GAMERS
              </div>
            </div>
            {/* X logo */}
            <div className="flex items-center justify-center flex-1 py-4">
              <svg viewBox="0 0 60 60" width="70" height="70">
                <defs>
                  <linearGradient id="xgrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9"/>
                    <stop offset="100%" stopColor="#166534" stopOpacity="0.3"/>
                  </linearGradient>
                </defs>
                <line x1="8" y1="8" x2="52" y2="52" stroke="url(#xgrad)" strokeWidth="5" strokeLinecap="round"/>
                <line x1="52" y1="8" x2="8" y2="52" stroke="url(#xgrad)" strokeWidth="5" strokeLinecap="round"/>
                <circle cx="30" cy="30" r="18" fill="none" stroke="#22c55e" strokeWidth="0.5" opacity="0.3"/>
                <circle cx="30" cy="30" r="28" fill="none" stroke="#22c55e" strokeWidth="0.3" opacity="0.15"/>
              </svg>
            </div>
          </div>

          {/* Features */}
          <div className="col-span-9 md:col-span-3 rounded p-4" style={{ background:'#0c0f11', border:'1px solid var(--pw-border)' }}>
            <div className="font-bold text-sm mb-1" style={{ color:'#fff' }}>PULSEWARP NEXUS X</div>
            <div className="text-xs tracking-widest mb-4" style={{ color:'#4b5563' }}>DOMINATE EVERY CONNECTION</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon:'Route',        title:'SMART ROUTING',       desc:'Find the best path to game servers' },
                { icon:'Layers',       title:'PACKET OPTIMIZATION', desc:'Advanced loss recovery & compression' },
                { icon:'Globe',        title:'MULTI-NODE NETWORK',  desc:'Hundreds of nodes worldwide' },
                { icon:'Shield',       title:'STABLE CONNECTION',   desc:'Adaptive control & real-time monitoring' },
                { icon:'Wifi',         title:'LOW LATENCY',         desc:'Reduce ping and improve hit reg' },
                { icon:'Gamepad2',     title:'BUILT FOR GAMING',    desc:'Designed for competitive gamers' },
              ].map(f=>(
                <div key={f.title} className="flex gap-2">
                  <div className="w-7 h-7 rounded flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background:'#22c55e18', border:'1px solid #22c55e33' }}>
                    <Icon name={f.icon as string} size={13} style={{ color:'#22c55e' }} fallback="Circle"/>
                  </div>
                  <div>
                    <div className="text-xs font-bold" style={{ color:'#9ca3af', fontSize:'10px' }}>{f.title}</div>
                    <div className="text-xs leading-snug" style={{ color:'#374151', fontSize:'10px' }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Route details */}
          <div className="col-span-9 md:col-span-2 rounded p-4" style={{ background:'#0c0f11', border:'1px solid var(--pw-border)' }}>
            <div className="text-xs font-bold tracking-widest mb-3" style={{ color:'#9ca3af' }}>ROUTE DETAILS</div>
            <div className="space-y-2 text-xs">
              {[
                ['RELAY NODE',  relayNode.name],
                ['LOCATION',    `${relayNode.city}, ${relayNode.country}`],
                ['DISTANCE',    '1421 km'],
                ['HOP COUNT',   '2'],
                ['PROTOCOL',    protocol],
                ['ENCRYPTION',  'AES-256-GCM'],
              ].map(([k,v])=>(
                <div key={k} className="flex justify-between gap-2 py-1" style={{ borderBottom:'1px solid var(--pw-border)' }}>
                  <span style={{ color:'#4b5563' }}>{k}</span>
                  <span style={{ color:'#9ca3af' }}>{v}</span>
                </div>
              ))}
            </div>
            {/* Mini route diagram */}
            <div className="mt-3 pt-3 flex items-center gap-1" style={{ borderTop:'1px solid var(--pw-border)' }}>
              <div className="flex flex-col items-center gap-1">
                <Icon name="Monitor" size={16} style={{ color:'#6b7280' }}/>
                <span className="text-xs" style={{ color:'#374151', fontSize:'9px' }}>YOU</span>
              </div>
              <div className="flex-1 flex items-center">
                <div className="flex-1 h-px" style={{ background:'#22c55e55' }}/>
                <div className="px-1">
                  <span className="text-xs" style={{ color:'#22c55e', fontSize:'9px' }}>{conn==='connected'?`${ping}ms`:'--'}</span>
                </div>
                <div className="flex-1 h-px" style={{ background:'#22c55e55' }}/>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Icon name="Server" size={16} style={{ color:'#22c55e' }}/>
                <span className="text-xs" style={{ color:'#374151', fontSize:'9px' }}>RELAY</span>
              </div>
              <div className="flex-1 h-px" style={{ background:'#38bdf855' }}/>
              <div className="flex flex-col items-center gap-1">
                <Icon name="Database" size={16} style={{ color:'#38bdf8' }}/>
                <span className="text-xs" style={{ color:'#374151', fontSize:'9px' }}>SERVER</span>
              </div>
            </div>
          </div>

        </div>

        {/* ══ RIGHT COLUMN (3 cols) ═════════════════════════════════════════ */}
        <div className="col-span-12 xl:col-span-3 flex flex-col gap-3">

          {/* NODES MAP */}
          <div className="rounded p-4" style={{ background:'#0c0f11', border:'1px solid var(--pw-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold tracking-widest" style={{ color:'#9ca3af' }}>NODES MAP</div>
              <button style={{ color:'#374151' }}><Icon name="RefreshCw" size={13}/></button>
            </div>
            {/* Table */}
            <div className="flex justify-between text-xs mb-2" style={{ color:'#374151' }}>
              <span>NODE</span><span>PING</span>
            </div>
            <div className="space-y-1.5">
              {NODES.map(node=>(
                <button key={node.id} onClick={()=>{ if(conn!=='connected'){ setRelayNode(node); }}}
                  className="w-full flex items-center justify-between py-1 px-1 rounded transition-all"
                  style={{ background: relayNode.id===node.id ? '#22c55e11' : 'transparent' }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background:pingColor(node.ping) }}/>
                    <span className="text-xs" style={{ color: relayNode.id===node.id ? '#22c55e' : '#9ca3af' }}>{node.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold" style={{ color:pingColor(node.ping) }}>{node.ping} ms</span>
                </button>
              ))}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3 mt-3 pt-2" style={{ borderTop:'1px solid var(--pw-border)' }}>
              {[['#22c55e','BEST'],['#eab308','GOOD'],['#ef4444','POOR']].map(([c,l])=>(
                <div key={l} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ background:c }}/>
                  <span className="text-xs" style={{ color:'#4b5563', fontSize:'10px' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* REAL-TIME TRAFFIC */}
          <div className="rounded p-4" style={{ background:'#0c0f11', border:'1px solid var(--pw-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold tracking-widest" style={{ color:'#9ca3af' }}>REAL-TIME TRAFFIC</div>
              <div className="text-xs px-2 py-0.5 rounded" style={{ background:'#1a1f22', color:'#6b7280', border:'1px solid var(--pw-border)' }}>Last 60 sec</div>
            </div>
            <LineChart
              series={[pingH, jitterH, lossH]}
              colors={['#22c55e','#38bdf8','#ef4444']}
              labels={['PING (ms)','JITTER (ms)','LOSS (%)']}
              width={320} height={100}
            />
          </div>

          {/* SETTINGS */}
          <div className="rounded p-4 flex-1" style={{ background:'#0c0f11', border:'1px solid var(--pw-border)' }}>
            <div className="text-xs font-bold tracking-widest mb-3" style={{ color:'#9ca3af' }}>SETTINGS</div>
            <div className="flex gap-3">
              {/* Settings tabs */}
              <div className="flex flex-col gap-0.5 shrink-0">
                {(['GENERAL','CONNECTION','PROTOCOL','ADVANCED','ABOUT'] as SettingsTab[]).map(t=>(
                  <button key={t} onClick={()=>setSettingsTab(t)}
                    className="text-left text-xs px-2 py-1.5 rounded transition-all whitespace-nowrap"
                    style={{ color: settingsTab===t ? '#22c55e' : '#6b7280', background: settingsTab===t ? '#22c55e11' : 'transparent' }}>
                    {t}
                  </button>
                ))}
              </div>
              {/* Settings content */}
              <div className="flex-1 space-y-4">
                {settingsTab === 'GENERAL' && (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-medium" style={{ color:'#9ca3af' }}>AUTO SELECT NODE</div>
                        <div className="text-xs" style={{ color:'#374151', fontSize:'10px' }}>Automatically select the best node</div>
                      </div>
                      <Toggle on={autoSelect} onChange={setAutoSelect}/>
                    </div>
                    <div>
                      <div className="text-xs font-medium mb-1.5" style={{ color:'#9ca3af' }}>PROTOCOL MODE</div>
                      <Select value={protocol} options={PROTOCOLS} onChange={setProtocol}/>
                    </div>
                    <div>
                      <div className="text-xs font-medium mb-1.5" style={{ color:'#9ca3af' }}>PREFERRED REGION</div>
                      <Select value={region} options={REGIONS} onChange={setRegion}/>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color:'#9ca3af' }}>MAX PING</span>
                        <span style={{ color:'#22c55e' }}>{maxPing} ms</span>
                      </div>
                      <Slider value={maxPing} onChange={setMaxPing} min={20} max={300}/>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color:'#9ca3af' }}>MAX LOSS</span>
                        <span style={{ color:'#22c55e' }}>{maxLoss} %</span>
                      </div>
                      <Slider value={maxLoss} onChange={setMaxLoss} min={0} max={20}/>
                    </div>
                    <button className="w-full py-2 rounded text-xs font-bold tracking-widest transition-all"
                      style={{ background:'#22c55e', color:'#000' }}>
                      APPLY SETTINGS
                    </button>
                  </>
                )}
                {settingsTab !== 'GENERAL' && (
                  <div className="text-xs" style={{ color:'#374151' }}>Раздел «{settingsTab}» в разработке</div>
                )}
              </div>
            </div>
          </div>

          {/* QUICK CONNECT */}
          <div className="rounded p-4" style={{ background:'#0c0f11', border:'1px solid var(--pw-border)' }}>
            <div className="text-xs font-bold tracking-widest mb-3" style={{ color:'#9ca3af' }}>QUICK CONNECT</div>
            <div className="space-y-2">
              <div>
                <div className="text-xs mb-1" style={{ color:'#4b5563' }}>GAME</div>
                <Select value={selectedGame} options={GAMES} onChange={setSelectedGame}/>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color:'#4b5563' }}>SERVER</div>
                <Select value={selectedServer} options={SERVERS_LIST} onChange={setSelectedServer}/>
              </div>
              <button onClick={handleConnect} disabled={conn==='connecting'}
                className="w-full py-2.5 rounded text-xs font-bold tracking-widest transition-all"
                style={{ background: conn==='connected' ? '#22c55e33' : '#22c55e', color: conn==='connected' ? '#22c55e' : '#000' }}>
                {conn==='connected' ? 'CONNECTED ✓' : conn==='connecting' ? 'CONNECTING...' : 'CONNECT'}
              </button>
            </div>
            <div className="mt-3 pt-3" style={{ borderTop:'1px solid var(--pw-border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs tracking-widest" style={{ color:'#4b5563' }}>RECENT CONNECTIONS</span>
              </div>
              <div className="space-y-1.5">
                {NODES.slice(0,4).map(n=>(
                  <div key={n.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background:pingColor(n.ping) }}/>
                      <span className="text-xs" style={{ color:'#6b7280' }}>{n.name}</span>
                    </div>
                    <span className="text-xs font-mono font-bold" style={{ color:pingColor(n.ping) }}>{n.ping} ms</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
