import React from 'react';
import { renderToString } from 'react-dom/server';
import { MarkdownRenderer } from './components/MarkdownRenderer';

const md = `
# Hello
**第一次系统了解大语言模型（LLM, Large Language Model）**
- [1. Hello](#hello)

$$E=mc^2$$
`;

const html = renderToString(<MarkdownRenderer content={md} />);
console.log(html);
