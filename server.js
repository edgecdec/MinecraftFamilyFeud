const { createServer } = require("http");
const { parse } = require("url");
const { createHmac } = require("crypto");
const { execFile } = require("child_process");
const path = require("path");
const next = require("next");
const { Server } = require("socket.io");
const gm = require("./lib/gameManager");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handler = app.getRequestHandler();
const PORT = process.env.PORT || 3005;

// Maps socketId → { roomCode, role, teamName? }
const socketMeta = new Map();

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

function roomKey(roomCode) {
  return `game:${roomCode}`;
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

  const io = new Server(server);

  io.on("connection", (socket) => {
    socket.on("host:create", ({ hostPin }) => {
      try {
        const state = gm.createGame();
        const room = roomKey(state.roomCode);
        socket.join(room);
        socketMeta.set(socket.id, { roomCode: state.roomCode, role: "host" });
        socket.emit("game:created", { roomCode: state.roomCode });
        socket.emit("game:state", state);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("team:join", ({ roomCode, teamName }) => {
      try {
        const state = gm.joinTeam(roomCode, teamName, socket.id);
        const room = roomKey(roomCode);
        socket.join(room);
        socketMeta.set(socket.id, { roomCode, role: "team", teamName });
        io.to(room).emit("game:teamJoined", { teamName, teams: state.teams });
        io.to(room).emit("game:state", state);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("host:selectQuestion", ({ questionId }) => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta) throw new Error("Not in a game");
        const state = gm.startFaceoff(meta.roomCode, questionId);
        io.to(roomKey(meta.roomCode)).emit("game:state", state);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("host:openFaceoff", () => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta) throw new Error("Not in a game");
        io.to(roomKey(meta.roomCode)).emit("game:faceoffOpen", {});
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("team:buzz", () => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta || !meta.teamName) throw new Error("Not in a game as a team");
        const state = gm.faceoffBuzz(meta.roomCode, meta.teamName);
        io.to(roomKey(meta.roomCode)).emit("game:buzzed", { teamName: meta.teamName });
        io.to(roomKey(meta.roomCode)).emit("game:state", state);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("host:faceoffAnswer", ({ teamName, answerIndex }) => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta) throw new Error("Not in a game");
        const state = gm.faceoffAnswer(meta.roomCode, teamName, answerIndex);
        if (answerIndex !== null && state.currentQuestion) {
          io.to(roomKey(meta.roomCode)).emit("game:answerRevealed", {
            answerIndex,
            answer: state.currentQuestion.answers[answerIndex],
          });
        }
        // Auto-resolve when both teams have answered
        if (state.phase === "faceoff-resolve") {
          const { winnerTeam } = gm.resolveFaceoff(meta.roomCode);
          io.to(roomKey(meta.roomCode)).emit("game:faceoffResult", { winnerTeam });
        }
        io.to(roomKey(meta.roomCode)).emit("game:state", state);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("host:playOrPass", ({ choice }) => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta) throw new Error("Not in a game");
        // Need to resolve faceoff first to get winner, but it may already be resolved
        const current = gm.getState(meta.roomCode);
        if (!current) throw new Error("Game not found");
        // Find the faceoff winner from the resolve result
        const { winnerTeam } = gm.resolveFaceoff(meta.roomCode);
        const state = gm.playOrPass(meta.roomCode, choice, winnerTeam);
        io.to(roomKey(meta.roomCode)).emit("game:state", state);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("host:correctAnswer", ({ answerIndex }) => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta) throw new Error("Not in a game");
        const state = gm.revealAnswer(meta.roomCode, answerIndex);
        if (state.currentQuestion) {
          io.to(roomKey(meta.roomCode)).emit("game:answerRevealed", {
            answerIndex,
            answer: state.currentQuestion.answers[answerIndex],
          });
        }
        if (state.phase === "roundEnd") {
          const controllingTeam = state.teams[state.controllingTeamIndex].name;
          io.to(roomKey(meta.roomCode)).emit("game:roundEnd", {
            winnerTeam: controllingTeam,
            roundPoints: state.roundPoints,
            scores: state.scores,
          });
        }
        io.to(roomKey(meta.roomCode)).emit("game:state", state);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("host:strike", () => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta) throw new Error("Not in a game");
        const state = gm.strike(meta.roomCode);
        io.to(roomKey(meta.roomCode)).emit("game:strike", { strikes: state.strikes });
        if (state.phase === "steal") {
          const stealingIndex = state.controllingTeamIndex === 0 ? 1 : 0;
          const stealingTeam = state.teams[stealingIndex].name;
          io.to(roomKey(meta.roomCode)).emit("game:stealStart", { teamName: stealingTeam });
        }
        io.to(roomKey(meta.roomCode)).emit("game:state", state);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("host:stealAttempt", ({ answerIndex }) => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta) throw new Error("Not in a game");
        const stateBefore = gm.getState(meta.roomCode);
        if (!stateBefore) throw new Error("Game not found");
        const stealingIndex = stateBefore.controllingTeamIndex === 0 ? 1 : 0;
        const stealingTeam = stateBefore.teams[stealingIndex].name;
        const success = answerIndex !== null;
        const state = gm.stealAttempt(meta.roomCode, answerIndex);
        if (success && state.currentQuestion) {
          io.to(roomKey(meta.roomCode)).emit("game:answerRevealed", {
            answerIndex,
            answer: state.currentQuestion.answers[answerIndex],
          });
        }
        io.to(roomKey(meta.roomCode)).emit("game:stealResult", {
          success,
          teamName: stealingTeam,
        });
        // Determine round winner based on who got the points
        const winnerTeam = success
          ? stealingTeam
          : stateBefore.teams[stateBefore.controllingTeamIndex].name;
        io.to(roomKey(meta.roomCode)).emit("game:roundEnd", {
          winnerTeam,
          roundPoints: 0,
          scores: state.scores,
        });
        io.to(roomKey(meta.roomCode)).emit("game:state", state);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("host:revealRemaining", () => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta) throw new Error("Not in a game");
        const state = gm.revealRemaining(meta.roomCode);
        if (state.currentQuestion) {
          io.to(roomKey(meta.roomCode)).emit("game:allRevealed", {
            answers: state.currentQuestion.answers,
          });
        }
        io.to(roomKey(meta.roomCode)).emit("game:state", state);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("host:endRound", () => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta) throw new Error("Not in a game");
        const state = gm.endRound(meta.roomCode);
        io.to(roomKey(meta.roomCode)).emit("game:state", state);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("host:adjustScore", ({ teamName, delta }) => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta) throw new Error("Not in a game");
        const state = gm.adjustScore(meta.roomCode, teamName, delta);
        io.to(roomKey(meta.roomCode)).emit("game:state", state);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("host:endGame", () => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta) throw new Error("Not in a game");
        const state = gm.endGame(meta.roomCode);
        const entries = Object.entries(state.scores);
        const winner =
          entries.length > 0
            ? entries.reduce((a, b) => (a[1] >= b[1] ? a : b))[0]
            : "";
        io.to(roomKey(meta.roomCode)).emit("game:over", {
          finalScores: state.scores,
          winner,
        });
        io.to(roomKey(meta.roomCode)).emit("game:state", state);
        gm.removeGame(meta.roomCode);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("disconnect", () => {
      socketMeta.delete(socket.id);
    });
  });

  server.listen(PORT, () => {
    console.log(`> Minecraft Family Feud running on http://localhost:${PORT}`);
  });
});
