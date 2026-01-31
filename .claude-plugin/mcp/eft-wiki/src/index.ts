#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { parse, HTMLElement } from 'node-html-parser';

const WIKI_BASE = 'https://escapefromtarkov.fandom.com';
const WIKI_API = `${WIKI_BASE}/api.php`;
const DEFAULT_MODE = process.env.TARKOV_MCP_MODE || 'concise';

type Mode = 'concise' | 'full';

interface ToolParams {
  mode?: Mode;
  [key: string]: unknown;
}

interface SearchResult {
  title: string;
  pageid: number;
  snippet: string;
  url: string;
}

interface WikiSection {
  level: number;
  title: string;
  content: string;
}

function getMode(params: ToolParams): Mode {
  return params.mode || (DEFAULT_MODE as Mode);
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\[\d+\]/g, '')
    .trim();
}

function htmlToMarkdown(element: HTMLElement, depth = 0): string {
  let result = '';

  for (const child of element.childNodes) {
    if (child.nodeType === 3) {
      result += child.text;
      continue;
    }

    if (!(child instanceof HTMLElement)) continue;

    const tag = child.tagName?.toLowerCase();

    switch (tag) {
      case 'h1':
        result += `\n# ${cleanText(child.text)}\n`;
        break;
      case 'h2':
        result += `\n## ${cleanText(child.text)}\n`;
        break;
      case 'h3':
        result += `\n### ${cleanText(child.text)}\n`;
        break;
      case 'h4':
        result += `\n#### ${cleanText(child.text)}\n`;
        break;
      case 'p':
        result += `\n${cleanText(child.text)}\n`;
        break;
      case 'ul':
      case 'ol':
        result += '\n';
        child.querySelectorAll(':scope > li').forEach((li, i) => {
          const prefix = tag === 'ol' ? `${i + 1}. ` : '- ';
          result += `${prefix}${cleanText(li.text)}\n`;
        });
        break;
      case 'table':
        const rows = child.querySelectorAll('tr');
        if (rows.length > 0) {
          result += '\n';
          rows.forEach((row, i) => {
            const cells = row.querySelectorAll('th, td');
            const cellTexts = cells.map(c => cleanText(c.text).substring(0, 50));
            result += `| ${cellTexts.join(' | ')} |\n`;
            if (i === 0) {
              result += `| ${cellTexts.map(() => '---').join(' | ')} |\n`;
            }
          });
        }
        break;
      case 'div':
        if (!child.classList.contains('navbox') && !child.classList.contains('mw-references-wrap')) {
          result += htmlToMarkdown(child, depth + 1);
        }
        break;
      case 'a':
        const href = child.getAttribute('href');
        const text = cleanText(child.text);
        if (href && href.startsWith('/wiki/') && text) {
          result += `[${text}](${WIKI_BASE}${href})`;
        } else {
          result += text;
        }
        break;
      case 'b':
      case 'strong':
        result += `**${cleanText(child.text)}**`;
        break;
      case 'i':
      case 'em':
        result += `*${cleanText(child.text)}*`;
        break;
      case 'br':
        result += '\n';
        break;
      case 'span':
      case 'small':
        result += cleanText(child.text);
        break;
      default:
        if (child.text) {
          result += htmlToMarkdown(child, depth + 1);
        }
    }
  }

  return result;
}

function extractInfobox(root: HTMLElement): Record<string, string> | null {
  const infobox = root.querySelector('.portable-infobox, .infobox, .infoboxtable');
  if (!infobox) return null;

  const data: Record<string, string> = {};

  infobox.querySelectorAll('.pi-item, tr').forEach(item => {
    const label = item.querySelector('.pi-data-label, th')?.text?.trim();
    const value = item.querySelector('.pi-data-value, td')?.text?.trim();
    if (label && value) {
      data[label] = cleanText(value);
    }
  });

  const title = infobox.querySelector('.pi-title, .infobox-title')?.text?.trim();
  if (title) {
    data['_title'] = title;
  }

  return Object.keys(data).length > 0 ? data : null;
}

function extractSections(root: HTMLElement): WikiSection[] {
  const sections: WikiSection[] = [];
  const content = root.querySelector('.mw-parser-output');
  if (!content) return sections;

  let currentSection: WikiSection = { level: 0, title: 'Introduction', content: '' };

  for (const child of content.childNodes) {
    if (!(child instanceof HTMLElement)) continue;

    const tag = child.tagName?.toLowerCase();
    const headingMatch = tag?.match(/^h(\d)$/);

    if (headingMatch) {
      if (currentSection.content.trim()) {
        sections.push(currentSection);
      }
      currentSection = {
        level: parseInt(headingMatch[1]),
        title: cleanText(child.text),
        content: '',
      };
    } else if (!child.classList.contains('toc') &&
               !child.classList.contains('navbox') &&
               !child.classList.contains('mw-references-wrap')) {
      currentSection.content += htmlToMarkdown(child);
    }
  }

  if (currentSection.content.trim()) {
    sections.push(currentSection);
  }

  return sections;
}

async function searchWiki(query: string, limit = 10): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: String(limit),
    format: 'json',
    origin: '*',
  });

  const response = await fetch(`${WIKI_API}?${params}`);
  const data = await response.json() as {
    query?: { search?: Array<{ title: string; pageid: number; snippet: string }> };
  };

  if (!data.query?.search) return [];

  return data.query.search.map(result => ({
    title: result.title,
    pageid: result.pageid,
    snippet: cleanText(result.snippet.replace(/<[^>]*>/g, '')),
    url: `${WIKI_BASE}/wiki/${encodeURIComponent(result.title.replace(/ /g, '_'))}`,
  }));
}

async function fetchWikiPage(titleOrUrl: string): Promise<{ title: string; html: string; url: string } | null> {
  let title = titleOrUrl;

  if (titleOrUrl.includes('wiki/')) {
    const match = titleOrUrl.match(/wiki\/([^#?]+)/);
    if (match) {
      title = decodeURIComponent(match[1].replace(/_/g, ' '));
    }
  }

  const params = new URLSearchParams({
    action: 'parse',
    page: title,
    format: 'json',
    origin: '*',
    prop: 'text',
  });

  const response = await fetch(`${WIKI_API}?${params}`);
  const data = await response.json() as {
    parse?: { title: string; text: { '*': string } };
    error?: { info: string };
  };

  if (data.error) {
    return null;
  }

  if (!data.parse) return null;

  return {
    title: data.parse.title,
    html: data.parse.text['*'],
    url: `${WIKI_BASE}/wiki/${encodeURIComponent(data.parse.title.replace(/ /g, '_'))}`,
  };
}

const server = new Server(
  { name: 'eft-wiki', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'search_wiki',
      description: 'Search the Escape from Tarkov Wiki for pages matching a query. Returns page titles, snippets, and URLs.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term (character name, item, mechanic, etc.)' },
          limit: { type: 'number', description: 'Max results (default 10)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_wiki_page',
      description: 'Fetch a wiki page and return its content as structured markdown with infobox data extracted.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Page title or full wiki URL' },
          mode: { type: 'string', enum: ['concise', 'full'], description: 'concise: summary + infobox; full: complete page' },
        },
        required: ['title'],
      },
    },
    {
      name: 'get_wiki_section',
      description: 'Fetch a specific section from a wiki page (e.g., "Background", "Tactics", "Behavior").',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Page title or full wiki URL' },
          section: { type: 'string', description: 'Section name to extract (e.g., "Background", "Lore", "Tactics")' },
        },
        required: ['title', 'section'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const params = (args || {}) as ToolParams;
  const mode = getMode(params);

  try {
    switch (name) {
      case 'search_wiki': {
        const results = await searchWiki(params.query as string, (params.limit as number) || 10);
        if (results.length === 0) {
          return { content: [{ type: 'text', text: `No wiki pages found for "${params.query}"` }] };
        }
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              query: params.query,
              results: results.map(r => ({
                title: r.title,
                snippet: r.snippet,
                url: r.url,
              })),
            }, null, 2),
          }],
        };
      }

      case 'get_wiki_page': {
        const page = await fetchWikiPage(params.title as string);
        if (!page) {
          return { content: [{ type: 'text', text: `Page not found: "${params.title}"` }] };
        }

        const root = parse(page.html);
        const infobox = extractInfobox(root);
        const sections = extractSections(root);

        if (mode === 'concise') {
          const intro = sections.find(s => s.title === 'Introduction')?.content?.substring(0, 1000) || '';
          const sectionList = sections.filter(s => s.title !== 'Introduction').map(s => s.title);

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                title: page.title,
                url: page.url,
                ...(infobox && { infobox }),
                summary: cleanText(intro),
                sections: sectionList,
                hint: 'Use get_wiki_section to fetch specific sections',
              }, null, 2),
            }],
          };
        }

        const fullContent = sections.map(s => {
          const prefix = '#'.repeat(Math.min(s.level || 2, 4));
          return `${prefix} ${s.title}\n${s.content}`;
        }).join('\n\n');

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              title: page.title,
              url: page.url,
              ...(infobox && { infobox }),
              content: fullContent,
            }, null, 2),
          }],
        };
      }

      case 'get_wiki_section': {
        const page = await fetchWikiPage(params.title as string);
        if (!page) {
          return { content: [{ type: 'text', text: `Page not found: "${params.title}"` }] };
        }

        const root = parse(page.html);
        const sections = extractSections(root);
        const sectionName = (params.section as string).toLowerCase();

        const section = sections.find(s => s.title.toLowerCase().includes(sectionName));
        if (!section) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                error: `Section "${params.section}" not found`,
                availableSections: sections.map(s => s.title),
              }, null, 2),
            }],
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              page: page.title,
              section: section.title,
              content: section.content.trim(),
            }, null, 2),
          }],
        };
      }

      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('eft-wiki MCP server running');
}

main().catch(console.error);
