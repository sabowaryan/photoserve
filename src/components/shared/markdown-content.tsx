'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  return (
    <div className={`prose prose-invert prose-sm sm:prose-base max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold mb-6 gradient-text">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground border-b border-border/40 pb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-medium mt-4 mb-2 text-foreground">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="text-muted-foreground mb-4 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-2 mb-4 text-muted-foreground">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-muted-foreground">{children}</li>
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-primary hover:underline">{children}</a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-muted-foreground italic">{children}</em>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/50 pl-4 my-4 italic text-muted-foreground bg-muted/20 py-2 rounded-r">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">{children}</code>
          ),
          hr: () => (
            <hr className="my-8 border-border/40" />
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full border-collapse border border-border/40 rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody>{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-border/40">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left font-semibold text-foreground">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-muted-foreground">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
