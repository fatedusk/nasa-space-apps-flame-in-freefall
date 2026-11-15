import React, { useMemo } from 'react';
import katex from 'katex';

interface KaTeXMathProps {
  math: string;
  displayMode?: boolean;
  className?: string;
}

export const KaTeXMath: React.FC<KaTeXMathProps> = ({
  math,
  displayMode = false,
  className = '',
}) => {
  const html = useMemo(() => {
    try {
      // Clean up math markers ($$...$$ or $...$) if included
      let clean = math.trim();
      if (clean.startsWith('$$') && clean.endsWith('$$')) {
        clean = clean.slice(2, -2).trim();
      } else if (clean.startsWith('$') && clean.endsWith('$')) {
        clean = clean.slice(1, -1).trim();
      }

      // Sanitize common LLM tokenization splits (e.g. \le ft -> \left, \ri ght -> \right)
      clean = clean
        .replace(/\\le\s*ft\b/g, '\\left')
        .replace(/\\ri\s*ght\b/g, '\\right')
        .replace(/\\text\s*\{/g, '\\text{');

      // Auto-heal unbalanced \left and \right (fatal in KaTeX when LLMs emit \left( without matching \right))
      const leftCount = (clean.match(/\\left\b/g) || []).length;
      const rightCount = (clean.match(/\\right\b/g) || []).length;
      if (leftCount !== rightCount) {
        clean = clean.replace(/\\left\b/g, '').replace(/\\right\b/g, '');
      }

      return katex.renderToString(clean, {
        displayMode,
        throwOnError: false,
        output: 'htmlAndMathml',
      });
    } catch {
      return `<span class="font-mono text-cyan-300">${math}</span>`;
    }
  }, [math, displayMode]);

  return (
    <span
      className={`katex-wrapper ${displayMode ? 'block my-1.5 overflow-x-auto text-center' : 'inline-block align-middle'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
