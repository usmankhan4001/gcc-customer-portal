import { spawn } from "node:child_process";

const cp = spawn("cmd.exe", ["/c", "npx", "-y", "@dokploy/mcp"], {
  stdio: ["pipe", "pipe", "pipe"],
  env: {
    ...process.env,
    DOKPLOY_URL: "https://paas.usmankhan.xyz",
    DOKPLOY_API_KEY: "mFWOZDIuOJsYSHaiOKZugzFrKzZplUleGucAevXBQsOMiTTBNiQHWXTbFaDyhTZz",
    DOKPLOY_TOOL_PRESET: "minimal",
  },
  windowsHide: true,
});

let buffer = "";
let reqId = 1;

function send(method, params = {}) {
  const msg = JSON.stringify({ jsonrpc: "2.0", id: reqId++, method, params });
  cp.stdin.write(msg + "\n");
}

function waitFor(id, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for id ${id}`)), timeout);
    const onData = (chunk) => {
      buffer += chunk.toString();
      while (buffer.includes("\n")) {
        const idx = buffer.indexOf("\n");
        const line = buffer.substring(0, idx).trim();
        buffer = buffer.substring(idx + 1);
        if (!line) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.id === id) {
            clearTimeout(timer);
            cp.stdout.removeListener("data", onData);
            resolve(parsed);
          }
        } catch (e) {}
      }
    };
    cp.stdout.on("data", onData);
    cp.stderr.on("data", () => {});
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

let idCounter = 1;
function nextId() {
  return idCounter++;
}

(async () => {
  try {
    // Initialize
    const initId = nextId();
    send("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      clientInfo: { name: "deployer", version: "1.0" },
    });
    // Don't wait for init response by id - just wait for initialization
    await sleep(5000);

    // Send initialized notification
    cp.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
    await sleep(2000);

    // List tools
    send("tools/list");
    const rId = reqId - 1;
    // Wait for tools list by capturing the next response
    const waitForAny = (timeout) => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Timeout")), timeout);
        const onData = (chunk) => {
          buffer += chunk.toString();
          while (buffer.includes("\n")) {
            const idx = buffer.indexOf("\n");
            const line = buffer.substring(0, idx).trim();
            buffer = buffer.substring(idx + 1);
            if (!line) continue;
            try {
              const parsed = JSON.parse(line);
              clearTimeout(timer);
              cp.stdout.removeListener("data", onData);
              resolve(parsed);
            } catch (e) {}
          }
        };
        cp.stdout.on("data", onData);
      });
    };

    const toolsResp = await waitForAny(20000);
    const tools = toolsResp.result?.tools || [];
    console.log("TOOLS:", JSON.stringify(tools.map((t) => t.name)));

    // Find deploy tool
    const deployTool = tools.find((t) => t.name === "application_deploy" || (t.name.includes("application") && t.name.includes("deploy")));
    console.log("DEPLOY_TOOL:", deployTool?.name);

    if (deployTool) {
      // Trigger deploy
      send("tools/call", { name: deployTool.name, arguments: { applicationId: "z71EkcrnmnEBNiX90c6oM" } });
      const deployResp = await waitForAny(180000);
      console.log("DEPLOY_RESP:", JSON.stringify(deployResp));
    }

    cp.stdin.end();
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err.message);
    cp.stdin.end();
    process.exit(1);
  }
})();