// Blog post body. react-markdown never renders raw HTML, so post text can't inject scripts.
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const isExternal = (href = '') => /^https?:\/\//.test(href) && !href.startsWith(window.location.origin);

const components = {
  a: ({ href, children }) => (
    <a href={href} {...(isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>
  ),
  img: ({ src, alt }) => <img src={src} alt={alt || ''} loading="lazy" />,
  // The page title is the only h1
  h1: ({ children }) => <h2>{children}</h2>,
};

export default function Markdown({ children }) {
  return (
    <div className="prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{children || ''}</ReactMarkdown>
    </div>
  );
}
