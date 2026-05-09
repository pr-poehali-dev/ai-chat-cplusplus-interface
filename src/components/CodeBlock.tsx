import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { highlightCpp } from '@/lib/cppHighlight';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export default function CodeBlock({ code, language = 'cpp' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlighted = language === 'cpp' ? highlightCpp(code) : code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const lines = highlighted.split('\n');

  return (
    <div className="rounded-lg overflow-hidden border my-2" style={{ borderColor: 'var(--ide-border)', background: '#0d1117' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2" style={{ background: 'var(--ide-panel)', borderBottom: '1px solid var(--ide-border)' }}>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#ffbd2e' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
          </div>
          <span className="font-mono text-xs ml-2" style={{ color: 'var(--ide-comment)' }}>
            {language === 'cpp' ? 'main.cpp' : language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs px-3 py-1 rounded transition-all"
          style={{
            color: copied ? 'var(--ide-green)' : 'var(--ide-comment)',
            background: copied ? 'rgba(63,185,80,0.1)' : 'transparent',
          }}
        >
          <Icon name={copied ? 'Check' : 'Copy'} size={13} />
          {copied ? 'Скопировано' : 'Копировать'}
        </button>
      </div>
      {/* Code */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                <td
                  className="select-none text-right pr-4 pl-4 font-mono text-xs w-10"
                  style={{ color: 'var(--ide-border)', userSelect: 'none', minWidth: '2.5rem' }}
                >
                  {idx + 1}
                </td>
                <td
                  className="font-mono text-sm pr-6 py-0.5 leading-6 whitespace-pre"
                  style={{ color: 'var(--ide-text)' }}
                  dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }}
                />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
