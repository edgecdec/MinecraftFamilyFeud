/**
 * Game state manager — CommonJS module for server.js runtime.
 * Mirrors src/lib/game.ts logic (which exists for TypeScript type-checking).
 */
const path = require("path");

const MAX_TEAMS = 2;
const MAX_STRIKES = 3;
const ROOM_CODE_LENGTH = 4;
const ROOM_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const questionsData = require(path.join(__dirname, "..", "data", "questions.json"));
const questions = questionsData.questions;

const games = new Map();

function getQuestionById(id) {
  return questions.find((q) => q.id === id);
}

function generateRoomCode() {
  let code;
  do {
    code = Array.from({ length: ROOM_CODE_LENGTH }, () =>
      ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
    ).join("");
  } while (games.has(code));
  return code;
}

function getGame(roomCode) {
  const state = games.get(roomCode);
  if (!state) throw new Error(`Game not found: ${roomCode}`);
  return state;
}

function allAnswersRevealed(state) {
  return (
    state.currentQuestion !== null &&
    state.revealedAnswers.length >= state.currentQuestion.answers.length
  );
}

exports.createGame = function () {
  const roomCode = generateRoomCode();
  const state = {
    roomCode,
    teams: [],
    currentQuestion: null,
    revealedAnswers: [],
    strikes: 0,
    controllingTeamIndex: 0,
    phase: "lobby",
    scores: {},
    roundPoints: 0,
    faceoff: null,
  };
  games.set(roomCode, state);
  return state;
};

exports.getState = function (roomCode) {
  return games.get(roomCode);
};

exports.joinTeam = function (roomCode, teamName, socketId) {
  const state = getGame(roomCode);
  if (state.phase !== "lobby") throw new Error("Game already in progress");
  if (state.teams.length >= MAX_TEAMS) throw new Error("Game is full");
  if (state.teams.some((t) => t.name === teamName))
    throw new Error(`Team "${teamName}" already exists`);
  state.teams.push({ name: teamName, socketId });
  state.scores[teamName] = 0;
  return state;
};

exports.startFaceoff = function (roomCode, questionId) {
  const state = getGame(roomCode);
  const question = getQuestionById(questionId);
  if (!question) throw new Error(`Question not found: ${questionId}`);
  if (state.teams.length < MAX_TEAMS) throw new Error("Need 2 teams to start");
  state.currentQuestion = question;
  state.revealedAnswers = [];
  state.strikes = 0;
  state.roundPoints = 0;
  state.phase = "faceoff";
  state.faceoff = { buzzedTeams: [], answers: [] };
  return state;
};

exports.faceoffBuzz = function (roomCode, teamName) {
  const state = getGame(roomCode);
  if (state.phase !== "faceoff") throw new Error("Not in faceoff phase");
  if (!state.faceoff) throw new Error("No active faceoff");
  if (state.faceoff.buzzedTeams.includes(teamName))
    throw new Error(`Team "${teamName}" already buzzed`);
  state.faceoff.buzzedTeams.push(teamName);
  return state;
};

exports.faceoffAnswer = function (roomCode, teamName, answerIndex) {
  const state = getGame(roomCode);
  if (state.phase !== "faceoff") throw new Error("Not in faceoff phase");
  if (!state.faceoff || !state.currentQuestion)
    throw new Error("No active faceoff");
  if (state.faceoff.answers.some((a) => a.teamName === teamName))
    throw new Error(`Team "${teamName}" already answered`);
  state.faceoff.answers.push({ teamName, answerIndex });
  if (answerIndex !== null && !state.revealedAnswers.includes(answerIndex)) {
    state.revealedAnswers.push(answerIndex);
    state.roundPoints += state.currentQuestion.answers[answerIndex].count;
  }
  if (state.faceoff.answers.length >= MAX_TEAMS) {
    state.phase = "faceoff-resolve";
  }
  return state;
};

exports.resolveFaceoff = function (roomCode) {
  const state = getGame(roomCode);
  if (state.phase !== "faceoff-resolve")
    throw new Error("Not in faceoff-resolve phase");
  if (!state.faceoff) throw new Error("No active faceoff");
  const answers = state.faceoff.answers;
  const first = answers[0];
  const second = answers[1];
  let winnerTeam;
  const firstOnBoard = first.answerIndex !== null;
  const secondOnBoard = second.answerIndex !== null;
  if (firstOnBoard && secondOnBoard) {
    winnerTeam =
      first.answerIndex <= second.answerIndex
        ? first.teamName
        : second.teamName;
  } else if (firstOnBoard) {
    winnerTeam = first.teamName;
  } else if (secondOnBoard) {
    winnerTeam = second.teamName;
  } else {
    winnerTeam = state.faceoff.buzzedTeams[0];
  }
  return { state, winnerTeam };
};

exports.playOrPass = function (roomCode, choice, winnerTeam) {
  const state = getGame(roomCode);
  if (state.phase !== "faceoff-resolve")
    throw new Error("Not in faceoff-resolve phase");
  const winnerIndex = state.teams.findIndex((t) => t.name === winnerTeam);
  if (winnerIndex === -1) throw new Error(`Team "${winnerTeam}" not found`);
  const otherIndex = winnerIndex === 0 ? 1 : 0;
  state.controllingTeamIndex = choice === "play" ? winnerIndex : otherIndex;
  state.phase = "playing";
  state.faceoff = null;
  return state;
};

exports.revealAnswer = function (roomCode, answerIndex) {
  const state = getGame(roomCode);
  if (state.phase !== "playing") throw new Error("Not in playing phase");
  if (!state.currentQuestion) throw new Error("No current question");
  if (answerIndex < 0 || answerIndex >= state.currentQuestion.answers.length)
    throw new Error("Invalid answer index");
  if (state.revealedAnswers.includes(answerIndex))
    throw new Error("Answer already revealed");
  state.revealedAnswers.push(answerIndex);
  state.roundPoints += state.currentQuestion.answers[answerIndex].count;
  if (allAnswersRevealed(state)) {
    state.phase = "roundEnd";
  }
  return state;
};

exports.strike = function (roomCode) {
  const state = getGame(roomCode);
  if (state.phase !== "playing") throw new Error("Not in playing phase");
  state.strikes += 1;
  if (state.strikes >= MAX_STRIKES) {
    state.phase = "steal";
  }
  return state;
};

exports.stealAttempt = function (roomCode, answerIndex) {
  const state = getGame(roomCode);
  if (state.phase !== "steal") throw new Error("Not in steal phase");
  if (!state.currentQuestion) throw new Error("No current question");
  const stealingTeamIndex = state.controllingTeamIndex === 0 ? 1 : 0;
  const stealingTeamName = state.teams[stealingTeamIndex].name;
  const controllingTeamName = state.teams[state.controllingTeamIndex].name;
  if (answerIndex !== null) {
    if (answerIndex < 0 || answerIndex >= state.currentQuestion.answers.length)
      throw new Error("Invalid answer index");
    if (state.revealedAnswers.includes(answerIndex))
      throw new Error("Answer already revealed");
    state.revealedAnswers.push(answerIndex);
    state.roundPoints += state.currentQuestion.answers[answerIndex].count;
    state.scores[stealingTeamName] += state.roundPoints;
  } else {
    state.scores[controllingTeamName] += state.roundPoints;
  }
  state.roundPoints = 0;
  state.phase = "roundEnd";
  return state;
};

exports.revealRemaining = function (roomCode) {
  const state = getGame(roomCode);
  if (!state.currentQuestion) throw new Error("No current question");
  for (let i = 0; i < state.currentQuestion.answers.length; i++) {
    if (!state.revealedAnswers.includes(i)) {
      state.revealedAnswers.push(i);
    }
  }
  return state;
};

exports.endRound = function (roomCode) {
  const state = getGame(roomCode);
  if (state.phase !== "roundEnd" && state.phase !== "playing")
    throw new Error("Cannot end round in current phase");
  if (state.phase === "playing" && state.roundPoints > 0) {
    const controllingTeamName = state.teams[state.controllingTeamIndex].name;
    state.scores[controllingTeamName] += state.roundPoints;
  }
  state.roundPoints = 0;
  state.phase = "roundEnd";
  return state;
};

exports.adjustScore = function (roomCode, teamName, delta) {
  const state = getGame(roomCode);
  if (!(teamName in state.scores))
    throw new Error(`Team "${teamName}" not found`);
  state.scores[teamName] += delta;
  return state;
};

exports.endGame = function (roomCode) {
  const state = getGame(roomCode);
  state.phase = "gameOver";
  return state;
};

exports.removeGame = function (roomCode) {
  games.delete(roomCode);
};
