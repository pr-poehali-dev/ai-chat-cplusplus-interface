import { Node, ConnStatus, SettingsTab, pingColor, GAMES, SERVERS_LIST, PROTOCOLS, REGIONS } from './types';
import { LineChart, Toggle, Slider, Select } from './PulseWidgets';
import Icon from '@/components/ui/icon';

// ─── NodesMap ────────────────────────────────────────────────────────────────
function NodesMap({ nodes, relayNode, conn, onSelectNode }: {
  nodes: Node[]; relayNode: Node; conn: ConnStatus;
  onSelectNode: (n: Node) => void;
}) {
  return (
    <div className="rounded p-4" style={{ background: '#0c0f11', border: '1px solid var(--pw-border)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-bold tracking-widest" style={{ color: '#9ca3af' }}>NODES MAP</div>
        <button style={{ color: '#374151' }}><Icon name="RefreshCw" size={13} /></button>
      </div>
      <div className="flex justify-between text-xs mb-2" style={{ color: '#374151' }}>
        <span>NODE</span><span>PING</span>
      </div>
      <div className="space-y-1.5">
        {nodes.map(node => (
          <button key={node.id}
            onClick={() => { if (conn !== 'connected') onSelectNode(node); }}
            className="w-full flex items-center justify-between py-1 px-1 rounded transition-all"
            style={{ background: relayNode.id === node.id ? '#22c55e11' : 'transparent' }}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: pingColor(node.ping) }} />
              <span className="text-xs" style={{ color: relayNode.id === node.id ? '#22c55e' : '#9ca3af' }}>{node.name}</span>
            </div>
            <span className="text-xs font-mono font-bold" style={{ color: pingColor(node.ping) }}>{node.ping} ms</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-3 pt-2" style={{ borderTop: '1px solid var(--pw-border)' }}>
        {[['#22c55e', 'BEST'], ['#eab308', 'GOOD'], ['#ef4444', 'POOR']].map(([c, l]) => (
          <div key={l} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: c }} />
            <span className="text-xs" style={{ color: '#4b5563', fontSize: '10px' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RealTimeTraffic ─────────────────────────────────────────────────────────
function RealTimeTraffic({ pingH, jitterH, lossH }: {
  pingH: number[]; jitterH: number[]; lossH: number[];
}) {
  return (
    <div className="rounded p-4" style={{ background: '#0c0f11', border: '1px solid var(--pw-border)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-bold tracking-widest" style={{ color: '#9ca3af' }}>REAL-TIME TRAFFIC</div>
        <div className="text-xs px-2 py-0.5 rounded"
          style={{ background: '#1a1f22', color: '#6b7280', border: '1px solid var(--pw-border)' }}>
          Last 60 sec
        </div>
      </div>
      <LineChart
        series={[pingH, jitterH, lossH]}
        colors={['#22c55e', '#38bdf8', '#ef4444']}
        labels={['PING (ms)', 'JITTER (ms)', 'LOSS (%)']}
        width={320} height={100}
      />
    </div>
  );
}

// ─── SettingsPanel ───────────────────────────────────────────────────────────
function SettingsPanel({ settingsTab, setSettingsTab, autoSelect, setAutoSelect, protocol, setProtocol,
  region, setRegion, maxPing, setMaxPing, maxLoss, setMaxLoss }: {
  settingsTab: SettingsTab; setSettingsTab: (t: SettingsTab) => void;
  autoSelect: boolean; setAutoSelect: (v: boolean) => void;
  protocol: string; setProtocol: (v: string) => void;
  region: string; setRegion: (v: string) => void;
  maxPing: number; setMaxPing: (v: number) => void;
  maxLoss: number; setMaxLoss: (v: number) => void;
}) {
  const TABS: SettingsTab[] = ['GENERAL', 'CONNECTION', 'PROTOCOL', 'ADVANCED', 'ABOUT'];
  return (
    <div className="rounded p-4 flex-1" style={{ background: '#0c0f11', border: '1px solid var(--pw-border)' }}>
      <div className="text-xs font-bold tracking-widest mb-3" style={{ color: '#9ca3af' }}>SETTINGS</div>
      <div className="flex gap-3">
        <div className="flex flex-col gap-0.5 shrink-0">
          {TABS.map(t => (
            <button key={t} onClick={() => setSettingsTab(t)}
              className="text-left text-xs px-2 py-1.5 rounded transition-all whitespace-nowrap"
              style={{ color: settingsTab === t ? '#22c55e' : '#6b7280', background: settingsTab === t ? '#22c55e11' : 'transparent' }}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex-1 space-y-4">
          {settingsTab === 'GENERAL' ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-medium" style={{ color: '#9ca3af' }}>AUTO SELECT NODE</div>
                  <div className="text-xs" style={{ color: '#374151', fontSize: '10px' }}>Automatically select the best node</div>
                </div>
                <Toggle on={autoSelect} onChange={setAutoSelect} />
              </div>
              <div>
                <div className="text-xs font-medium mb-1.5" style={{ color: '#9ca3af' }}>PROTOCOL MODE</div>
                <Select value={protocol} options={PROTOCOLS} onChange={setProtocol} />
              </div>
              <div>
                <div className="text-xs font-medium mb-1.5" style={{ color: '#9ca3af' }}>PREFERRED REGION</div>
                <Select value={region} options={REGIONS} onChange={setRegion} />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: '#9ca3af' }}>MAX PING</span>
                  <span style={{ color: '#22c55e' }}>{maxPing} ms</span>
                </div>
                <Slider value={maxPing} onChange={setMaxPing} min={20} max={300} />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: '#9ca3af' }}>MAX LOSS</span>
                  <span style={{ color: '#22c55e' }}>{maxLoss} %</span>
                </div>
                <Slider value={maxLoss} onChange={setMaxLoss} min={0} max={20} />
              </div>
              <button className="w-full py-2 rounded text-xs font-bold tracking-widest"
                style={{ background: '#22c55e', color: '#000' }}>
                APPLY SETTINGS
              </button>
            </>
          ) : (
            <div className="text-xs" style={{ color: '#374151' }}>Раздел «{settingsTab}» в разработке</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── QuickConnect ────────────────────────────────────────────────────────────
function QuickConnect({ conn, nodes, selectedGame, setSelectedGame, selectedServer, setSelectedServer, onConnect }: {
  conn: ConnStatus; nodes: Node[];
  selectedGame: string; setSelectedGame: (v: string) => void;
  selectedServer: string; setSelectedServer: (v: string) => void;
  onConnect: () => void;
}) {
  return (
    <div className="rounded p-4" style={{ background: '#0c0f11', border: '1px solid var(--pw-border)' }}>
      <div className="text-xs font-bold tracking-widest mb-3" style={{ color: '#9ca3af' }}>QUICK CONNECT</div>
      <div className="space-y-2">
        <div>
          <div className="text-xs mb-1" style={{ color: '#4b5563' }}>GAME</div>
          <Select value={selectedGame} options={GAMES} onChange={setSelectedGame} />
        </div>
        <div>
          <div className="text-xs mb-1" style={{ color: '#4b5563' }}>SERVER</div>
          <Select value={selectedServer} options={SERVERS_LIST} onChange={setSelectedServer} />
        </div>
        <button onClick={onConnect} disabled={conn === 'connecting'}
          className="w-full py-2.5 rounded text-xs font-bold tracking-widest transition-all"
          style={{
            background: conn === 'connected' ? '#22c55e33' : '#22c55e',
            color: conn === 'connected' ? '#22c55e' : '#000',
          }}>
          {conn === 'connected' ? 'CONNECTED ✓' : conn === 'connecting' ? 'CONNECTING...' : 'CONNECT'}
        </button>
      </div>
      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--pw-border)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs tracking-widest" style={{ color: '#4b5563' }}>RECENT CONNECTIONS</span>
        </div>
        <div className="space-y-1.5">
          {nodes.slice(0, 4).map(n => (
            <div key={n.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: pingColor(n.ping) }} />
                <span className="text-xs" style={{ color: '#6b7280' }}>{n.name}</span>
              </div>
              <span className="text-xs font-mono font-bold" style={{ color: pingColor(n.ping) }}>{n.ping} ms</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── RightPanel (все 4 блока) ────────────────────────────────────────────────
interface RightPanelProps {
  nodes: Node[]; relayNode: Node; conn: ConnStatus;
  onSelectNode: (n: Node) => void;
  pingH: number[]; jitterH: number[]; lossH: number[];
  settingsTab: SettingsTab; setSettingsTab: (t: SettingsTab) => void;
  autoSelect: boolean; setAutoSelect: (v: boolean) => void;
  protocol: string; setProtocol: (v: string) => void;
  region: string; setRegion: (v: string) => void;
  maxPing: number; setMaxPing: (v: number) => void;
  maxLoss: number; setMaxLoss: (v: number) => void;
  selectedGame: string; setSelectedGame: (v: string) => void;
  selectedServer: string; setSelectedServer: (v: string) => void;
  onConnect: () => void;
}

export default function RightPanel(p: RightPanelProps) {
  return (
    <div className="col-span-12 xl:col-span-3 flex flex-col gap-3">
      <NodesMap nodes={p.nodes} relayNode={p.relayNode} conn={p.conn} onSelectNode={p.onSelectNode} />
      <RealTimeTraffic pingH={p.pingH} jitterH={p.jitterH} lossH={p.lossH} />
      <SettingsPanel
        settingsTab={p.settingsTab} setSettingsTab={p.setSettingsTab}
        autoSelect={p.autoSelect} setAutoSelect={p.setAutoSelect}
        protocol={p.protocol} setProtocol={p.setProtocol}
        region={p.region} setRegion={p.setRegion}
        maxPing={p.maxPing} setMaxPing={p.setMaxPing}
        maxLoss={p.maxLoss} setMaxLoss={p.setMaxLoss}
      />
      <QuickConnect
        conn={p.conn} nodes={p.nodes}
        selectedGame={p.selectedGame} setSelectedGame={p.setSelectedGame}
        selectedServer={p.selectedServer} setSelectedServer={p.setSelectedServer}
        onConnect={p.onConnect}
      />
    </div>
  );
}
