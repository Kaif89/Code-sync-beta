/* eslint-disable no-console */
const http = require("http");
const { WebSocketServer } = require("ws");
const { spawn } = require("child_process");
const url = require("url");

function lspWrite(proc, msgObj) {
  const json = JSON.stringify(msgObj);
  const payload = `Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`;
  proc.stdin.write(payload, "utf8");
}

function createLspProcess(kind) {
  switch (kind) {
    case "pylsp":
      return spawn("pylsp", [], { stdio: ["pipe", "pipe", "pipe"] });
    case "clangd":
      return spawn("clangd", ["--header-insertion=never", "--pch-storage=memory"], {
        stdio: ["pipe", "pipe", "pipe"],
      });
    case "gopls":
      return spawn("gopls", [], { stdio: ["pipe", "pipe", "pipe"] });
    case "rust-analyzer":
      return spawn("rust-analyzer", [], { stdio: ["pipe", "pipe", "pipe"] });
    // JDTLS requires a full setup; leaving disabled by default.
    // case "jdtls":
    //   return spawn("jdtls", [], { stdio: ["pipe", "pipe", "pipe"] });
    default:
      return null;
  }
}

function attachLsp(ws, kind) {
  const proc = createLspProcess(kind);
  if (!proc) {
    ws.close(1011, `Unsupported language server: ${kind}`);
    return;
  }

  let buffer = Buffer.alloc(0);
  function processData() {
    while (true) {
      const headerEnd = buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) break;
      const header = buffer.slice(0, headerEnd).toString("utf8");
      const match = /Content-Length:\s*(\d+)/i.exec(header);
      if (!match) {
        // Malformed; drop
        buffer = buffer.slice(headerEnd + 4);
        continue;
      }
      const length = parseInt(match[1], 10);
      const totalLen = headerEnd + 4 + length;
      if (buffer.length < totalLen) break;
      const body = buffer.slice(headerEnd + 4, totalLen).toString("utf8");
      buffer = buffer.slice(totalLen);

      try {
        const msgObj = JSON.parse(body);
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify(msgObj));
        }
      } catch (e) {
        console.error(`[${kind}] Failed to parse LSP message from server`, e);
      }
    }
  }

  proc.stdout.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    processData();
  });
  proc.stderr.on("data", (chunk) => {
    const text = chunk.toString("utf8");
    // Keep stderr quiet but log first lines to help debugging
    if (text && text.trim()) console.warn(`[${kind}] ${text.trim()}`);
  });
  proc.on("exit", (code) => {
    if (ws.readyState === ws.OPEN) ws.close(1011, `${kind} exited: ${code}`);
  });

  ws.on("message", (data) => {
    try {
      // Expect JSON-RPC message from client
      const msgObj = JSON.parse(data.toString());
      lspWrite(proc, msgObj);
    } catch (e) {
      console.error(`[${kind}] Bad client message`, e);
    }
  });

  ws.on("close", () => {
    try {
      proc.kill();
    } catch (e) {
      /* noop */
    }
  });
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("LSP bridge running\n");
});

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  const { pathname } = url.parse(request.url);
  // Paths: /pylsp, /clangd, /gopls, /rust-analyzer, /jdtls (disabled by default)
  const allowed = ["/pylsp", "/clangd", "/gopls", "/rust-analyzer", "/jdtls"];
  if (!pathname || !allowed.includes(pathname)) {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    const kind = pathname.replace(/^\//, "");
    // Block jdtls by default to avoid misconfig noise
    if (kind === "jdtls") {
      ws.close(1011, "jdtls not configured in bridge");
      return;
    }
    attachLsp(ws, kind);
  });
});

const PORT = process.env.LSP_PORT ? Number(process.env.LSP_PORT) : 3000;
server.listen(PORT, "127.0.0.1", () => {
  console.log(`LSP bridge listening on ws://localhost:${PORT}`);
});



