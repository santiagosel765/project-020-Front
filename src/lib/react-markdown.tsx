"use client";

import React from 'react';

interface ReactMarkdownProps {
  children?: string;
  className?: string;
}

type InlineMatch = {
  type: 'link' | 'bold' | 'italic' | 'code';
  regex: RegExp;
  priority: number;
};

const inlinePatterns: InlineMatch[] = [
  { type: 'link', regex: /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/, priority: 1 },
  { type: 'bold', regex: /\*\*(.+?)\*\*/, priority: 2 },
  { type: 'italic', regex: /\*(?!\*)([^*\n]+?)\*(?!\*)/, priority: 3 },
  { type: 'code', regex: /`([^`]+?)`/, priority: 4 },
];

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let remaining = text;
  let index = 0;

  while (remaining.length > 0) {
    const matches = inlinePatterns
      .map((pattern) => {
        pattern.regex.lastIndex = 0;
        const match = pattern.regex.exec(remaining);
        if (!match || match.index === undefined) return null;
        return { ...pattern, match, index: match.index };
      })
      .filter(Boolean) as Array<{ type: InlineMatch['type']; regex: RegExp; priority: number; match: RegExpExecArray; index: number }>;

    if (!matches.length) {
      nodes.push(<React.Fragment key={`${keyPrefix}-${index}`}>{remaining}</React.Fragment>);
      break;
    }

    matches.sort((a, b) => {
      if (a.index === b.index) return a.priority - b.priority;
      return a.index - b.index;
    });

    const next = matches[0];

    if (next.index > 0) {
      nodes.push(
        <React.Fragment key={`${keyPrefix}-${index}`}>{remaining.slice(0, next.index)}</React.Fragment>,
      );
      index += 1;
    }

    const [fullMatch, ...groups] = next.match;
    const consumed = next.index + fullMatch.length;

    switch (next.type) {
      case 'link': {
        const [label, url] = groups;
        nodes.push(
          <a
            key={`${keyPrefix}-link-${index}`}
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            {renderInline(label, `${keyPrefix}-link-${index}`)}
          </a>,
        );
        break;
      }
      case 'bold':
        nodes.push(
          <strong key={`${keyPrefix}-strong-${index}`}>
            {renderInline(groups[0] ?? '', `${keyPrefix}-strong-${index}`)}
          </strong>,
        );
        break;
      case 'italic':
        nodes.push(
          <em key={`${keyPrefix}-em-${index}`}>
            {renderInline(groups[0] ?? '', `${keyPrefix}-em-${index}`)}
          </em>,
        );
        break;
      case 'code':
        nodes.push(<code key={`${keyPrefix}-code-${index}`}>{groups[0] ?? ''}</code>);
        break;
    }

    remaining = remaining.slice(consumed);
    index += 1;
  }

  return nodes;
}

function renderBlocks(markdown: string): React.ReactNode[] {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(' ').trim();
    if (!text) {
      paragraph = [];
      return;
    }
    const key = `p-${blocks.length}`;
    blocks.push(<p key={key}>{renderInline(text, key)}</p>);
    paragraph = [];
  };

  const flushList = () => {
    if (!list || !list.length) {
      list = null;
      return;
    }
    const key = `ul-${blocks.length}`;
    blocks.push(
      <ul key={key} className="list-disc pl-5 space-y-1">
        {list.map((item, idx) => (
          <li key={`${key}-li-${idx}`}>{renderInline(item.trim(), `${key}-li-${idx}`)}</li>
        ))}
      </ul>,
    );
    list = null;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trimEnd();
    const isLast = idx === lines.length - 1;

    if (!trimmed.trim()) {
      flushParagraph();
      flushList();
      return;
    }

    const headingMatch = /^#{1,6}\s/.exec(trimmed);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = Math.min(headingMatch[0].trim().length, 6);
      const text = trimmed.slice(headingMatch[0].length).trim();
      const key = `h${level}-${blocks.length}`;
      const Heading = `h${level}` as keyof JSX.IntrinsicElements;
      blocks.push(
        React.createElement(Heading, { key }, renderInline(text, key)),
      );
      return;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      list = list ?? [];
      list.push(trimmed.replace(/^[-*]\s+/, ''));
      if (isLast) {
        flushList();
      }
      return;
    }

    if (list) {
      flushList();
    }

    paragraph.push(trimmed);
    if (isLast) {
      flushParagraph();
    }
  });

  flushParagraph();
  flushList();

  return blocks.length ? blocks : [<p key="empty">{markdown}</p>];
}

const ReactMarkdown = ({ children = '', className }: ReactMarkdownProps) => {
  return <div className={className}>{renderBlocks(children)}</div>;
};

export default ReactMarkdown;
