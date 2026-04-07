const { createServer } = require("http");
const { parse } = require("url");
const { createHmac } = require("crypto");
const { execFile } = require("child_process");
const path = require("path");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handler = app.getRequestHandler();
const PORT = process.env.PORT || 3005;

function verifySignature(payload, signature) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected =
    "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");
  return expected === signature;
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    const parsed = parse(req.url || "/", true);

    if (parsed.pathname === "/api/webhook" && req.method === "POST") {
      const body = await collectBody(req);
      const signature = req.headers["x-hub-signature-256"];
      if (!verifySignature(body, signature)) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid signature" }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      const script = path.join(__dirname, "deploy_webhook.sh");
      execFile("bash", [script], (err, stdout, stderr) => {
        if (err) console.error("Deploy script error:", err.message);
        if (stdout) console.log("Deploy stdout:", stdout);
        if (stderr) console.error("Deploy stderr:", stderr);
      });
      return;
    }

    handler(req, res, parsed);
  });

  // Socket.io will be added here later

  server.listen(PORT, () => {
    console.log(`> Minecraft Family Feud running on http://localhost:${PORT}`);
  });
});
