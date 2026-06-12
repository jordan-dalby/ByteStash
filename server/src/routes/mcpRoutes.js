import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from '../mcp/snippetMcpServer.js';
import Logger from '../logger.js';

const router = express.Router();

/*
 * Remote MCP endpoint using the Streamable HTTP transport in stateless mode.
 *
 * Stateless mode (no session id) creates a fresh server + transport per request and
 * returns the JSON-RPC response directly (enableJsonResponse). This keeps the endpoint
 * horizontally scalable and free of session bookkeeping, which is all these read/write
 * snippet tools need. `authenticateMcp` (mounted before this router) has already put the
 * authenticated user on req.user.
 */
router.post('/', async (req, res) => {
  let server = null;
  let transport = null;

  // Idempotent cleanup, shared by the normal-close listener and the error path,
  // so resources are released exactly once whichever fires first (a throwing
  // second close() in the 'close' listener would otherwise be uncaught).
  let closed = false;
  const cleanup = () => {
    if (closed) return;
    closed = true;
    if (transport) {
      try { transport.close(); } catch { /* ignore cleanup errors */ }
    }
    if (server) {
      try { server.close(); } catch { /* ignore cleanup errors */ }
    }
  };

  res.on('close', cleanup);

  try {
    server = createMcpServer(req.user.id);
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    Logger.error('Error handling MCP request:', error);
    cleanup();
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      });
    }
  }
});

// Stateless mode does not support server-initiated streams or session teardown.
function methodNotAllowed(req, res) {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed. Use POST for MCP requests.' },
    id: null,
  });
}

router.get('/', methodNotAllowed);
router.delete('/', methodNotAllowed);

export default router;
