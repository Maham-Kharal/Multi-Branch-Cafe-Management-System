import React from 'react';

interface MarkdownTextProps {
  content: string;
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({ content }) => {
  if (!content) return null;

  // Filter out any leftover raw function tags
  let cleaned = content.replace(/<function\(.*?\).*?<\/function>/gs, '');
  cleaned = cleaned.replace(/<function.*?>/gs, '');
  cleaned = cleaned.trim();

  // Split into lines to parse lists, headers, and inline bold/italics
  const lines = cleaned.split('\n');

  const parseInline = (text: string): React.ReactNode[] => {
    // Split by bold (**text**) and italics (*text*)
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} style={{ fontWeight: 700, color: 'inherit' }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} style={{ backgroundColor: '#F3EAD8', color: '#92400E', padding: '0.1rem 0.35rem', borderRadius: '0.25rem', fontSize: '0.85em', fontFamily: 'monospace' }}>
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', lineHeight: '1.5' }}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={lineIdx} style={{ height: '0.25rem' }} />;
        }

        // Headers (### or ## or #)
        if (trimmed.startsWith('#')) {
          const headerText = trimmed.replace(/^#+\s*/, '');
          return (
            <div key={lineIdx} style={{ fontWeight: 700, fontSize: '0.95rem', color: '#B45309', marginTop: '0.35rem', marginBottom: '0.15rem' }}>
              {parseInline(headerText)}
            </div>
          );
        }

        // Bullet lists (- or *)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const listText = trimmed.slice(2);
          return (
            <div key={lineIdx} style={{ display: 'flex', gap: '0.5rem', paddingLeft: '0.5rem', alignItems: 'baseline' }}>
              <span style={{ color: '#D97706', fontSize: '0.8rem' }}>•</span>
              <div>{parseInline(listText)}</div>
            </div>
          );
        }

        // Numbered lists (1. 2. 3.)
        const matchNumber = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (matchNumber) {
          return (
            <div key={lineIdx} style={{ display: 'flex', gap: '0.4rem', paddingLeft: '0.5rem', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 600, color: '#D97706', fontSize: '0.85rem' }}>{matchNumber[1]}.</span>
              <div>{parseInline(matchNumber[2])}</div>
            </div>
          );
        }

        return <div key={lineIdx}>{parseInline(line)}</div>;
      })}
    </div>
  );
};
