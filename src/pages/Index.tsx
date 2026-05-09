import { useState, useRef, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import CodeBlock from '@/components/CodeBlock';
import {
  type Message, type Chat, type Mode, type CppVersion,
  getAIResponse, MODE_CONFIG, CPP_VERSIONS
} from '@/lib/aiResponses';

function genId() { return Math.random().toString(36).slice(2); }

function parseContent(text: string) {
  const parts: { type: 'text' | 'bold' | 'bullet'; content: string }[] = [];
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.startsWith('• ')) {
      parts.push({ type: 'bullet', content: line.slice(2) });
    } else if (line.trim()) {
      const segments = line.split(/(\*\*[^*]+\*\*)/g);
      for (const seg of segments) {
        if (seg.startsWith('**') && seg.endsWith('**')) {
          parts.push({ type: 'bold', content: seg.slice(2, -2) });
        } else if (seg) {
          parts.push({ type: 'text', content: seg });
        }
      }
      parts.push({ type: 'text', content: '\n' });
    }
  }
  return parts;
}

function MessageText({ text }: { text: string }) {
  const parts = parseContent(text);
  const bullets = parts.filter(p => p.type === 'bullet');
  const nonBullets = parts.filter(p => p.type !== 'bullet');
  return (
    <div className="text-sm leading-6" style={{ color: 'var(--ide-text)' }}>
      {nonBullets.map((p, i) =>
        p.type === 'bold'
          ? <strong key={i} style={{ color: 'var(--ide-accent)' }}>{p.content}</strong>
          : p.content === '\n' ? <br key={i} /> : <span key={i}>{p.content}</span>
      )}
      {bullets.length > 0 && (
        <ul className="mt-2 space-y-1">
          {bullets.map((p, i) => (
            <li key={i} className="flex items-start gap-2">
              <span style={{ color: 'var(--ide-accent)', marginTop: '2px' }}>›</span>
              <span style={{ color: 'var(--ide-text-dim)' }}
                dangerouslySetInnerHTML={{ __html: p.content.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:var(--ide-accent)">$1</strong>') }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-2">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  );
}

export default function Index() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('chat');
  const [cppVersion, setCppVersion] = useState<CppVersion>('C++17');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId) ?? null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages, isTyping]);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
  };

  const createNewChat = useCallback((m: Mode = mode) => {
    const id = genId();
    const newChat: Chat = {
      id, title: 'Новый чат', messages: [], createdAt: new Date(), mode: m
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(id);
    setMode(m);
    return id;
  }, [mode]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    let chatId = activeChatId;
    if (!chatId) chatId = createNewChat(mode);

    const userMsg: Message = {
      id: genId(), role: 'user', content: text,
      timestamp: new Date(), mode
    };

    setChats(prev => prev.map(c =>
      c.id === chatId
        ? {
            ...c,
            title: c.messages.length === 0 ? text.slice(0, 30) + (text.length > 30 ? '...' : '') : c.title,
            messages: [...c.messages, userMsg]
          }
        : c
    ));
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsTyping(true);

    const delay = 800 + Math.random() * 700;
    setTimeout(() => {
      const response = getAIResponse(text, mode, cppVersion);
      const aiMsg: Message = {
        id: genId(), role: 'assistant',
        content: response.text,
        code: response.code,
        timestamp: new Date(), mode
      };
      setChats(prev => prev.map(c =>
        c.id === chatId ? { ...c, messages: [...c.messages, aiMsg] } : c
      ));
      setIsTyping(false);
    }, delay);
  }, [input, isTyping, activeChatId, mode, cppVersion, createNewChat]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: 'var(--ide-bg)' }}>
      {/* SIDEBAR */}
      <aside
        className="flex flex-col transition-all duration-300 shrink-0"
        style={{
          width: sidebarOpen ? 260 : 0,
          minWidth: sidebarOpen ? 260 : 0,
          background: 'var(--ide-sidebar)',
          borderRight: '1px solid var(--ide-border)',
          overflow: 'hidden'
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: '1px solid var(--ide-border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm shrink-0"
            style={{ background: 'linear-gradient(135deg, #1f6feb 0%, #bc8cff 100%)', color: '#fff' }}>
            C++
          </div>
          <div>
            <div className="font-sans font-semibold text-sm" style={{ color: 'var(--ide-text)' }}>AI Ассистент</div>
            <div className="font-mono text-xs" style={{ color: 'var(--ide-comment)' }}>{cppVersion}</div>
          </div>
        </div>

        {/* New chat button */}
        <div className="px-3 py-3">
          <button
            onClick={() => createNewChat()}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'var(--ide-accent-dim)', color: '#fff' }}
          >
            <Icon name="Plus" size={15} />
            Новый чат
          </button>
        </div>

        {/* Modes */}
        <div className="px-3 pb-2">
          <div className="text-xs font-medium px-2 pb-2" style={{ color: 'var(--ide-comment)' }}>РЕЖИМЫ</div>
          {(Object.entries(MODE_CONFIG) as [Mode, typeof MODE_CONFIG[Mode]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => { setMode(key); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all mb-0.5"
              style={{
                color: mode === key ? cfg.color : 'var(--ide-text-dim)',
                background: mode === key ? `${cfg.color}18` : 'transparent',
              }}
            >
              <Icon name={cfg.icon as string} size={15} fallback="MessageSquare" />
              {cfg.label}
              {mode === key && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
              )}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--ide-border)', margin: '4px 12px' }} />

        {/* Chat history */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className="text-xs font-medium px-2 pb-2" style={{ color: 'var(--ide-comment)' }}>ИСТОРИЯ</div>
          {chats.length === 0 ? (
            <div className="text-xs px-2 py-1" style={{ color: 'var(--ide-border)' }}>Чатов пока нет</div>
          ) : (
            chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className="group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all mb-0.5"
                style={{
                  background: activeChatId === chat.id ? 'var(--ide-panel)' : 'transparent',
                  color: activeChatId === chat.id ? 'var(--ide-text)' : 'var(--ide-text-dim)',
                  border: activeChatId === chat.id ? '1px solid var(--ide-border)' : '1px solid transparent',
                }}
              >
                <Icon name={MODE_CONFIG[chat.mode].icon as string} size={13} fallback="MessageSquare" />
                <span className="text-xs flex-1 truncate">{chat.title}</span>
                <button
                  onClick={(e) => deleteChat(chat.id, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                  style={{ color: 'var(--ide-comment)' }}
                >
                  <Icon name="X" size={11} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Settings button */}
        <div className="px-3 py-3" style={{ borderTop: '1px solid var(--ide-border)' }}>
          <button
            onClick={() => setSettingsOpen(v => !v)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
            style={{ color: 'var(--ide-text-dim)', background: settingsOpen ? 'var(--ide-panel)' : 'transparent' }}
          >
            <Icon name="Settings" size={15} />
            Настройки
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ background: 'var(--ide-sidebar)', borderBottom: '1px solid var(--ide-border)' }}>
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="p-1.5 rounded transition-all hover:bg-white/5"
            style={{ color: 'var(--ide-text-dim)' }}
          >
            <Icon name={sidebarOpen ? 'PanelLeftClose' : 'PanelLeft'} size={18} />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: MODE_CONFIG[mode].color }} />
            <span className="font-mono text-sm font-medium" style={{ color: MODE_CONFIG[mode].color }}>
              {MODE_CONFIG[mode].label}
            </span>
            {activeChat && (
              <>
                <span style={{ color: 'var(--ide-border)' }}>/</span>
                <span className="text-sm truncate max-w-48" style={{ color: 'var(--ide-text-dim)' }}>
                  {activeChat.title}
                </span>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: 'var(--ide-panel)', border: '1px solid var(--ide-border)' }}>
              {CPP_VERSIONS.map(v => (
                <button
                  key={v}
                  onClick={() => setCppVersion(v)}
                  className="px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all"
                  style={{
                    background: cppVersion === v ? 'var(--ide-accent-dim)' : 'transparent',
                    color: cppVersion === v ? '#fff' : 'var(--ide-text-dim)',
                  }}
                >
                  {v.replace('C++', '')}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Settings panel */}
        {settingsOpen && (
          <div className="px-6 py-4 animate-fade-in" style={{ background: 'var(--ide-panel)', borderBottom: '1px solid var(--ide-border)' }}>
            <div className="max-w-2xl">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ide-text)' }}>Настройки генерации</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'var(--ide-comment)' }}>Версия C++</label>
                  <div className="flex flex-wrap gap-2">
                    {CPP_VERSIONS.map(v => (
                      <button key={v} onClick={() => setCppVersion(v)}
                        className="px-3 py-1 rounded text-xs font-mono transition-all"
                        style={{
                          background: cppVersion === v ? 'var(--ide-accent-dim)' : 'var(--ide-sidebar)',
                          color: cppVersion === v ? '#fff' : 'var(--ide-text-dim)',
                          border: `1px solid ${cppVersion === v ? 'var(--ide-accent)' : 'var(--ide-border)'}`,
                        }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'var(--ide-comment)' }}>Режим ответа</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(MODE_CONFIG) as [Mode, typeof MODE_CONFIG[Mode]][]).map(([key, cfg]) => (
                      <button key={key} onClick={() => setMode(key)}
                        className="px-3 py-1 rounded text-xs transition-all flex items-center gap-1.5"
                        style={{
                          background: mode === key ? `${cfg.color}22` : 'var(--ide-sidebar)',
                          color: mode === key ? cfg.color : 'var(--ide-text-dim)',
                          border: `1px solid ${mode === key ? cfg.color : 'var(--ide-border)'}`,
                        }}>
                        <Icon name={cfg.icon as string} size={11} fallback="MessageSquare" />
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {!activeChat || activeChat.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 font-mono font-bold text-xl"
                style={{ background: 'linear-gradient(135deg, #1f6feb22 0%, #bc8cff22 100%)', border: '1px solid var(--ide-border)', color: 'var(--ide-accent)' }}>
                C++
              </div>
              <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--ide-text)' }}>C++ AI Ассистент</h1>
              <p className="text-sm mb-8 max-w-md" style={{ color: 'var(--ide-comment)' }}>
                Спроси всё о C++: генерация кода, объяснение концепций, отладка и паттерны. Активна версия{' '}
                <span className="font-mono" style={{ color: 'var(--ide-accent)' }}>{cppVersion}</span>.
              </p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                {[
                  { text: 'Напиши быструю сортировку', mode: 'generate' as Mode },
                  { text: 'Объясни умные указатели', mode: 'explain' as Mode },
                  { text: 'Покажи паттерн Singleton', mode: 'examples' as Mode },
                  { text: 'Найди ошибки в коде', mode: 'debug' as Mode },
                ].map((suggestion) => (
                  <button
                    key={suggestion.text}
                    onClick={() => {
                      setMode(suggestion.mode);
                      setInput(suggestion.text);
                      setTimeout(() => textareaRef.current?.focus(), 50);
                    }}
                    className="text-left px-4 py-3 rounded-lg text-sm transition-all"
                    style={{
                      background: 'var(--ide-panel)',
                      border: '1px solid var(--ide-border)',
                      color: 'var(--ide-text-dim)',
                    }}
                  >
                    <span style={{ color: MODE_CONFIG[suggestion.mode].color, marginRight: '6px' }}>›</span>
                    {suggestion.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {activeChat.messages.map((msg, idx) => (
                <div key={msg.id} className="animate-fade-in" style={{ animationDelay: `${idx * 0.03}s` }}>
                  {msg.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="max-w-xl px-4 py-3 rounded-2xl rounded-tr-sm text-sm"
                        style={{ background: 'var(--ide-accent-dim)', color: '#fff' }}>
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-mono text-xs font-bold mt-0.5"
                        style={{ background: `${MODE_CONFIG[msg.mode].color}22`, color: MODE_CONFIG[msg.mode].color, border: `1px solid ${MODE_CONFIG[msg.mode].color}44` }}>
                        AI
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium" style={{ color: MODE_CONFIG[msg.mode].color }}>
                            {MODE_CONFIG[msg.mode].label}
                          </span>
                          <span className="text-xs font-mono" style={{ color: 'var(--ide-border)' }}>{cppVersion}</span>
                        </div>
                        <MessageText text={msg.content} />
                        {msg.code && <CodeBlock code={msg.code} />}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-mono text-xs font-bold"
                    style={{ background: `${MODE_CONFIG[mode].color}22`, color: MODE_CONFIG[mode].color, border: `1px solid ${MODE_CONFIG[mode].color}44` }}>
                    AI
                  </div>
                  <div className="flex-1 pt-1">
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="px-4 pb-4 pt-2 shrink-0">
          <div className="max-w-3xl mx-auto">
            {/* Mode quick switch */}
            <div className="flex gap-1.5 mb-2 flex-wrap">
              {(Object.entries(MODE_CONFIG) as [Mode, typeof MODE_CONFIG[Mode]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: mode === key ? `${cfg.color}22` : 'transparent',
                    color: mode === key ? cfg.color : 'var(--ide-comment)',
                    border: `1px solid ${mode === key ? cfg.color + '55' : 'transparent'}`,
                  }}
                >
                  <Icon name={cfg.icon as string} size={11} fallback="MessageSquare" />
                  {cfg.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 items-end rounded-xl p-3"
              style={{ background: 'var(--ide-panel)', border: '1px solid var(--ide-border)' }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => { setInput(e.target.value); autoResize(); }}
                onKeyDown={handleKeyDown}
                placeholder={MODE_CONFIG[mode].placeholder}
                rows={1}
                className="flex-1 resize-none bg-transparent outline-none text-sm leading-6 font-sans"
                style={{ color: 'var(--ide-text)', caretColor: 'var(--ide-accent)', minHeight: '24px', maxHeight: '180px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                className="p-2 rounded-lg transition-all shrink-0"
                style={{
                  background: input.trim() && !isTyping ? 'var(--ide-accent-dim)' : 'var(--ide-sidebar)',
                  color: input.trim() && !isTyping ? '#fff' : 'var(--ide-comment)',
                  cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
                }}
              >
                <Icon name={isTyping ? 'Loader' : 'SendHorizontal'} size={16} />
              </button>
            </div>
            <div className="text-xs mt-1.5 text-center" style={{ color: 'var(--ide-border)' }}>
              Enter — отправить · Shift+Enter — новая строка
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
