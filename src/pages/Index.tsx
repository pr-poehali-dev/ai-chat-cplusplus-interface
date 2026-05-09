import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

// --- Types ---
type BoostMode = 'off' | 'gaming' | 'turbo' | 'latency';
type VpnStatus = 'disconnected' | 'connecting' | 'connected';

interface Server {
  id: string;
  name: string;
  country: string;
  flag: string;
  ping: number;
  load: number;
  game?: string;
}

interface Metric {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
  warn: number;
}

// --- Data ---
const SERVERS: Server[] = [
  { id: 's1', name: 'Frankfurt DE', country: 'Germany',      flag: '🇩🇪', ping: 12,  load: 34, game: 'Warzone' },
  { id: 's2', name: 'London UK',    country: 'UK',           flag: '🇬🇧', ping: 18,  load: 51, game: 'Fortnite' },
  { id: 's3', name: 'Paris FR',     country: 'France',       flag: '🇫🇷', ping: 22,  load: 28 },
  { id: 's4', name: 'Warsaw PL',    country: 'Poland',       flag: '🇵🇱', ping: 9,   load: 19, game: 'Apex' },
  { id: 's5', name: 'Amsterdam NL', country: 'Netherlands',  flag: '🇳🇱', ping: 15,  load: 62 },
  { id: 's6', name: 'Stockholm SE', country: 'Sweden',       flag: '🇸🇪', ping: 31,  load: 41 },
  { id: 's7', name: 'Moscow RU',    country: 'Russia',       flag: '🇷🇺', ping: 44,  load: 55 },
  { id: 's8', name: 'New York US',  country: 'USA',          flag: '🇺🇸', ping: 98,  load: 77, game: 'Warzone' },
];

const MODE_CONFIG: Record<BoostMode, { label: string; color: string; desc: string; icon: string }> = {
  off:     { label: 'OFF',        color: '#444c56', desc: 'Оптимизация выключена',          icon: 'Power' },
  gaming:  { label: 'GAMING',     color: '#58a6ff', desc: 'Баланс FPS и стабильности',       icon: 'Gamepad2' },
  turbo:   { label: 'TURBO',      color: '#bc8cff', desc: 'Максимальный приоритет игры',     icon: 'Zap' },
  latency: { label: 'LOW PING',   color: '#3fb950', desc: 'Минимальная задержка сети',       icon: 'Wifi' },
};

// --- Helpers ---
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(v: number, mn: number, mx: number) { return Math.min(mx, Math.max(mn, v)); }
function pingColor(p: number) {
  if (p < 20) return '#3fb950';
  if (p < 50) return '#d29922';
  return '#f85149';
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// --- Mini graph ---
function SparkLine({ data, color, height = 36 }: { data: number[]; color: string; height?: number }) {
  const w = 120, h = height;
  if (data.length < 2) return null;
  const mn = Math.min(...data), mx = Math.max(...data);
  const range = mx - mn || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - mn) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} className="opacity-80">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={color} fillOpacity="0.08" stroke="none" />
    </svg>
  );
}

// --- Toggle ---
function Toggle({ on, onChange, color = '#58a6ff' }: { on: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative rounded-full transition-all duration-300 shrink-0"
      style={{
        width: 44, height: 24,
        background: on ? color : '#30363d',
        boxShadow: on ? `0 0 8px ${color}66` : 'none',
      }}
    >
      <span className="absolute top-1 rounded-full transition-all duration-300"
        style={{ width: 16, height: 16, background: '#fff', left: on ? 24 : 4 }} />
    </button>
  );
}

// --- Main ---
export default function Index() {
  const [mode, setMode] = useState<BoostMode>('off');
  const [vpnStatus, setVpnStatus] = useState<VpnStatus>('disconnected');
  const [selectedServer, setSelectedServer] = useState<Server>(SERVERS[3]);
  const [activeServer, setActiveServer] = useState<Server | null>(null);
  const [time, setTime] = useState(new Date());

  // Simulated live metrics
  const [fps, setFps]         = useState(87);
  const [ping, setPing]       = useState(44);
  const [cpu, setCpu]         = useState(61);
  const [ram, setRam]         = useState(58);
  const [gpu, setGpu]         = useState(72);
  const [download, setDownload] = useState(34);
  const [packetLoss, setPacketLoss] = useState(2.1);

  // Histories
  const [fpsHistory, setFpsHistory]   = useState<number[]>(Array(30).fill(87));
  const [pingHistory, setPingHistory] = useState<number[]>(Array(30).fill(44));
  const [cpuHistory, setCpuHistory]   = useState<number[]>(Array(30).fill(61));

  // Features
  const [features, setFeatures] = useState({
    tcpOptimize: true,
    dnsBoost:    true,
    qosGaming:   false,
    antiLag:     true,
    packetPrio:  false,
    autoRoute:   true,
    killSwitch:  false,
    splitTunnel: true,
  });

  const targetFps  = useRef(87);
  const targetPing = useRef(44);
  const targetCpu  = useRef(61);

  // Live simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());

      const boost = mode === 'turbo' ? 1.3 : mode === 'gaming' ? 1.15 : mode === 'latency' ? 1.05 : 1;
      const pingBoost = mode === 'latency' ? 0.55 : mode === 'turbo' ? 0.7 : mode === 'gaming' ? 0.8 : 1;
      const connected = vpnStatus === 'connected';

      targetFps.current  = clamp(targetFps.current  + (Math.random() - 0.45) * 6, 45, 165) * (connected ? boost : 1);
      targetPing.current = clamp(targetPing.current + (Math.random() - 0.5) * 4, 5, 120) * (connected ? pingBoost * (activeServer ? activeServer.ping / 44 : 1) : 1);
      targetCpu.current  = clamp(targetCpu.current  + (Math.random() - 0.5) * 3, 20, 98);

      setFps(v  => Math.round(lerp(v, targetFps.current, 0.3)));
      setPing(v => Math.round(lerp(v, targetPing.current, 0.25)));
      setCpu(v  => Math.round(lerp(v, targetCpu.current, 0.2)));
      setRam(v  => clamp(v + (Math.random() - 0.5) * 1.5, 30, 95));
      setGpu(v  => clamp(v + (Math.random() - 0.5) * 2.5, 40, 99));
      setDownload(v => clamp(v + (Math.random() - 0.5) * 3, 10, 100));
      setPacketLoss(v => clamp(v + (Math.random() - 0.6) * 0.3, 0, connected && features.antiLag ? 1.5 : 8));

      setFpsHistory(h  => [...h.slice(-29), Math.round(lerp(h[h.length-1], targetFps.current, 0.3))]);
      setPingHistory(h => [...h.slice(-29), Math.round(lerp(h[h.length-1], targetPing.current, 0.25))]);
      setCpuHistory(h  => [...h.slice(-29), Math.round(lerp(h[h.length-1], targetCpu.current, 0.2))]);
    }, 600);
    return () => clearInterval(interval);
  }, [mode, vpnStatus, activeServer, features.antiLag]);

  const handleVpn = () => {
    if (vpnStatus === 'disconnected') {
      setVpnStatus('connecting');
      setTimeout(() => {
        setVpnStatus('connected');
        setActiveServer(selectedServer);
        targetPing.current = selectedServer.ping * (mode === 'latency' ? 0.55 : 0.75);
        targetFps.current  = fps * (mode === 'turbo' ? 1.25 : 1.1);
      }, 2200);
    } else if (vpnStatus === 'connected') {
      setVpnStatus('disconnected');
      setActiveServer(null);
      targetPing.current = 44;
    }
  };

  const setFeature = (k: keyof typeof features, v: boolean) =>
    setFeatures(prev => ({ ...prev, [k]: v }));

  const vpnColor = vpnStatus === 'connected' ? '#3fb950' : vpnStatus === 'connecting' ? '#d29922' : '#f85149';
  const modeColor = MODE_CONFIG[mode].color;

  return (
    <div className="min-h-screen font-sans select-none" style={{ background: '#080c10', color: '#c9d1d9' }}>
      {/* Scanline overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)' }} />

      <div className="relative z-10 max-w-[1200px] mx-auto p-4">

        {/* ── HEADER ── */}
        <header className="flex items-center justify-between mb-5 py-3 px-5 rounded-xl"
          style={{ background: '#0d1117', border: '1px solid #21262d' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${modeColor}33, ${modeColor}11)`, border: `1px solid ${modeColor}44` }}>
              <Icon name="Zap" size={18} style={{ color: modeColor }} />
            </div>
            <div>
              <div className="font-bold text-sm tracking-widest" style={{ color: '#e6edf3', fontFamily: 'JetBrains Mono, monospace' }}>
                NOVABOOST <span style={{ color: modeColor }}>v2.6</span>
              </div>
              <div className="text-xs tracking-wider" style={{ color: '#484f58', fontFamily: 'JetBrains Mono, monospace' }}>
                GAME OPTIMIZER · NEURAL CORE
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Status pills */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: vpnColor }} />
              <span className="text-xs font-mono" style={{ color: vpnColor }}>
                VPN {vpnStatus === 'connected' ? `· ${activeServer?.name}` : vpnStatus.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: modeColor }} />
              <span className="text-xs font-mono" style={{ color: modeColor }}>{MODE_CONFIG[mode].label}</span>
            </div>
            <div className="text-xs font-mono" style={{ color: '#484f58' }}>{fmtTime(time)}</div>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-4">

          {/* ── LEFT COLUMN ── */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">

            {/* BOOST MODE */}
            <div className="rounded-xl p-4" style={{ background: '#0d1117', border: '1px solid #21262d' }}>
              <div className="text-xs font-mono tracking-widest mb-3" style={{ color: '#484f58' }}>[ РЕЖИМ БУСТА ]</div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(MODE_CONFIG) as [BoostMode, typeof MODE_CONFIG[BoostMode]][]).map(([key, cfg]) => (
                  <button key={key} onClick={() => setMode(key)}
                    className="flex flex-col items-start gap-1 p-3 rounded-lg transition-all"
                    style={{
                      background: mode === key ? `${cfg.color}18` : '#161b22',
                      border: `1px solid ${mode === key ? cfg.color + '66' : '#21262d'}`,
                      boxShadow: mode === key ? `0 0 14px ${cfg.color}22` : 'none',
                    }}>
                    <div className="flex items-center gap-2 w-full">
                      <Icon name={cfg.icon as string} size={14} style={{ color: cfg.color }} fallback="Zap" />
                      <span className="text-xs font-mono font-bold" style={{ color: mode === key ? cfg.color : '#8b949e' }}>
                        {cfg.label}
                      </span>
                      {mode === key && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />}
                    </div>
                    <span className="text-xs leading-tight" style={{ color: '#484f58', fontSize: '10px' }}>{cfg.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* VPN PANEL */}
            <div className="rounded-xl p-4" style={{ background: '#0d1117', border: '1px solid #21262d' }}>
              <div className="text-xs font-mono tracking-widest mb-3" style={{ color: '#484f58' }}>[ VPN МАРШРУТ ]</div>

              <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto pr-1">
                {SERVERS.map(srv => (
                  <button key={srv.id} onClick={() => { if (vpnStatus !== 'connected') setSelectedServer(srv); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left"
                    style={{
                      background: (activeServer?.id ?? selectedServer.id) === srv.id ? '#1c2128' : 'transparent',
                      border: `1px solid ${(activeServer?.id ?? selectedServer.id) === srv.id ? '#30363d' : 'transparent'}`,
                      opacity: vpnStatus === 'connected' && activeServer?.id !== srv.id ? 0.5 : 1,
                    }}>
                    <span className="text-base">{srv.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: '#c9d1d9' }}>{srv.name}</div>
                      {srv.game && <div className="text-xs" style={{ color: '#484f58', fontSize: '10px' }}>{srv.game} сервер</div>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: '#21262d' }}>
                        <div className="h-full rounded-full" style={{ width: `${srv.load}%`, background: srv.load > 70 ? '#f85149' : srv.load > 50 ? '#d29922' : '#3fb950' }} />
                      </div>
                      <span className="text-xs font-mono w-10 text-right" style={{ color: pingColor(srv.ping) }}>{srv.ping}ms</span>
                    </div>
                  </button>
                ))}
              </div>

              <button onClick={handleVpn} disabled={vpnStatus === 'connecting'}
                className="w-full py-2.5 rounded-lg font-mono font-bold text-sm tracking-widest transition-all"
                style={{
                  background: vpnStatus === 'connected' ? '#f8514922' : vpnStatus === 'connecting' ? '#d2992222' : '#3fb95022',
                  color: vpnColor,
                  border: `1px solid ${vpnColor}55`,
                  boxShadow: vpnStatus === 'connected' ? `0 0 16px #3fb95033` : 'none',
                }}>
                {vpnStatus === 'connecting' ? '⟳ ПОДКЛЮЧЕНИЕ...' : vpnStatus === 'connected' ? '◼ ОТКЛЮЧИТЬ VPN' : '▶ ПОДКЛЮЧИТЬ VPN'}
              </button>
            </div>

            {/* FEATURES */}
            <div className="rounded-xl p-4" style={{ background: '#0d1117', border: '1px solid #21262d' }}>
              <div className="text-xs font-mono tracking-widest mb-3" style={{ color: '#484f58' }}>[ ОПТИМИЗАЦИИ ]</div>
              <div className="space-y-2.5">
                {([
                  { key: 'tcpOptimize', label: 'TCP Optimize',   color: '#58a6ff', desc: 'Ускорение TCP стека' },
                  { key: 'dnsBoost',    label: 'DNS Boost',      color: '#58a6ff', desc: 'Быстрый DNS резолвер' },
                  { key: 'qosGaming',   label: 'QoS Gaming',     color: '#bc8cff', desc: 'Приоритет игрового трафика' },
                  { key: 'antiLag',     label: 'Anti-Lag',       color: '#3fb950', desc: 'Компенсация задержек' },
                  { key: 'packetPrio',  label: 'Packet Priority',color: '#bc8cff', desc: 'Умная очерёдность пакетов' },
                  { key: 'autoRoute',   label: 'Auto Route',     color: '#58a6ff', desc: 'Оптимальный маршрут' },
                  { key: 'killSwitch',  label: 'Kill Switch',    color: '#f85149', desc: 'Блок трафика без VPN' },
                  { key: 'splitTunnel', label: 'Split Tunnel',   color: '#d29922', desc: 'Туннель только для игр' },
                ] as { key: keyof typeof features; label: string; color: string; desc: string }[]).map(f => (
                  <div key={f.key} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono font-medium" style={{ color: features[f.key] ? '#c9d1d9' : '#484f58' }}>{f.label}</div>
                      <div className="text-xs" style={{ color: '#484f58', fontSize: '10px' }}>{f.desc}</div>
                    </div>
                    <Toggle on={features[f.key]} onChange={v => setFeature(f.key, v)} color={f.color} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">

            {/* BIG METRICS ROW */}
            <div className="grid grid-cols-4 gap-3">
              {([
                { label: 'FPS',      value: fps,         unit: '',    color: fps > 100 ? '#3fb950' : fps > 60 ? '#d29922' : '#f85149', history: fpsHistory,  max: 165 },
                { label: 'ПИНГ',     value: ping,        unit: 'ms',  color: pingColor(ping),                                           history: pingHistory, max: 120 },
                { label: 'CPU',      value: cpu,         unit: '%',   color: cpu > 85 ? '#f85149' : cpu > 65 ? '#d29922' : '#58a6ff',  history: cpuHistory,  max: 100 },
                { label: 'ПОТЕРИ',   value: packetLoss,  unit: '%',   color: packetLoss > 3 ? '#f85149' : packetLoss > 1 ? '#d29922' : '#3fb950', history: [], max: 10 },
              ]).map(m => (
                <div key={m.label} className="rounded-xl p-4 flex flex-col gap-2"
                  style={{ background: '#0d1117', border: `1px solid ${m.color}33` }}>
                  <div className="text-xs font-mono tracking-widest" style={{ color: '#484f58' }}>{m.label}</div>
                  <div className="font-mono font-bold" style={{ color: m.color, fontSize: '28px', lineHeight: 1 }}>
                    {m.label === 'ПОТЕРИ' ? m.value.toFixed(1) : m.value}
                    <span className="text-sm ml-1" style={{ color: '#484f58' }}>{m.unit}</span>
                  </div>
                  <div className="w-full h-1 rounded-full" style={{ background: '#21262d' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${clamp((m.value / m.max) * 100, 0, 100)}%`, background: m.color }} />
                  </div>
                  {m.history.length > 0 && <SparkLine data={m.history} color={m.color} />}
                </div>
              ))}
            </div>

            {/* SYSTEM STATS */}
            <div className="rounded-xl p-4" style={{ background: '#0d1117', border: '1px solid #21262d' }}>
              <div className="text-xs font-mono tracking-widest mb-4" style={{ color: '#484f58' }}>[ СИСТЕМНЫЕ РЕСУРСЫ ]</div>
              <div className="grid grid-cols-3 gap-4">
                {([
                  { label: 'GPU Load', value: gpu,      unit: '%',    color: gpu > 90 ? '#f85149' : '#bc8cff' },
                  { label: 'RAM',      value: ram,      unit: '%',    color: ram > 85 ? '#f85149' : '#58a6ff' },
                  { label: 'Сеть',     value: download, unit: 'Mb/s', color: '#3fb950' },
                ] as Metric[]).map(m => (
                  <div key={m.label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs font-mono" style={{ color: '#8b949e' }}>{m.label}</span>
                      <span className="text-xs font-mono font-bold" style={{ color: m.color }}>
                        {m.label === 'Сеть' ? m.value.toFixed(1) : Math.round(m.value)}{m.unit}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#161b22' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${m.label === 'Сеть' ? (m.value / 100) * 100 : m.value}%`,
                          background: `linear-gradient(90deg, ${m.color}88, ${m.color})`,
                        }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ACTIVE SERVER STATUS */}
            <div className="rounded-xl p-4" style={{ background: '#0d1117', border: '1px solid #21262d' }}>
              <div className="text-xs font-mono tracking-widest mb-3" style={{ color: '#484f58' }}>[ СТАТУС МАРШРУТА ]</div>
              {vpnStatus === 'connected' && activeServer ? (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs mb-1" style={{ color: '#484f58' }}>Сервер</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{activeServer.flag}</span>
                      <div>
                        <div className="text-sm font-medium" style={{ color: '#e6edf3' }}>{activeServer.name}</div>
                        <div className="text-xs" style={{ color: '#3fb950' }}>● Подключено</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: '#484f58' }}>Пинг до сервера</div>
                    <div className="font-mono font-bold text-2xl" style={{ color: pingColor(activeServer.ping) }}>
                      {activeServer.ping}<span className="text-sm ml-1" style={{ color: '#484f58' }}>ms</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: '#484f58' }}>Загрузка узла</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#21262d' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${activeServer.load}%`, background: activeServer.load > 70 ? '#f85149' : '#3fb950' }} />
                      </div>
                      <span className="text-xs font-mono" style={{ color: '#8b949e' }}>{activeServer.load}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: vpnStatus === 'connecting' ? '#d29922' : '#f85149' }} />
                  <span className="text-sm font-mono" style={{ color: '#484f58' }}>
                    {vpnStatus === 'connecting' ? 'Устанавливается соединение...' : 'VPN не подключён — выберите сервер и нажмите ПОДКЛЮЧИТЬ VPN'}
                  </span>
                </div>
              )}
            </div>

            {/* QUICK PRESETS */}
            <div className="rounded-xl p-4" style={{ background: '#0d1117', border: '1px solid #21262d' }}>
              <div className="text-xs font-mono tracking-widest mb-3" style={{ color: '#484f58' }}>[ БЫСТРЫЕ ПРЕСЕТЫ ]</div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: 'Warzone',  icon: '🎯', mode: 'turbo'   as BoostMode, server: SERVERS[0] },
                  { name: 'Fortnite', icon: '🏗️', mode: 'gaming'  as BoostMode, server: SERVERS[1] },
                  { name: 'Apex',     icon: '🔥', mode: 'turbo'   as BoostMode, server: SERVERS[3] },
                  { name: 'CS2',      icon: '💣', mode: 'latency' as BoostMode, server: SERVERS[3] },
                ].map(p => (
                  <button key={p.name}
                    onClick={() => { setMode(p.mode); if (vpnStatus !== 'connected') setSelectedServer(p.server); }}
                    className="flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-all"
                    style={{ background: '#161b22', border: '1px solid #21262d' }}>
                    <span className="text-2xl">{p.icon}</span>
                    <span className="text-xs font-mono font-medium" style={{ color: '#8b949e' }}>{p.name}</span>
                    <span className="text-xs rounded px-1.5 py-0.5 font-mono"
                      style={{ background: `${MODE_CONFIG[p.mode].color}22`, color: MODE_CONFIG[p.mode].color, fontSize: '9px' }}>
                      {MODE_CONFIG[p.mode].label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-4 flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono" style={{ color: '#30363d' }}>NOVABOOST v2.6 · NEURAL CORE ACTIVE</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono" style={{ color: '#30363d' }}>
              FPS AVG: <span style={{ color: modeColor }}>{Math.round(fpsHistory.reduce((a,b) => a+b,0)/fpsHistory.length)}</span>
            </span>
            <span className="text-xs font-mono" style={{ color: '#30363d' }}>
              UPTIME: <span style={{ color: '#484f58' }}>{fmtTime(time)}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
