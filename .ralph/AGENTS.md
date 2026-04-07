# Project: Minecraft Family Feud (In-Person Game Show)

## Overview

A Minecraft-themed Family Feud web app for in-person play. Survey data comes from polling ~100 UW students on Minecraft-related questions. The host controls the game from one device, the game board is projected for the audience, and teams can optionally buzz in from their phones.

## Stack

- **Frontend**: Next.js 15 (React 19) with App Router
- **Styling**: MUI v7 + Emotion with custom Minecraft theme (pixel font, blocky aesthetic)
- **Real-Time**: Socket.io (game state sync between host, board, and buzzer clients)
- **Data**: JSON file for question/answer banks, in-memory game state on server
- **Server**: Single `server.js` wrapping Next.js + Socket.io (same pattern as other projects)
- **No database, no auth** — players join by game code, host has a simple PIN

## Project Structure

```
/
├── .ralph/              # Ralph loop config
├── src/
│   ├── app/             # Next.js App Router pages and API routes
│   │   ├── page.tsx     # Landing — join as host or player
│   │   ├── host/        # Host control panel
│   │   ├── board/       # Projected game board display
│   │   └── buzzer/      # Player buzzer (mobile-friendly)
│   ├── components/      # React components
│   ├── lib/             # Game logic, socket helpers, theme
│   ├── hooks/           # Custom React hooks
│   └── types/           # TypeScript types (game state, socket events)
├── data/
│   └── questions.json   # Question banks with survey results
├── server.js            # Custom Node HTTP server (Next.js + Socket.io)
├── deploy_webhook.sh    # Auto-deploy via GitHub webhook
└── public/              # Static assets (Minecraft textures, sounds)
```

## Game Flow

1. Host creates a game session (generates a room code)
2. Teams join via room code on their phones (buzzer view)
3. Host selects a question round
4. Board displays the question with hidden answers
5. Teams buzz in — host controls who answered
6. Host reveals answers one by one
7. Scoring: points = number of survey respondents who gave that answer
8. Strike tracking (3 strikes, other team steals)
9. Final round with timer

## Views

- **`/`** — Landing page: "Host a Game" or "Join a Game" (enter room code)
- **`/host`** — Host dashboard: select questions, reveal answers, manage scores, control game flow
- **`/board`** — Display view (projected): shows the classic Family Feud board with Minecraft styling
- **`/buzzer`** — Mobile buzzer: team name, big buzz button, shows if you buzzed first

## Server Pattern

Single `server.js` process wraps Next.js and Socket.io together:
```js
const server = createServer(handler);
const io = new Server(server);
```
Port: 3004. Deployed to `/var/www/MinecraftFamilyFeud`, managed by pm2.

## Theme

- Minecraft aesthetic: dirt/grass block colors, stone textures
- Primary: `#4CAF50` (Minecraft green)
- Secondary: `#8B6914` (dirt brown)
- Background: `#2D2D2D` (dark stone)
- Font: "Press Start 2P" (Google Fonts pixel font) for headings, system font for body
- Blocky borders, pixelated feel via MUI theme overrides

## Question Data Format

```json
{
  "questions": [
    {
      "id": "q1",
      "question": "Name a mob you'd least want to encounter in a cave",
      "answers": [
        { "text": "Creeper", "count": 42 },
        { "text": "Warden", "count": 28 },
        { "text": "Skeleton", "count": 15 },
        { "text": "Spider", "count": 10 },
        { "text": "Enderman", "count": 5 }
      ],
      "totalResponses": 100
    }
  ]
}
```

## Backpressure Validation Commands

Run in order. ALL must exit 0 before committing.

```bash
npx tsc --noEmit
```

## Remote Server Access

Connection details stored in `.ralph/.server-env` (gitignored). Same server as other projects.

- Production path: `/var/www/MinecraftFamilyFeud`
- OS: Ubuntu 24.04, x86_64
- Process manager: pm2
- Other apps on same server: jeopardy (:3000), superconnections (:3001), marchmadness (:3002), discord-alt (:3003)
- This app runs on port 3004.

## Operational Notes

- Socket.io events must have TypeScript interfaces in `src/types/socket.ts`
- Game state is ephemeral — lives in server memory, lost on restart (acceptable for in-person play)
- Question data loaded from `data/questions.json` at startup
- No user accounts — host uses a simple PIN, players join with a name + room code
- Mobile-first design for buzzer view, desktop-first for host and board views
