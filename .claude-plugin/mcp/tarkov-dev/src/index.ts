#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const TARKOV_API = 'https://api.tarkov.dev/graphql';
const DEFAULT_MODE = process.env.TARKOV_MCP_MODE || 'concise';
const DEFAULT_LIMIT = 10;

type Mode = 'concise' | 'full';

interface ToolParams {
  mode?: Mode;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

async function graphqlQuery<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(TARKOV_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json() as { data: T; errors?: Array<{ message: string }> };
  if (json.errors && !json.data) {
    throw new Error(json.errors.map(e => e.message).join(', '));
  }
  return json.data;
}

function getMode(params: ToolParams): Mode {
  return params.mode || (DEFAULT_MODE as Mode);
}

function paginate<T>(items: T[], params: ToolParams, mode: Mode): { items: T[]; total: number; hasMore: boolean } {
  const total = items.length;
  if (mode === 'full') {
    return { items, total, hasMore: false };
  }
  const limit = params.limit || DEFAULT_LIMIT;
  const offset = params.offset || 0;
  const paginated = items.slice(offset, offset + limit);
  return { items: paginated, total, hasMore: offset + limit < total };
}

function formatItemConcise(item: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {
    id: item.id,
    name: item.name,
    shortName: item.shortName,
    basePrice: item.basePrice,
    category: (item.category as Record<string, unknown>)?.name,
  };
  if (item.avg24hPrice) result.avg24hPrice = item.avg24hPrice;
  return result;
}

function formatAmmoConcise(ammo: Record<string, unknown>): Record<string, unknown> {
  return {
    id: ammo.id,
    name: ammo.name,
    shortName: ammo.shortName,
    caliber: ammo.caliber,
    damage: ammo.damage,
    penetrationPower: ammo.penetrationPower,
    armorDamage: ammo.armorDamage,
  };
}

function formatTaskConcise(task: Record<string, unknown>): Record<string, unknown> {
  return {
    id: task.id,
    name: task.name,
    trader: (task.trader as Record<string, unknown>)?.name,
    map: (task.map as Record<string, unknown>)?.name || 'Any',
    experience: task.experience,
    minPlayerLevel: task.minPlayerLevel,
  };
}

function formatBossConcise(boss: Record<string, unknown>): Record<string, unknown> {
  const health = boss.health as Array<{ bodyPart: string; max: number }> || [];
  return {
    id: boss.id,
    name: boss.name,
    spawnChance: boss.spawnChance,
    spawnLocations: (boss.spawnLocations as Array<{ name: string }>)?.map(l => l.name),
    totalHealth: health.reduce((sum, h) => sum + h.max, 0),
  };
}

const server = new Server(
  { name: 'tarkov-dev', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'search_items',
      description: 'Search for items by name or keyword. Returns matching items with basic info.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term (item name or keyword)' },
          mode: { type: 'string', enum: ['concise', 'full'], description: 'Response detail level' },
          limit: { type: 'number', description: 'Max results (concise mode, default 10)' },
          offset: { type: 'number', description: 'Skip first N results for pagination' },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_item',
      description: 'Get detailed info for a specific item by ID or exact name.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Item ID or exact name' },
          mode: { type: 'string', enum: ['concise', 'full'], description: 'Response detail level' },
        },
        required: ['id'],
      },
    },
    {
      name: 'get_items_by_category',
      description: 'Get items filtered by category (ammo, weapon, armor, medical, keys, etc).',
      inputSchema: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Category name (e.g., "assault-rifle", "ammo", "armor")' },
          mode: { type: 'string', enum: ['concise', 'full'], description: 'Response detail level' },
          limit: { type: 'number', description: 'Max results (concise mode)' },
          offset: { type: 'number', description: 'Skip first N results' },
        },
        required: ['category'],
      },
    },
    {
      name: 'get_tasks',
      description: 'Get all tasks/quests, optionally filtered by trader or map.',
      inputSchema: {
        type: 'object',
        properties: {
          trader: { type: 'string', description: 'Filter by trader name (e.g., "Prapor", "Therapist")' },
          map: { type: 'string', description: 'Filter by map name (e.g., "Customs", "Shoreline")' },
          mode: { type: 'string', enum: ['concise', 'full'], description: 'Response detail level' },
          limit: { type: 'number', description: 'Max results (concise mode)' },
          offset: { type: 'number', description: 'Skip first N results' },
        },
      },
    },
    {
      name: 'get_task',
      description: 'Get detailed info for a specific task by ID or name.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Task ID or name' },
          mode: { type: 'string', enum: ['concise', 'full'], description: 'Response detail level' },
        },
        required: ['id'],
      },
    },
    {
      name: 'get_traders',
      description: 'Get all traders with their loyalty levels and info.',
      inputSchema: {
        type: 'object',
        properties: {
          mode: { type: 'string', enum: ['concise', 'full'], description: 'Response detail level' },
        },
      },
    },
    {
      name: 'get_hideout_stations',
      description: 'Get all hideout stations/modules with their levels and requirements.',
      inputSchema: {
        type: 'object',
        properties: {
          mode: { type: 'string', enum: ['concise', 'full'], description: 'Response detail level' },
        },
      },
    },
    {
      name: 'get_maps',
      description: 'Get all maps with extracts, spawns, and boss info.',
      inputSchema: {
        type: 'object',
        properties: {
          mode: { type: 'string', enum: ['concise', 'full'], description: 'Response detail level' },
        },
      },
    },
    {
      name: 'get_barters',
      description: 'Get barter trades, optionally filtered by trader.',
      inputSchema: {
        type: 'object',
        properties: {
          trader: { type: 'string', description: 'Filter by trader name' },
          mode: { type: 'string', enum: ['concise', 'full'], description: 'Response detail level' },
          limit: { type: 'number', description: 'Max results (concise mode)' },
          offset: { type: 'number', description: 'Skip first N results' },
        },
      },
    },
    {
      name: 'get_crafts',
      description: 'Get hideout crafts, optionally filtered by station.',
      inputSchema: {
        type: 'object',
        properties: {
          station: { type: 'string', description: 'Filter by station name (e.g., "Workbench", "Lavatory")' },
          mode: { type: 'string', enum: ['concise', 'full'], description: 'Response detail level' },
          limit: { type: 'number', description: 'Max results (concise mode)' },
          offset: { type: 'number', description: 'Skip first N results' },
        },
      },
    },
    {
      name: 'get_ammo',
      description: 'Get ammunition with penetration, damage, and ballistic stats. Filter by caliber.',
      inputSchema: {
        type: 'object',
        properties: {
          caliber: { type: 'string', description: 'Filter by caliber (e.g., "7.62x39mm", "5.56x45mm")' },
          mode: { type: 'string', enum: ['concise', 'full'], description: 'Response detail level' },
          limit: { type: 'number', description: 'Max results (concise mode)' },
          offset: { type: 'number', description: 'Skip first N results' },
        },
      },
    },
    {
      name: 'get_boss',
      description: 'Get boss info including health by body part, gear, weapons, and spawn locations.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Boss name (e.g., "Killa", "Reshala", "Tagilla")' },
          mode: { type: 'string', enum: ['concise', 'full'], description: 'Response detail level' },
        },
        required: ['name'],
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
      case 'search_items': {
        const query = `
          query($name: String!) {
            items(name: $name) {
              id name shortName basePrice avg24hPrice
              category { name }
              types
              weight width height
              wikiLink
            }
          }
        `;
        const data = await graphqlQuery<{ items: Record<string, unknown>[] }>(query, { name: params.query });
        const { items, total, hasMore } = paginate(data.items, params, mode);
        const formatted = mode === 'concise' ? items.map(formatItemConcise) : items;
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              total,
              showing: items.length,
              ...(hasMore && { hint: `Use offset=${(params.offset || 0) + items.length} for more results` }),
              items: formatted,
            }, null, 2),
          }],
        };
      }

      case 'get_item': {
        const query = `
          query($id: [ID]) {
            items(ids: $id) {
              id name shortName normalizedName
              description basePrice avg24hPrice low24hPrice high24hPrice
              category { name }
              types weight width height
              wikiLink gridImageLink
              sellFor { vendor { name } price priceRUB }
              buyFor { vendor { name } price priceRUB }
              usedInTasks { id name }
              receivedFromTasks { id name }
              bartersFor { id }
              bartersUsing { id }
              craftsFor { id }
              craftsUsing { id }
            }
          }
        `;
        const data = await graphqlQuery<{ items: Record<string, unknown>[] }>(query, { id: [params.id] });
        if (data.items.length === 0) {
          const searchQuery = `query($name: String!) { items(name: $name, limit: 1) { id name } }`;
          const searchData = await graphqlQuery<{ items: Record<string, unknown>[] }>(searchQuery, { name: params.id });
          if (searchData.items.length > 0) {
            const fullData = await graphqlQuery<{ items: Record<string, unknown>[] }>(query, { id: [searchData.items[0].id] });
            const item = fullData.items[0];
            return { content: [{ type: 'text', text: JSON.stringify(mode === 'concise' ? formatItemConcise(item) : item, null, 2) }] };
          }
          return { content: [{ type: 'text', text: 'Item not found' }] };
        }
        const item = data.items[0];
        return { content: [{ type: 'text', text: JSON.stringify(mode === 'concise' ? formatItemConcise(item) : item, null, 2) }] };
      }

      case 'get_items_by_category': {
        const query = `
          query($category: ItemCategoryName!) {
            items(categoryNames: [$category]) {
              id name shortName basePrice avg24hPrice
              category { name }
            }
          }
        `;
        const data = await graphqlQuery<{ items: Record<string, unknown>[] }>(query, { category: params.category });
        const { items, total, hasMore } = paginate(data.items, params, mode);
        const formatted = mode === 'concise' ? items.map(formatItemConcise) : items;
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ total, showing: items.length, ...(hasMore && { hint: `Use offset=${(params.offset || 0) + items.length} for more` }), items: formatted }, null, 2),
          }],
        };
      }

      case 'get_tasks': {
        const query = `
          query {
            tasks {
              id name normalizedName
              trader { name }
              map { name }
              experience minPlayerLevel
              objectives { id description type optional }
              startRewards { items { item { name } count } }
              finishRewards { items { item { name } count } experience traderStanding { trader { name } standing } }
            }
          }
        `;
        let data = await graphqlQuery<{ tasks: Record<string, unknown>[] }>(query);
        let tasks = data.tasks;
        if (params.trader) {
          const traderLower = (params.trader as string).toLowerCase();
          tasks = tasks.filter(t => ((t.trader as Record<string, unknown>)?.name as string)?.toLowerCase() === traderLower);
        }
        if (params.map) {
          const mapLower = (params.map as string).toLowerCase();
          tasks = tasks.filter(t => ((t.map as Record<string, unknown>)?.name as string)?.toLowerCase().includes(mapLower));
        }
        const { items, total, hasMore } = paginate(tasks, params, mode);
        const formatted = mode === 'concise' ? items.map(formatTaskConcise) : items;
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ total, showing: items.length, ...(hasMore && { hint: `Use offset=${(params.offset || 0) + items.length} for more` }), tasks: formatted }, null, 2),
          }],
        };
      }

      case 'get_task': {
        const query = `
          query {
            tasks {
              id name normalizedName
              trader { name }
              map { name }
              experience minPlayerLevel
              wikiLink
              objectives { id description type optional maps { name } }
              startRewards { items { item { name } count } }
              finishRewards {
                items { item { name } count }
                experience
                traderStanding { trader { name } standing }
                skillLevelReward { name level }
              }
              taskRequirements { task { name } status }
            }
          }
        `;
        const data = await graphqlQuery<{ tasks: Record<string, unknown>[] }>(query);
        const idLower = (params.id as string).toLowerCase();
        const task = data.tasks.find(t =>
          (t.id as string) === params.id ||
          (t.normalizedName as string)?.toLowerCase() === idLower ||
          (t.name as string)?.toLowerCase().includes(idLower)
        );
        if (!task) {
          return { content: [{ type: 'text', text: 'Task not found' }] };
        }
        return { content: [{ type: 'text', text: JSON.stringify(mode === 'concise' ? formatTaskConcise(task) : task, null, 2) }] };
      }

      case 'get_traders': {
        const query = `
          query {
            traders {
              id name normalizedName
              description
              imageLink
              levels {
                level
                requiredPlayerLevel
                requiredReputation
                requiredCommerce
              }
              resetTime
            }
          }
        `;
        const data = await graphqlQuery<{ traders: Record<string, unknown>[] }>(query);
        const formatted = mode === 'concise'
          ? data.traders.map(t => ({ id: t.id, name: t.name, levels: (t.levels as Array<Record<string, unknown>>)?.length }))
          : data.traders;
        return { content: [{ type: 'text', text: JSON.stringify({ traders: formatted }, null, 2) }] };
      }

      case 'get_hideout_stations': {
        const query = `
          query {
            hideoutStations {
              id name normalizedName
              levels {
                level
                constructionTime
                itemRequirements { item { name } count }
                stationLevelRequirements { station { name } level }
                traderRequirements { trader { name } level }
                skillRequirements { name level }
                crafts { id }
              }
            }
          }
        `;
        const data = await graphqlQuery<{ hideoutStations: Record<string, unknown>[] }>(query);
        const formatted = mode === 'concise'
          ? data.hideoutStations.map(s => ({
              id: s.id,
              name: s.name,
              maxLevel: (s.levels as Array<Record<string, unknown>>)?.length,
            }))
          : data.hideoutStations;
        return { content: [{ type: 'text', text: JSON.stringify({ stations: formatted }, null, 2) }] };
      }

      case 'get_maps': {
        const query = `
          query {
            maps {
              id name normalizedName
              description
              wiki
              raidDuration
              players
              bosses { name spawnChance spawnLocations { name } }
              spawns { zoneName position { x y z } categories }
              extracts { name faction }
            }
          }
        `;
        const data = await graphqlQuery<{ maps: Record<string, unknown>[] }>(query);
        const formatted = mode === 'concise'
          ? data.maps.map(m => ({
              id: m.id,
              name: m.name,
              raidDuration: m.raidDuration,
              players: m.players,
              bosses: (m.bosses as Array<Record<string, unknown>>)?.map(b => b.name),
              extractCount: (m.extracts as Array<Record<string, unknown>>)?.length,
            }))
          : data.maps;
        return { content: [{ type: 'text', text: JSON.stringify({ maps: formatted }, null, 2) }] };
      }

      case 'get_barters': {
        const query = `
          query {
            barters {
              id
              trader { name }
              level
              rewardItems { item { name shortName } count }
              requiredItems { item { name shortName } count }
            }
          }
        `;
        let data = await graphqlQuery<{ barters: Record<string, unknown>[] }>(query);
        let barters = data.barters;
        if (params.trader) {
          const traderLower = (params.trader as string).toLowerCase();
          barters = barters.filter(b => ((b.trader as Record<string, unknown>)?.name as string)?.toLowerCase() === traderLower);
        }
        const { items, total, hasMore } = paginate(barters, params, mode);
        const formatted = mode === 'concise'
          ? items.map(b => ({
              trader: (b.trader as Record<string, unknown>)?.name,
              level: b.level,
              gives: (b.rewardItems as Array<Record<string, unknown>>)?.map(r => `${(r.item as Record<string, unknown>)?.shortName} x${r.count}`).join(', '),
              requires: (b.requiredItems as Array<Record<string, unknown>>)?.map(r => `${(r.item as Record<string, unknown>)?.shortName} x${r.count}`).join(', '),
            }))
          : items;
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ total, showing: items.length, ...(hasMore && { hint: `Use offset for more` }), barters: formatted }, null, 2),
          }],
        };
      }

      case 'get_crafts': {
        const query = `
          query {
            crafts {
              id
              station { name }
              level
              duration
              rewardItems { item { name shortName } count }
              requiredItems { item { name shortName } count }
            }
          }
        `;
        let data = await graphqlQuery<{ crafts: Record<string, unknown>[] }>(query);
        let crafts = data.crafts;
        if (params.station) {
          const stationLower = (params.station as string).toLowerCase();
          crafts = crafts.filter(c => ((c.station as Record<string, unknown>)?.name as string)?.toLowerCase().includes(stationLower));
        }
        const { items, total, hasMore } = paginate(crafts, params, mode);
        const formatted = mode === 'concise'
          ? items.map(c => ({
              station: (c.station as Record<string, unknown>)?.name,
              level: c.level,
              duration: `${Math.round((c.duration as number) / 3600)}h`,
              produces: (c.rewardItems as Array<Record<string, unknown>>)?.map(r => `${(r.item as Record<string, unknown>)?.shortName} x${r.count}`).join(', '),
            }))
          : items;
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ total, showing: items.length, ...(hasMore && { hint: `Use offset for more` }), crafts: formatted }, null, 2),
          }],
        };
      }

      case 'get_ammo': {
        const query = `
          query {
            ammo {
              item { id name shortName wikiLink }
              caliber
              damage
              penetrationPower
              armorDamage
              fragmentationChance
              ricochetChance
              accuracyModifier
              recoilModifier
              tracer
              tracerColor
            }
          }
        `;
        let data = await graphqlQuery<{ ammo: Record<string, unknown>[] }>(query);
        let ammo = data.ammo;
        if (params.caliber) {
          const caliberLower = (params.caliber as string).toLowerCase().replace(/\s/g, '');
          ammo = ammo.filter(a => (a.caliber as string)?.toLowerCase().replace(/\s/g, '').includes(caliberLower));
        }
        const { items, total, hasMore } = paginate(ammo, params, mode);
        const formatted = mode === 'concise'
          ? items.map(a => ({
              name: (a.item as Record<string, unknown>)?.name,
              caliber: a.caliber,
              damage: a.damage,
              penetration: a.penetrationPower,
              armorDamage: a.armorDamage,
            }))
          : items;
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ total, showing: items.length, ...(hasMore && { hint: `Use offset for more` }), ammo: formatted }, null, 2),
          }],
        };
      }

      case 'get_boss': {
        const bossQuery = `
          query {
            bosses {
              name normalizedName
              health { bodyPart max }
              equipment { item { name shortName } }
              items { name shortName }
            }
          }
        `;
        const spawnQuery = `
          query {
            maps {
              name
              bosses {
                boss { name normalizedName }
                spawnChance
                spawnLocations { name }
                escorts { name amount { count chance } }
              }
            }
          }
        `;
        const [bossData, spawnData] = await Promise.all([
          graphqlQuery<{ bosses: Record<string, unknown>[] }>(bossQuery),
          graphqlQuery<{ maps: Array<{ name: string; bosses: Array<Record<string, unknown>> }> }>(spawnQuery),
        ]);
        const nameLower = (params.name as string).toLowerCase();
        const boss = bossData.bosses.find(b =>
          (b.name as string)?.toLowerCase().includes(nameLower) ||
          (b.normalizedName as string)?.toLowerCase().includes(nameLower)
        );
        if (!boss) {
          return { content: [{ type: 'text', text: `Boss "${params.name}" not found. Available: ${bossData.bosses.map(b => b.name).join(', ')}` }] };
        }
        const spawns: Array<{ map: string; spawnChance: number; locations: string[]; escorts: unknown[] }> = [];
        for (const map of spawnData.maps) {
          for (const bossSpawn of map.bosses || []) {
            const spawnBoss = bossSpawn.boss as Record<string, unknown>;
            if ((spawnBoss?.name as string)?.toLowerCase().includes(nameLower) ||
                (spawnBoss?.normalizedName as string)?.toLowerCase().includes(nameLower)) {
              spawns.push({
                map: map.name,
                spawnChance: bossSpawn.spawnChance as number,
                locations: ((bossSpawn.spawnLocations as Array<{ name: string }>) || []).map(l => l.name),
                escorts: bossSpawn.escorts as unknown[] || [],
              });
            }
          }
        }
        const health = boss.health as Array<{ bodyPart: string; max: number }> || [];
        const formatted = mode === 'concise'
          ? {
              name: boss.name,
              spawns: spawns.map(s => ({ map: s.map, chance: `${(s.spawnChance * 100).toFixed(0)}%`, locations: s.locations })),
              health: {
                total: health.reduce((sum, h) => sum + h.max, 0),
                byPart: Object.fromEntries(health.map(h => [h.bodyPart, h.max])),
              },
            }
          : {
              name: boss.name,
              normalizedName: boss.normalizedName,
              health: { total: health.reduce((sum, h) => sum + h.max, 0), byPart: health },
              equipment: boss.equipment,
              items: boss.items,
              spawns,
            };
        return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
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
  console.error('tarkov-dev MCP server running');
}

main().catch(console.error);
