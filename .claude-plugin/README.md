# tarkov-data

MCP servers for AI agents to query Escape from Tarkov game data.

## Components

### MCP Servers

- **tarkov-dev** - Query Tarkov.dev GraphQL API for items, tasks, traders, hideout, maps, ammo, bosses
- **eft-wiki** - Search and fetch EFT Wiki pages for lore, strategies, detailed mechanics

### Agent

- **tarkov-data-expert** - Specialized agent for complex Tarkov data queries

### Skill

- **tarkov-data-patterns** - Query patterns and best practices for using the tools

## Installation

```bash
cd /home/lab/.claude/plugins/tarkov-data
npm install
npm run build
```

Then build each MCP server:

```bash
cd mcp/tarkov-dev && npm install && npm run build
cd mcp/eft-wiki && npm install && npm run build
```

## Configuration

Set response mode via environment variable:

```env
TARKOV_MCP_MODE=concise  # or "full"
```

- `concise` - Paginated results, essential fields only (default, good for bots)
- `full` - All data, all fields (good for development)

## Tools

### tarkov-dev

| Tool | Description |
|------|-------------|
| `search_items` | Find items by name/keyword |
| `get_item` | Get full item details |
| `get_items_by_category` | Filter items by category |
| `get_tasks` | Get tasks, filterable by trader/map |
| `get_task` | Get single task details |
| `get_traders` | Get trader info and levels |
| `get_hideout_stations` | Get hideout modules |
| `get_maps` | Get map info, extracts, bosses |
| `get_barters` | Get barter trades |
| `get_crafts` | Get hideout crafts |
| `get_ammo` | Get ammo with pen/damage stats |
| `get_boss` | Get boss stats, health, gear, spawns |

### eft-wiki

| Tool | Description |
|------|-------------|
| `search_wiki` | Search for wiki pages |
| `get_wiki_page` | Get full page as structured markdown |
| `get_wiki_section` | Get specific section from a page |

## Response Modes

All tools accept optional `mode` parameter to override the default:

```
get_items_by_category("assault_rifle", mode="concise")
```

### Concise Mode

- Lists: First 10 items + total count
- Items: Key stats only
- Supports `limit` and `offset` for pagination

### Full Mode

- Lists: All items
- Items: All properties
- Includes related data
