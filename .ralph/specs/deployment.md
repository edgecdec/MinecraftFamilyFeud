# Deployment Specification

## Deploy Pattern
Same auto-deploy webhook pattern as other projects on the server.

### deploy_webhook.sh
Triggered by GitHub webhook on push to main. Script should:
1. `cd /var/www/MinecraftFamilyFeud`
2. `git pull origin main`
3. `npm install --production`
4. `npx next build`
5. `pm2 restart minecraft-feud || pm2 start server.js --name minecraft-feud`

### server.js
Single Node.js process wrapping Next.js + Socket.io:
```js
const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(handler);
  const io = new Server(server);
  // Socket.io event handlers here
  server.listen(3005);
});
```

### nginx
Needs a server block proxying the domain to localhost:3005. Same pattern as other apps. This will be configured manually — not a ralph task.

### pm2
- Process name: `minecraft-feud`
- Port: 3005

### GitHub Webhook
- URL: `http://<domain>/api/webhook`
- Secret: stored in `.env` as `WEBHOOK_SECRET`
- Triggers on push to main branch
