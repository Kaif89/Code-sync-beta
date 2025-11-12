/* eslint-disable no-console */
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import url from "url";
import path from "path";
import fs from "fs";

type JsonRpc = Record<string, unknown>;

function lspWrite(proc: ChildProcessWithoutNullStreams, msgObj: JsonRpc) {
  const json = JSON.stringify(msgObj);
  const payload = `Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`;
  proc.stdin.write(payload, "utf8");
}

function resolveJdtlsLauncher(): {
  java: string;
  jar: string;
  configDir: string;
  workspace: string;
} | null {
  const jdtlsHome = process.env.JDTLS_HOME;
  if (!jdtlsHome) {
    console.error(
      "[jdtls] JDTLS_HOME environment variable not set. Point it to the root of the jdtls installation."
    );
    return null;
  }

  const pluginsDir = path.join(jdtlsHome, "plugins");
  let launcherJar = "";
  try {
    const entries = fs.readdirSync(pluginsDir);
    launcherJar =
      entries
        .filter((name) => name.startsWith("org.eclipse.equinox.launcher_") && name.endsWith(".jar"))
        .map((name) => path.join(pluginsDir, name))
        .sort()
        .pop() || "";
  } catch (error) {
    console.error("[jdtls] Unable to read plugins directory", error);
    return null;
  }

  if (!launcherJar || !fs.existsSync(launcherJar)) {
    console.error("[jdtls] Could not locate org.eclipse.equinox.launcher_*.jar inside plugins/");
    return null;
  }

  const platform = process.platform;
  const configFolder =
    platform === "win32" ? "config_win" : platform === "darwin" ? "config_mac" : "config_linux";
  const configDir = path.join(jdtlsHome, configFolder);
  if (!fs.existsSync(configDir)) {
    console.error(`[jdtls] Expected configuration folder ${configFolder} under ${jdtlsHome}`);
    return null;
  }

  const workspace =
    process.env.JDTLS_WORKSPACE ||
    path.join(process.cwd(), "server", ".jdtls-workspace");
  fs.mkdirSync(workspace, { recursive: true });

  const javaBinary =
    process.env.JAVA_HOME && process.env.JAVA_HOME.trim()
      ? path.join(process.env.JAVA_HOME, "bin", platform === "win32" ? "java.exe" : "java")
      : "java";

  return { java: javaBinary, jar: launcherJar, configDir, workspace };
}

function createLspProcess(kind: string): ChildProcessWithoutNullStreams | null {
  switch (kind) {
    case "pylsp":
      return spawn("pylsp", [], { stdio: ["pipe", "pipe", "pipe"] });
    case "clangd":
      // Allow overriding clangd path via env
      // e.g., set CLANGD_PATH="C:\\Program Files\\LLVM\\bin\\clangd.exe"
      return spawn(
        process.env.CLANGD_PATH || "clangd",
        [
          "--header-insertion=never",
          "--pch-storage=memory",
          "--background-index",
          "--offset-encoding=utf-16",
        ],
        {
        stdio: ["pipe", "pipe", "pipe"],
        }
      );
    case "gopls":
      return spawn("gopls", [], { stdio: ["pipe", "pipe", "pipe"] });
    case "rust-analyzer":
      return spawn("rust-analyzer", [], { stdio: ["pipe", "pipe", "pipe"] });
    case "jdtls": {
      const resolved = resolveJdtlsLauncher();
      if (!resolved) {
        return null;
      }
      const args = [
        "-Declipse.application=org.eclipse.jdt.ls.core.id1",
        "-Dosgi.bundles.defaultStartLevel=4",
        "-Declipse.product=org.eclipse.jdt.ls.core.product",
        "-Dlog.protocol=false",
        "-Dlog.level=INFO",
        "--add-modules=ALL-SYSTEM",
        "--add-opens",
        "java.base/java.util=ALL-UNNAMED",
        "--add-opens",
        "java.base/java.lang=ALL-UNNAMED",
        "-jar",
        resolved.jar,
        "-configuration",
        resolved.configDir,
        "-data",
        resolved.workspace,
      ];
      return spawn(resolved.java, args, { stdio: ["pipe", "pipe", "pipe"] });
    }
    default:
      return null;
  }
}

function attachLsp(ws: WebSocket, kind: string) {
  const proc = createLspProcess(kind);
  if (!proc) {
    ws.close(1011, `Unsupported language server: ${kind}`);
    return;
  }

  let buffer = Buffer.alloc(0);
  function processData() {
    // Parse LSP headers and forward JSON body to WS
    while (true) {
      const headerEnd = buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) break;
      const header = buffer.slice(0, headerEnd).toString("utf8");
      const match = /Content-Length:\s*(\d+)/i.exec(header);
      if (!match) {
        buffer = buffer.slice(headerEnd + 4);
        continue;
      }
      const length = parseInt(match[1], 10);
      const totalLen = headerEnd + 4 + length;
      if (buffer.length < totalLen) break;
      const body = buffer.slice(headerEnd + 4, totalLen).toString("utf8");
      buffer = buffer.slice(totalLen);

      try {
        const msgObj = JSON.parse(body) as JsonRpc;
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify(msgObj));
        }
      } catch (e) {
        console.error(`[${kind}] Failed to parse LSP message from server`, e);
      }
    }
  }

  proc.stdout.on("data", (chunk: Buffer) => {
    buffer = Buffer.concat([buffer, chunk]);
    processData();
  });
  proc.stderr.on("data", (chunk: Buffer) => {
    const text = chunk.toString("utf8");
    if (text && text.trim()) console.warn(`[${kind}] ${text.trim()}`);
  });
  proc.on("exit", (code: number | null) => {
    if (ws.readyState === ws.OPEN) ws.close(1011, `${kind} exited: ${code}`);
  });

  ws.on("message", (data: Buffer) => {
    try {
      const msgObj = JSON.parse(data.toString()) as JsonRpc;
      lspWrite(proc, msgObj);
    } catch (e) {
      console.error(`[${kind}] Bad client message`, e);
    }
  });

  ws.on("close", () => {
    try {
      proc.kill();
    } catch {
      // ignore
    }
  });
}

const server = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("LSP bridge running\n");
});

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  const parsed = url.parse(request.url || "");
  const pathname = parsed.pathname || "";
  // Paths: /pylsp, /clangd, /gopls, /rust-analyzer, /jdtls (disabled by default)
  const allowed = new Set(["/pylsp", "/clangd", "/gopls", "/rust-analyzer", "/jdtls"]);
  if (!allowed.has(pathname)) {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket as unknown as Buffer, head, (ws) => {
    const kind = pathname.replace(/^\//, "");
    attachLsp(ws, kind);
  });
});

const PORT = process.env.LSP_PORT ? Number(process.env.LSP_PORT) : 3000;
server.listen(PORT, "127.0.0.1", () => {
  console.log(`LSP bridge listening on ws://localhost:${PORT}`);
});



