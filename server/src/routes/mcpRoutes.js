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
  let transport;
  let server;
  try {
    server = createMcpServer(req.user.id);
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on('close', () => {
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    Logger.error('Error handling MCP request:', error);
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
