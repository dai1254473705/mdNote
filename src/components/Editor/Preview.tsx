import { marked } from 'marked';
import { useEffect, useRef } from 'react';
import { memo } from 'react';
import mermaid from 'mermaid';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import type { Wikilink } from '../../store/BacklinkStore';

marked.use({
  breaks: true,
  gfm: true,
});

const renderer = new marked.Renderer();

// Custom Link Renderer for File Icons
// eslint-disable-next-line @typescript-eslint/no-explicit-any
renderer.link = function ({ href, title, tokens }: { href: string; title?: string | null; tokens: any[] }) {
  const text = this.parser.parseInline(tokens);
  if (!href) return text;

  const ext = href.split('.').pop()?.toLowerCase();
  let icon = '';

  // Simple extension check (exclude common web protocols to avoid icon on http links unless they end in ext)
  const isWeb = href.startsWith('http') || href.startsWith('www');

  if (!isWeb || (isWeb && href.match(/\.(pdf|doc|docx|xls|xlsx|zip|rar|7z|txt|md)$/i))) {
    switch (ext) {
      case 'pdf': icon = '📄 '; break;
      case 'doc':
      case 'docx': icon = '📝 '; break;
      case 'xls':
      case 'xlsx': icon = '📊 '; break;
      case 'ppt':
      case 'pptx': icon = '📢 '; break;
      case 'zip':
      case 'rar':
      case '7z': icon = '📦 '; break;
      case 'txt':
      case 'md': icon = '📃 '; break;
      // Add more as needed
    }
  }

  // Open in new tab/window for files or external links
  const target = ' target="_blank" rel="noopener noreferrer"';

  return `<a href="${href}" title="${title || ''}"${target}>${icon}${text}</a>`;
};

marked.use({ renderer });

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

// Wikilink click handler - stored globally for use in rendered HTML
let handleWikilinkClick: ((event: MouseEvent, target: string) => void) | null = null;

export const setWikilinkClickHandler = (handler: ((event: MouseEvent, target: string) => void) | null) => {
  handleWikilinkClick = handler;
};

// Parse wikilinks from content
export const parseWikilinks = (content: string): Wikilink[] => {
  const links: Wikilink[] = [];
  const regex = /\[\[([^\]]+)(?:\|([^\]]+))?\]\]/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const fullMatch = match[0];
    const target = match[1];
    const alias = match[2];

    if (!fullMatch.startsWith('\\')) {
      links.push({
        target,
        alias,
        position: { start: match.index, end: match.index + fullMatch.length }
      });
    }
  }

  return links;
};

interface PreviewProps {
  content: string;
  searchQuery?: string;
  currentMatchIndex?: number;
  onMatchesFound?: (count: number) => void;
}

export const Preview = memo(observer(function Preview({ content, searchQuery, currentMatchIndex, onMatchesFound }: PreviewProps) {
  const { uiStore, fileStore, backlinkStore } = useStore();
  const ref = useRef<HTMLDivElement>(null);

  // Check if current file is JSON or TEXT
  const getFileType = () => {
    if (!fileStore.currentFile) return 'markdown';
    const fileName = fileStore.currentFile.name.toLowerCase();
    if (fileName.endsWith('.json')) return 'json';
    if (fileName.endsWith('.txt')) return 'text';
    return 'markdown';
  };

  const fileType = getFileType();

  // Search Highlighting Logic
  // Case insensitive search
  // (Moved to bottom to ensure execution after content render)

  // Update backlinks when content changes
  useEffect(() => {
    if (fileType === 'markdown' && fileStore.currentFile) {
      const fileName = fileStore.currentFile.name.replace('.md', '');

      // Get old links to remove
      const oldLinks = backlinkStore.getLinks(fileName);

      // Parse new links
      const newLinks = backlinkStore.extractLinksFromFile(fileName, content);

      // Update backlink index
      if (oldLinks.length > 0) {
        backlinkStore.removeBacklinks(fileStore.currentFile.path, oldLinks);
      }
      backlinkStore.addBacklinks(fileStore.currentFile.path, newLinks);
    }
  }, [content, fileType, fileStore.currentFile, backlinkStore]);

  useEffect(() => {
    if (!ref.current) return;

    // Handle JSON files - pretty print with syntax highlighting
    if (fileType === 'json') {
      try {
        const jsonObj = JSON.parse(content || '{}');
        const formattedJson = JSON.stringify(jsonObj, null, 2);
        ref.current.innerHTML = `<pre><code class="language-json">${formattedJson}</code></pre>`;
        hljs.highlightElement(ref.current.querySelector('code') as HTMLElement);
      } catch (error) {
        ref.current.innerHTML = `<pre><code class="language-json">${content || ''}</code></pre>`;
        hljs.highlightElement(ref.current.querySelector('code') as HTMLElement);
      }
      return;
    }

    // Handle TEXT files - display as plain text with line breaks
    if (fileType === 'text') {
      const escapedContent = (content || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      ref.current.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word;"><code>${escapedContent}</code></pre>`;
      return;
    }

    // Handle Markdown files
    const customRenderer = new marked.Renderer();

    // Preserve existing link renderer logic
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customRenderer.link = renderer.link;

    // Custom Image Renderer
    customRenderer.image = ({ href, title, text }: { href: string; title?: string | null; text: string }) => {
      if (!href) return text;

      let src = href;
      let style = '';

      // Parse Query Params for size (e.g. ?w=100px)
      try {
        // Use a dummy base for relative URLs
        const urlObj = new URL(href, 'http://dummy');
        const width = urlObj.searchParams.get('w');
        const height = urlObj.searchParams.get('h');

        if (width) style += `width: ${width};`;
        if (height) style += `height: ${height};`;

        // Note: we keep the query params in the src because the main process ignores them for file path resolution,
        // and removing them might break some web URLs that depend on them.
        // But for local files, it shouldn't matter.
      } catch {
        // Ignore parsing errors
      }

      // If it's a relative path and not a web URL
      if (!href.startsWith('http') && !href.startsWith('data:') && !href.startsWith('media:')) {
        if (fileStore.currentFile) {
          // Construct absolute path using a simple slash join (assuming macOS/Linux forward slashes for now)
          // or better, let the main process handle the joining if we passed just the filename.
          // But here we have relative path like "files/image.png".

          // We need the directory of the current file.
          // /Users/user/project/doc.md -> /Users/user/project
          const currentFilePath = fileStore.currentFile.path;
          const lastSlashIndex = currentFilePath.lastIndexOf('/');
          if (lastSlashIndex !== -1) {
            const currentDir = currentFilePath.substring(0, lastSlashIndex);
            // Construct media:// URL
            // Note: we need to handle if href starts with ./ or ../
            // For now, assuming simple "files/..."
            const absolutePath = `${currentDir}/${href}`;
            // Use a dummy host 'local' to ensure the path is treated as an absolute pathname
            // This prevents issues where the first directory component is interpreted as the host
            // e.g. media:///Users/... vs media://users/...
            src = `media://local${absolutePath}`;
          }
        }
      }

      return `<img src="${src}" alt="${text}" title="${title || ''}" style="${style}" />`;
    };

    // Custom Link Renderer (Video Support)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Custom Link Renderer (Video Support)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customRenderer.link = function (this: any, { href, title, tokens }: { href: string; title?: string | null; tokens: any[] }) {
      // Check for video extensions
      if (href && href.match(/\.(mp4|webm|ogg|mov)$/i)) {
        let src = href;

        // Handle local relative paths
        if (!href.startsWith('http') && !href.startsWith('data:') && !href.startsWith('media:')) {
          if (fileStore.currentFile) {
            const currentFilePath = fileStore.currentFile.path;
            const lastSlashIndex = currentFilePath.lastIndexOf('/');
            if (lastSlashIndex !== -1) {
              const currentDir = currentFilePath.substring(0, lastSlashIndex);
              const absolutePath = `${currentDir}/${href}`;
              src = `media://local${absolutePath}`;
            }
          }
        }

        return `<video controls preload="metadata" playsInline src="${src}" title="${title || ''}" style="max-width: 100%; max-height: 480px; border-radius: 4px; display: block; margin: 1em 0;"></video>`;
      }

      // Fallback to default renderer for other links
      // Use 'this' to pass the correct renderer instance (with parser) to the original function
      return renderer.link.call(this, { href, title, tokens } as any);
    };

    marked.use({ renderer: customRenderer });

    if (ref.current) {
      // 1. Markdown Parsing
      const html = marked.parse(content || '', { async: false }) as string;

      // 2. Post-process HTML to replace wikilinks with clickable spans
      const processedHtml = html.replace(
        /\[\[([^\]]+)(?:\|([^\]]+))?\]\]/g,
        (match: string, target: string, alias: string) => {
          // Skip escaped links
          if (match.startsWith('\\')) return match.substring(1);
          const displayText = alias || target;
          return `<span class="wikilink" data-wikilink="${target}" style="color: var(--md-primary-color, #0969da); cursor: pointer; font-weight: 500; background: var(--md-primary-bg-color, rgba(9, 105, 218, 0.1)); padding: 0 2px; border-radius: 3px;">${displayText}</span>`;
        }
      );

      ref.current.innerHTML = processedHtml;

      // 3. Syntax Highlighting
      ref.current.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });

      // 4. Attach wikilink click handlers
      ref.current.querySelectorAll('.wikilink').forEach((wikilinkEl) => {
        wikilinkEl.addEventListener('click', (e) => {
          e.preventDefault();
          const target = (wikilinkEl as HTMLElement).getAttribute('data-wikilink');
          if (target && handleWikilinkClick) {
            handleWikilinkClick(e as MouseEvent, target);
          }
        });
      });

      // 4. Mermaid Rendering
      const mermaidBlocks = ref.current.querySelectorAll('code.language-mermaid');
      const mermaidDivs: HTMLElement[] = [];

      mermaidBlocks.forEach((block, index) => {
        const pre = block.parentElement;
        if (pre) {
          const div = document.createElement('div');
          div.className = 'mermaid';
          div.textContent = block.textContent || '';
          div.id = `mermaid-${Date.now()}-${index}`;
          pre.replaceWith(div);
          mermaidDivs.push(div);
        }
      });

      // Only run mermaid if there are blocks and they're in the DOM
      if (mermaidDivs.length > 0 && document.body.contains(ref.current)) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          try {
            // Filter out any elements that might have been removed
            const validElements = mermaidDivs.filter(div => document.body.contains(div));

            if (validElements.length > 0) {
              mermaid.run({
                nodes: validElements
              }).catch((error: Error) => {
                console.warn('Mermaid rendering error:', error.message);
              });
            }
          } catch (error) {
            console.warn('Mermaid execution error:', error);
          }
        });
      }
    }
  }, [content, fileType]);

  // Search Highlighting Logic - Runs AFTER content rendering
  // We separate this from the render effect so it can update when just the query changes
  // But we also need to ensure it runs after content update. 
  // Since this effect is defined AFTER the one above, consistent ordering should help,
  // but we also rely on the fact that if content changes, both fire, 
  // and we might want to debounce slightly to ensure DOM is ready.
  useEffect(() => {
    if (!ref.current) return;

    // Tiny timeout to ensure the render effect has finished DOM manipulation
    const timer = setTimeout(() => {
      if (!ref.current) return;

      // 1. Clean up: find all <mark class="search-highlight"> and unwrap them.
      // This resets the view to "clean" rendered state before applying new search
      const marks = ref.current.querySelectorAll('mark.search-highlight');
      marks.forEach(mark => {
        const parent = mark.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
          parent.normalize(); // Merge text nodes
        }
      });

      if (!searchQuery) {
        if (onMatchesFound) onMatchesFound(0);
        return;
      }

      let matchCount = 0;

      // Helper to safely highlight text nodes
      const highlightNode = (node: Node) => {
        if (node.nodeType === 3) { // Text node
          const text = node.nodeValue || '';
          if (!text) return;

          // Case insensitive search
          const lowerText = text.toLowerCase();
          const lowerQuery = searchQuery.toLowerCase();
          const index = lowerText.indexOf(lowerQuery);

          if (index >= 0) {
            // Found match
            matchCount++;

            const before = text.substring(0, index);
            const match = text.substring(index, index + searchQuery.length);
            const after = text.substring(index + searchQuery.length);

            const beforeNode = document.createTextNode(before);
            const afterNode = document.createTextNode(after);

            const mark = document.createElement('mark');
            mark.className = 'search-highlight';
            // Add inline styles to ensure visibility regardless of CSS issues
            mark.style.backgroundColor = '#fcd34d'; // yellow-300
            mark.style.color = 'black';
            mark.style.borderRadius = '2px';
            mark.style.padding = '0 2px';

            mark.textContent = match;

            // If this is the current match, highlight it specially
            if (currentMatchIndex === matchCount) {
              mark.classList.add('active-match');
              mark.style.boxShadow = '0 0 0 2px #3b82f6'; // blue-500 ring

              // Scroll into view
              requestAnimationFrame(() => {
                mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
              });
            }

            const frag = document.createDocumentFragment();
            frag.appendChild(beforeNode);
            frag.appendChild(mark);
            frag.appendChild(afterNode);

            node.parentNode?.replaceChild(frag, node);

            // Continue highlighting in the 'after' part (Recursion)
            if (after.toLowerCase().indexOf(lowerQuery) >= 0) {
              highlightNode(afterNode);
            }
          }
        } else if (node.nodeType === 1) {
          const el = node as Element;
          // Skip existing marks or scripts/styles/mermaids
          if (el.tagName !== 'MARK' && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE' &&
            !el.classList.contains('mermaid') && !el.tagName.startsWith('PRE')) {
            // Note: Arrays.from is important because childNodes is live
            Array.from(node.childNodes).forEach(highlightNode);
          }
        }
      };

      highlightNode(ref.current);

      if (onMatchesFound) onMatchesFound(matchCount);

    }, 50); // 50ms delay

    return () => clearTimeout(timer);
  }, [searchQuery, currentMatchIndex, content, fileType]); // Dependencies

  const getThemeClass = () => {
    if (!uiStore.markdownTheme || uiStore.markdownTheme === 'default') {
      return 'prose dark:prose-invert max-w-none p-6 md:p-10 lg:p-12';
    }
    return `markdown-theme-container md-style-${uiStore.markdownTheme} p-6 md:p-10 lg:p-12`;
  };

  const themeStyles = {
    '--md-primary-color': uiStore.themeColor,
    '--md-primary-bg-color': `${uiStore.themeColor}15`, // 15 is hex alpha ~8%
  } as React.CSSProperties;

  return (
    <div
      className={getThemeClass()}
      style={themeStyles}
      ref={ref}
    />
  );
}));
