export type TabId = 'dashboard' | 'nodes' | 'routes' | 'statistics' | 'settings';
export type ConnStatus = 'disconnected' | 'connecting' | 'connected';
export type SettingsTab = 'GENERAL' | 'CONNECTION' | 'PROTOCOL' | 'ADVANCED' | 'ABOUT';

export interface Node {
  id: string; name: string; city: string; country: string;
  flag: string; ping: number;
  x: number; y: number;
}

export const NODES: Node[] = [
  { id:'fra03', name:'Frankfurt-03', city:'Frankfurt', country:'Germany',     flag:'🇩🇪', ping:23,  x:48.5, y:32 },
  { id:'ams02', name:'Amsterdam-02', city:'Amsterdam', country:'Netherlands', flag:'🇳🇱', ping:28,  x:46,   y:29 },
  { id:'war01', name:'Warsaw-01',    city:'Warsaw',    country:'Poland',      flag:'🇵🇱', ping:31,  x:52,   y:28 },
  { id:'lon04', name:'London-04',    city:'London',    country:'UK',          flag:'🇬🇧', ping:35,  x:43,   y:27 },
  { id:'nyc05', name:'New York-05',  city:'New York',  country:'USA',         flag:'🇺🇸', ping:62,  x:21,   y:31 },
  { id:'sao02', name:'São Paulo-02', city:'São Paulo', country:'Brazil',      flag:'🇧🇷', ping:78,  x:28,   y:62 },
  { id:'sgp01', name:'Singapore-01', city:'Singapore', country:'Singapore',   flag:'🇸🇬', ping:112, x:75,   y:55 },
  { id:'tyo01', name:'Tokyo-01',     city:'Tokyo',     country:'Japan',       flag:'🇯🇵', ping:130, x:82,   y:33 },
];

export const GAMES = ['Counter-Strike 2','Valorant','Apex Legends','Warzone','Fortnite','PUBG','Battlefield 2042'];
export const SERVERS_LIST = ['Official DS #15','Official DS #07','Community #3','Ranked EU #2','Faceit EU #1'];
export const PROTOCOLS = ['PulseWarp Core v7','PulseWarp Core v6','WireGuard','OpenVPN'];
export const REGIONS = ['Europe','North America','Asia Pacific','South America','Auto'];

export function pingColor(p: number) {
  if (p <= 40) return '#22c55e';
  if (p <= 80) return '#eab308';
  return '#ef4444';
}
export function clamp(v: number, mn: number, mx: number) { return Math.min(mx, Math.max(mn, v)); }
export function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
export function pad2(n: number) { return String(n).padStart(2, '0'); }
