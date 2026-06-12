#!/usr/bin/env node
/*
 * Standalone smoke test for the ByteStash MCP endpoint.
 *
 * It drives the JSON-RPC handshake and a full create -> list -> get -> update ->
 * delete round trip against a *running* ByteStash server, then checks that a bad
 * API key is rejected. No dependencies (uses global fetch); run it before opening a PR.
 *
 * Usage:
 *   BYTESTASH_API_KEY=<key> node server/scripts/mcp-smoke.mjs
 *   BYTESTASH_URL=https://my-host BYTESTASH_API_KEY=<key> node server/scripts/mcp-smoke.mjs
 *
 * Get an API key from the UI (Settings -> API Keys) or your instance's REST API.
 */

const BASE = (process.env.BYTESTASH_URL || 'http://localhost:5000').replace(/\/$/, '');
const KEY = process.env.BYTESTASH_API_KEY;
const MCP_URL = `${BASE}/mcp`;

if (!KEY) {
  console.error('Set BYTESTASH_API_KEY (and optionally BYTESTASH_URL).');
  process.exit(2);
}

let passed = 0;
let failed = 0;
let rpcId = 0;

function check(name, condition, detail) {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

// Streamable HTTP returns either application/json or an SSE frame; handle both.
async function readBody(res) {
  const text = await res.text();
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('text/event-stream')) {
    const line = text.split('\n').find((l) => l.startsWith('data:'));
    return line ? JSON.parse(line.slice(5).trim()) : null;
  }
  return text ? JSON.parse(text) : null;
}

async function rpc(method, params, { key = KEY } = {}) {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }),
  });
  return { status: res.status, body: await readBody(res) };
}

// Tool results carry their payload as JSON text in content[0].text.
function toolJson(body) {
  const text = body?.result?.content?.[0]?.text;
  return text ? JSON.parse(text) : null;
}

async function main() {
  console.log(`Testing MCP endpoint: ${MCP_URL}\n`);

  // 1. initialize
  const init = await rpc('initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'mcp-smoke', version: '1.0' },
  });
  check('initialize returns serverInfo', init.body?.result?.serverInfo?.name === 'bytestash',
    JSON.stringify(init.body));

  // 2. tools/list
  const list = await rpc('tools/list', {});
  const toolNames = (list.body?.result?.tools || []).map((t) => t.name).sort();
  const expected = ['create_snippet', 'delete_snippet', 'get_snippet', 'list_metadata', 'list_snippets', 'update_snippet'];
  check('tools/list exposes all tools', JSON.stringify(toolNames) === JSON.stringify(expected),
    toolNames.join(', '));

  // 3. create_snippet
  const marker = `mcp-smoke-${rpcId}`;
  const created = toolJson((await rpc('tools/call', {
    name: 'create_snippet',
    arguments: {
      title: marker,
      description: 'created by mcp-smoke',
      categories: ['smoke'],
      fragments: [{ file_name: 'a.js', language: 'javascript', code: 'const x = 1;' }],
    },
  })).body);
  const id = created?.id;
  check('create_snippet returns an id', Number.isInteger(id), JSON.stringify(created));

  // 4. list_snippets finds it
  const found = toolJson((await rpc('tools/call', {
    name: 'list_snippets', arguments: { search: marker },
  })).body);
  check('list_snippets finds the new snippet',
    !!found?.snippets?.some((s) => s.id === id));

  // 5. get_snippet returns the code
  const got = toolJson((await rpc('tools/call', {
    name: 'get_snippet', arguments: { id },
  })).body);
  check('get_snippet returns the fragment code',
    got?.fragments?.[0]?.code === 'const x = 1;');

  // 6. update_snippet changes the title
  const updated = toolJson((await rpc('tools/call', {
    name: 'update_snippet', arguments: { id, title: `${marker}-edited` },
  })).body);
  check('update_snippet applies partial change', updated?.title === `${marker}-edited`);

  // 7. delete_snippet (recycle)
  const deleted = toolJson((await rpc('tools/call', {
    name: 'delete_snippet', arguments: { id },
  })).body);
  check('delete_snippet recycles the snippet', deleted?.id === id && deleted?.recycled === true);

  // 8. auth: a bad key is rejected
  const bad = await rpc('tools/list', {}, { key: 'definitely-not-a-real-key' });
  check('invalid API key is rejected with 401', bad.status === 401, `got ${bad.status}`);

  // 9. auth: no key is rejected
  const none = await rpc('tools/list', {}, { key: null });
  check('missing API key is rejected with 401', none.status === 401, `got ${none.status}`);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error('\nSmoke test crashed:', err.message);
  process.exit(1);
});
