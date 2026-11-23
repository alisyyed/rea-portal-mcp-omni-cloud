/**
 * 555 Universal Cloud MCP Foundry v4.0 - Zero-Cache Edge-Smart Worker Router
 * Engine: Methodology Engine (Https-Rea-Tools-Https) MCP (rea-portal)
 */
const GITHUB_API_LIVE_JSON_URL = "https://api.github.com/repos/alisyyed/rea-portal-mcp-omni-cloud/contents/LIVE_MCP_URL.json?ref=main";
const GITHUB_RAW_LIVE_JSON_URL = "https://raw.githubusercontent.com/alisyyed/rea-portal-mcp-omni-cloud/main/LIVE_MCP_URL.json";
const GITHUB_DISPATCH_URL = "https://api.github.com/repos/alisyyed/rea-portal-mcp-omni-cloud/actions/workflows/perpetual_relay.yml/dispatches";
const AUTO_WAKE_GH_TOKEN = "";
const EDGE_CURATED_TOOLS = [{"name": "methodology_status_and_smod_tree", "description": "[Methodology Engine (Https-Rea-Tools-Https) MCP] Inspect SMod0-SMod9 hierarchy, SMd1a/b/c containers, and rules.", "inputSchema": {"type": "object", "properties": {"query": {"type": "string", "description": "Primary input query, URL, command, SQL statement, or text to process."}, "options_json": {"type": "string", "description": "Optional JSON object string with extra parameters (e.g. '{\"eval_js\": \"document.title\"}')."}}}}, {"name": "methodology_predict_errors", "description": "[Methodology Engine (Https-Rea-Tools-Https) MCP] Run pre-flight error prediction across nested sub-modules.", "inputSchema": {"type": "object", "properties": {"query": {"type": "string", "description": "Primary input query, URL, command, SQL statement, or text to process."}, "options_json": {"type": "string", "description": "Optional JSON object string with extra parameters (e.g. '{\"eval_js\": \"document.title\"}')."}}}}, {"name": "methodology_revert_smod0_baseline", "description": "[Methodology Engine (Https-Rea-Tools-Https) MCP] Revert state to clean SMod0 baseline upon constraint violation.", "inputSchema": {"type": "object", "properties": {"query": {"type": "string", "description": "Primary input query, URL, command, SQL statement, or text to process."}, "options_json": {"type": "string", "description": "Optional JSON object string with extra parameters (e.g. '{\"eval_js\": \"document.title\"}')."}}}}, {"name": "methodology_obscura_fact_verify", "description": "[Methodology Engine (Https-Rea-Tools-Https) MCP] Verify external claims via Obscura OmniNexus V8 engine.", "inputSchema": {"type": "object", "properties": {"query": {"type": "string", "description": "Primary input query, URL, command, SQL statement, or text to process."}, "options_json": {"type": "string", "description": "Optional JSON object string with extra parameters (e.g. '{\"eval_js\": \"document.title\"}')."}}}}, {"name": "rea_portal_hexa_engine_bridge", "description": "[Methodology Engine (Https-Rea-Tools-Https) MCP] Coordinate multi-engine tasks across Obscura, Radare2, Ghidra, IDA 9.5, LLM4Decompile, and Craft-Anything.", "inputSchema": {"type": "object", "properties": {"target_engine": {"type": "string", "description": "Target engine slug ('obscura', 'radare2', 'llm4decompile', 'ida_hexrays', 'craft_anything', 'ghidra')."}, "payload_json": {"type": "string", "description": "JSON payload to pass across the 6-engine bridge."}}}}];

async function triggerGithubAutoWake() {
  if (!AUTO_WAKE_GH_TOKEN) return false;
  try {
    const r = await fetch(GITHUB_DISPATCH_URL, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + AUTO_WAKE_GH_TOKEN,
        "Accept": "application/vnd.github+json",
        "User-Agent": "555-Universal-MCP-Worker/3.2",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ref: "main" })
    });
    return r.status === 204 || r.status === 200;
  } catch (_) {
    return false;
  }
}

async function getLatestTunnelUrl() {
  if (AUTO_WAKE_GH_TOKEN) {
    try {
      const apiRes = await fetch(GITHUB_API_LIVE_JSON_URL + "&t=" + Date.now(), {
        headers: {
          "Authorization": "Bearer " + AUTO_WAKE_GH_TOKEN,
          "Accept": "application/vnd.github.raw+json",
          "User-Agent": "555-Universal-MCP-Worker/3.2",
          "X-GitHub-Api-Version": "2022-11-28"
        }
      });
      if (apiRes.ok) {
        return await apiRes.json();
      }
    } catch (_) {}
  }
  const res = await fetch(GITHUB_RAW_LIVE_JSON_URL + "?t=" + Date.now(), {
    headers: { "User-Agent": "555-Universal-MCP-Worker/3.2" }
  });
  if (!res.ok) throw new Error("Could not fetch LIVE_MCP_URL.json: HTTP " + res.status);
  return await res.json();
}

async function handleEdgeFallbackJsonRpc(body, upstreamErr, liveData) {
  const rpcId = body && body.id !== undefined ? body.id : 1;
  const method = (body && body.method) || "";
  const params = (body && body.params) || {};

  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id: rpcId,
      result: {
        protocolVersion: "2025-03-26",
        capabilities: { tools: { listChanged: true } },
        serverInfo: { name: "rea-portal-OmniNexus", version: "3.2.0" }
      }
    };
  }

  if (method === "notifications/initialized" || method.startsWith("notifications/")) {
    return { jsonrpc: "2.0", id: rpcId, result: {} };
  }

  if (method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id: rpcId,
      result: { tools: EDGE_CURATED_TOOLS }
    };
  }

  if (method === "tools/call") {
    const tName = params.name || "";
    return {
      jsonrpc: "2.0",
      id: rpcId,
      result: {
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "EDGE_HYBRID_RESPONSE",
            engine: "rea-portal",
            title: "Methodology Engine (Https-Rea-Tools-Https) MCP",
            tool_called: tName,
            arguments_received: params.arguments || {},
            obscura_first_bridge: "https://obscura-mcp-forever.forested-lung.workers.dev/mcp",
            live_relay_state: liveData || { status: "BOOTING_OR_WAKING", detail: String(upstreamErr || "Tunnel warming up (~20s)") }
          }, null, 2)
        }]
      }
    };
  }

  return { jsonrpc: "2.0", id: rpcId, result: {} };
}

export default {
  async fetch(request) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept, MCP-Session-Id, Last-Event-ID"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    let parsedBody = null;
    let rawBodyBuffer = undefined;
    if (request.method !== "GET" && request.method !== "HEAD") {
      rawBodyBuffer = await request.arrayBuffer();
      try {
        parsedBody = JSON.parse(new TextDecoder().decode(rawBodyBuffer));
      } catch (_) {}
    }

    if (parsedBody && (
      parsedBody.method === "initialize" ||
      parsedBody.method === "notifications/initialized" ||
      parsedBody.method === "tools/list"
    )) {
      return new Response(JSON.stringify(await handleEdgeFallbackJsonRpc(parsedBody, null, null)), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    let live = null;
    try {
      live = await getLatestTunnelUrl();
      const mcpUrl = String((live && live.mcp_url) || "").trim();
      if (!mcpUrl.startsWith("https://")) {
        throw new Error("LIVE_MCP_URL.json mcp_url is warming up: " + JSON.stringify(mcpUrl));
      }
      const targetBase = mcpUrl.replace(/\/mcp\/?$/, "");
      const targetUrl = targetBase + url.pathname + url.search;

      if (request.method === "GET" && (url.pathname === "/status" || url.pathname === "/")) {
        return new Response(JSON.stringify({
          status: "UNIVERSAL_WORKER_ONLINE",
          engine: "rea-portal",
          title: "Methodology Engine (Https-Rea-Tools-Https) MCP",
          active_backend_mcp_url: live.mcp_url,
          updated_at: live.updated_at
        }, null, 2), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      const proxyReq = new Request(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: rawBodyBuffer,
      });
      const resp = await fetch(proxyReq);
      if (resp.status === 530 || resp.status === 502) {
        await triggerGithubAutoWake();
        throw new Error("Upstream tunnel rotated (HTTP " + resp.status + ") - triggered Auto-Wake!");
      }
      const newHeaders = new Headers(resp.headers);
      newHeaders.set("Access-Control-Allow-Origin", "*");
      return new Response(resp.body, { status: resp.status, headers: newHeaders });
    } catch (err) {
      await triggerGithubAutoWake();
      if (parsedBody) {
        return new Response(JSON.stringify(await handleEdgeFallbackJsonRpc(parsedBody, err, live)), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      return new Response(JSON.stringify({
        status: "AUTO_WAKING_CLOUD_RELAY",
        engine: "rea-portal",
        title: "Methodology Engine (Https-Rea-Tools-Https) MCP",
        live_json_state: live,
        message: "Signaled your 24/7 GitHub Cloud Relay to wake (~25s)."
      }, null, 2), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  }
};
