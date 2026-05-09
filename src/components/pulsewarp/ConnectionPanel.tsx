import { ConnStatus, pingColor } from './types';

interface ConnectionPanelProps {
  conn: ConnStatus;
  ping: number;
  jitter: number;
  loss: number;
  protocol: string;
  sessionTime: string;
  pingHistory: number[];
  onConnect: () => void;
}

export default function ConnectionPanel({
  conn, ping, jitter, loss, protocol, sessionTime, pingHistory, onConnect,
}: ConnectionPanelProps) {
  const connColor = conn === 'connected' ? '#22c55e' : conn === 'connecting' ? '#eab308' : '#ef4444';

  return (
    <div className="col-span-9 md:col-span-2 flex flex-col gap-3">
      <div className="rounded p-4 flex flex-col gap-3" style={{ background: '#0c0f11', border: '1px solid var(--pw-border)' }}>
        <div className="text-xs font-bold tracking-widest" style={{ color: '#9ca3af' }}>CONNECTION</div>
        <div>
          <div className="text-xs font-medium" style={{ color: '#22c55e' }}>
            {conn === 'connected' ? 'OPTIMIZED' : conn === 'connecting' ? 'CONNECTING...' : 'DISCONNECTED'}
          </div>
          <div className="flex items-end gap-1 mt-1">
            <span className="font-bold text-3xl" style={{ color: connColor, fontFamily: 'monospace', lineHeight: 1 }}>
              {conn === 'connected' ? ping : '--'}
            </span>
            <span className="text-xs mb-1" style={{ color: '#6b7280' }}>ms</span>
          </div>
          <div className="text-xs uppercase tracking-wider mt-0.5" style={{ color: '#374151' }}>PING</div>
          <div className="mt-2" style={{ height: 32 }}>
            <svg width="100%" viewBox="0 0 120 32" preserveAspectRatio="none">
              {pingHistory.length > 1 && (() => {
                const mn = Math.min(...pingHistory), mx = Math.max(...pingHistory, mn + 1);
                const pts = pingHistory.map((v, i) => `${(i / (pingHistory.length - 1)) * 120},${32 - ((v - mn) / (mx - mn)) * 28}`).join(' ');
                return <polyline points={pts} fill="none" stroke="#22c55e" strokeWidth="1.2" strokeLinejoin="round" opacity="0.8" />;
              })()}
            </svg>
          </div>
        </div>

        <div className="space-y-2 pt-1" style={{ borderTop: '1px solid var(--pw-border)' }}>
          {[
            { label: 'PACKET LOSS', value: conn === 'connected' ? `${loss.toFixed(1)} %` : '-- %', color: loss > 2 ? '#ef4444' : '#22c55e' },
            { label: 'JITTER',      value: conn === 'connected' ? `${jitter} ms`           : '-- ms', color: '#22c55e' },
          ].map(m => (
            <div key={m.label} className="pt-2" style={{ borderTop: '1px solid var(--pw-border)' }}>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />
                <span className="font-bold text-lg" style={{ color: m.color, fontFamily: 'monospace' }}>{m.value}</span>
              </div>
              <div className="text-xs tracking-wider mt-0.5" style={{ color: '#374151' }}>{m.label}</div>
            </div>
          ))}
        </div>

        <div className="pt-2 space-y-2" style={{ borderTop: '1px solid var(--pw-border)' }}>
          <div>
            <div className="text-xs tracking-wider" style={{ color: '#374151' }}>PROTOCOL</div>
            <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{protocol}</div>
          </div>
          <div>
            <div className="text-xs tracking-wider" style={{ color: '#374151' }}>SESSION TIME</div>
            <div className="text-xs font-mono mt-0.5" style={{ color: '#9ca3af' }}>{sessionTime}</div>
          </div>
        </div>

        <button onClick={onConnect} disabled={conn === 'connecting'}
          className="w-full py-2.5 rounded text-xs font-bold tracking-widest transition-all mt-1"
          style={{
            background: conn === 'connected' ? 'transparent' : '#22c55e22',
            color: conn === 'connected' ? '#ef4444' : conn === 'connecting' ? '#eab308' : '#22c55e',
            border: `1px solid ${conn === 'connected' ? '#ef444455' : conn === 'connecting' ? '#eab30855' : '#22c55e55'}`,
          }}>
          {conn === 'connected' ? 'DISCONNECT' : conn === 'connecting' ? 'CONNECTING...' : 'CONNECT'}
        </button>
      </div>
    </div>
  );
}
