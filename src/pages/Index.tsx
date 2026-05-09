import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

import {
  NODES, GAMES, SERVERS_LIST, PROTOCOLS, REGIONS,
  type TabId, type ConnStatus, type SettingsTab, type Node,
  clamp, lerp, pad2,
} from '@/components/pulsewarp/types';
import ConnectionPanel from '@/components/pulsewarp/ConnectionPanel';
import MainDashboard   from '@/components/pulsewarp/MainDashboard';
import RightPanel      from '@/components/pulsewarp/RightPanel';

export default function Index() {
  const [tab, setTab]                 = useState<TabId>('dashboard');
  const [conn, setConn]               = useState<ConnStatus>('disconnected');
  const [relayNode, setRelayNode]     = useState<Node>(NODES[0]);
  const [activeNode, setActiveNode]   = useState<Node | null>(null);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('GENERAL');

  // Settings
  const [autoSelect,     setAutoSelect]     = useState(true);
  const [protocol,       setProtocol]       = useState(PROTOCOLS[0]);
  const [region,         setRegion]         = useState(REGIONS[0]);
  const [maxPing,        setMaxPing]        = useState(100);
  const [maxLoss,        setMaxLoss]        = useState(5);
  const [selectedGame,   setSelectedGame]   = useState(GAMES[0]);
  const [selectedServer, setSelectedServer] = useState(SERVERS_LIST[0]);

  // Live metrics
  const [ping,       setPing]       = useState(23);
  const [jitter,     setJitter]     = useState(12);
  const [loss,       setLoss]       = useState(0.2);
  const [sessionSec, setSessionSec] = useState(0);

  // Chart histories
  const [pingH,   setPingH]   = useState<number[]>(Array(60).fill(23));
  const [jitterH, setJitterH] = useState<number[]>(Array(60).fill(12));
  const [lossH,   setLossH]   = useState<number[]>(Array(60).fill(0.2));

  const tPing   = useRef(23);
  const tJitter = useRef(12);
  const tLoss   = useRef(0.2);

  useEffect(() => {
    const t = setInterval(() => {
      if (conn !== 'connected') return;
      setSessionSec(s => s + 1);

      tPing.current   = clamp(tPing.current   + (Math.random() - 0.45) * 4, 8, 90);
      tJitter.current = clamp(tJitter.current + (Math.random() - 0.5)  * 2, 2, 40);
      tLoss.current   = clamp(tLoss.current   + (Math.random() - 0.6)  * 0.15, 0, 4);

      const np = Math.round(lerp(ping,   tPing.current,   0.3));
      const nj = Math.round(lerp(jitter, tJitter.current, 0.3));
      const nl = parseFloat(lerp(loss,   tLoss.current,   0.3).toFixed(1));

      setPing(np); setJitter(nj); setLoss(nl);
      setPingH(h   => [...h.slice(-59), np]);
      setJitterH(h => [...h.slice(-59), nj]);
      setLossH(h   => [...h.slice(-59), nl]);
    }, 1000);
    return () => clearInterval(t);
  }, [conn, ping, jitter, loss]);

  const handleConnect = () => {
    if (conn === 'disconnected') {
      setConn('connecting');
      setTimeout(() => {
        setConn('connected');
        setActiveNode(relayNode);
        setSessionSec(0);
        tPing.current = relayNode.ping;
      }, 2000);
    } else if (conn === 'connected') {
      setConn('disconnected');
      setActiveNode(null);
      setSessionSec(0);
    }
  };

  const sessionTime = `${pad2(Math.floor(sessionSec / 3600))}:${pad2(Math.floor((sessionSec % 3600) / 60))}:${pad2(sessionSec % 60)}`;

  const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: 'dashboard',  label: 'DASHBOARD',  icon: 'LayoutDashboard' },
    { id: 'nodes',      label: 'NODES',      icon: 'Circle' },
    { id: 'routes',     label: 'ROUTES',     icon: 'Route' },
    { id: 'statistics', label: 'STATISTICS', icon: 'BarChart2' },
    { id: 'settings',   label: 'SETTINGS',   icon: 'Settings' },
  ];

  return (
    <div className="min-h-screen text-sm"
      style={{ background: 'var(--pw-bg)', color: 'var(--pw-text)', fontFamily: 'IBM Plex Sans, Inter, sans-serif' }}>

      {/* ── TOP NAV ── */}
      <header style={{ background: '#0c0f11', borderBottom: '1px solid var(--pw-border)' }}>
        <div className="max-w-[1400px] mx-auto flex items-center px-4" style={{ height: 52 }}>
          {/* Logo */}
          <div className="flex items-center gap-2 mr-8">
            <div className="w-8 h-8 flex items-center justify-center">
              <svg viewBox="0 0 32 32" width="28" height="28">
                <polygon points="16,2 30,10 30,22 16,30 2,22 2,10" fill="none" stroke="#22c55e" strokeWidth="1.5" />
                <polygon points="16,8 24,13 24,19 16,24 8,19 8,13" fill="#22c55e" fillOpacity="0.15" />
                <text x="16" y="20" textAnchor="middle" fontSize="9" fill="#22c55e" fontWeight="bold">PW</text>
              </svg>
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide" style={{ color: '#fff', lineHeight: 1.2 }}>PULSEWARP</div>
              <div className="text-xs font-bold tracking-widest" style={{ color: '#22c55e', lineHeight: 1.2 }}>NEXUS X</div>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex items-center gap-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-4 py-3 text-xs font-medium tracking-widest transition-all relative"
                style={{ color: tab === t.id ? '#22c55e' : '#6b7280' }}>
                <Icon name={t.icon as string} size={13} fallback="Circle" />
                {t.label}
                {tab === t.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#22c55e' }} />
                )}
              </button>
            ))}
          </nav>

          {/* Window controls */}
          <div className="ml-auto flex items-center gap-2">
            <button className="w-3.5 h-3.5 rounded-full" style={{ background: '#374151' }} />
            <button className="w-3.5 h-3.5 rounded-full" style={{ background: '#374151' }} />
            <button className="w-3.5 h-3.5 rounded-full" style={{ background: '#ef4444' }} />
          </div>
        </div>
      </header>

      {/* ── BODY GRID ── */}
      <div className="max-w-[1400px] mx-auto p-3 grid grid-cols-12 gap-3">

        {/* Left 9 cols: Connection (2) + ActiveRoute/Map/Stats (7) + bottom row */}
        <div className="col-span-12 xl:col-span-9 grid grid-cols-9 gap-3">

          {/* CONNECTION panel */}
          <ConnectionPanel
            conn={conn}
            ping={ping}
            jitter={jitter}
            loss={loss}
            protocol={protocol}
            sessionTime={sessionTime}
            pingHistory={pingH}
            onConnect={handleConnect}
          />

          {/* ActiveRoute + Map + stats row + bottom row */}
          <MainDashboard
            relayNode={relayNode}
            activeNode={activeNode}
            conn={conn}
            ping={ping}
            protocol={protocol}
          />
        </div>

        {/* Right 3 cols: NodesMap + Traffic + Settings + QuickConnect */}
        <RightPanel
          nodes={NODES}
          relayNode={relayNode}
          conn={conn}
          onSelectNode={setRelayNode}
          pingH={pingH}
          jitterH={jitterH}
          lossH={lossH}
          settingsTab={settingsTab}
          setSettingsTab={setSettingsTab}
          autoSelect={autoSelect}
          setAutoSelect={setAutoSelect}
          protocol={protocol}
          setProtocol={setProtocol}
          region={region}
          setRegion={setRegion}
          maxPing={maxPing}
          setMaxPing={setMaxPing}
          maxLoss={maxLoss}
          setMaxLoss={setMaxLoss}
          selectedGame={selectedGame}
          setSelectedGame={setSelectedGame}
          selectedServer={selectedServer}
          setSelectedServer={setSelectedServer}
          onConnect={handleConnect}
        />
      </div>
    </div>
  );
}
