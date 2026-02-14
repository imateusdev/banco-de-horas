'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => (
            <h1 className="text-2xl font-bold text-white mb-3 mt-4" {...props} />
          ),
          h2: ({ ...props }) => (
            <h2 className="text-xl font-bold text-white mb-2 mt-3" {...props} />
          ),
          h3: ({ ...props }) => (
            <h3 className="text-lg font-bold text-white mb-2 mt-3" {...props} />
          ),
          p: ({ ...props }) => <p className="text-white/80 mb-2" {...props} />,
          strong: ({ ...props }) => <strong className="text-white font-bold" {...props} />,
          em: ({ ...props }) => <em className="text-white/90 italic" {...props} />,
          code: ({ inline, ...props }: any) =>
            inline ? (
              <code
                className="bg-white/10 text-blue-300 px-1 py-0.5 rounded text-sm font-mono"
                {...props}
              />
            ) : (
              <code
                className="block bg-white/10 text-blue-300 p-3 rounded text-sm font-mono overflow-x-auto"
                {...props}
              />
            ),
          pre: ({ ...props }) => (
            <pre className="bg-white/10 p-3 rounded mb-2 overflow-x-auto" {...props} />
          ),
          ul: ({ ...props }) => (
            <ul className="list-disc list-inside text-white/80 mb-2 space-y-1" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="list-decimal list-inside text-white/80 mb-2 space-y-1" {...props} />
          ),
          li: ({ ...props }) => <li className="text-white/80" {...props} />,
          a: ({ ...props }) => (
            <a
              className="text-blue-400 hover:text-blue-300 underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          blockquote: ({ ...props }) => (
            <blockquote
              className="border-l-4 border-white/20 pl-4 italic text-white/70 my-2"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
