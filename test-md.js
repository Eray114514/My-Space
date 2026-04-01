import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';

function remarkFixChineseBold() {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      const regex = /\*\*(.+?)\*\*/g;
      let match;
      let lastIndex = 0;
      const children = [];
      
      while ((match = regex.exec(node.value)) !== null) {
        if (match.index > lastIndex) {
          children.push({
            type: 'text',
            value: node.value.slice(lastIndex, match.index)
          });
        }
        children.push({
          type: 'strong',
          children: [{ type: 'text', value: match[1] }]
        });
        lastIndex = regex.lastIndex;
      }
      
      if (lastIndex < node.value.length) {
        children.push({
          type: 'text',
          value: node.value.slice(lastIndex)
        });
      }
      
      if (children.length > 0) {
        parent.children.splice(index, 1, ...children);
        return index + children.length;
      }
    });
  };
}

const text3 = "这里有一段话**第一次系统了解大语言模型（LLM, Large Language Model）**这种有中文括号就无法加粗\n\n`**不要加粗**`";

const file3 = await unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkFixChineseBold)
  .use(remarkRehype)
  .use(rehypeStringify)
  .process(text3);

console.log("text3", String(file3));
