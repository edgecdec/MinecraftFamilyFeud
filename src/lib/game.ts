import type { GameState } from '@/types/game';
import { MAX_TEAMS, ROOM_CODE_LENGTH } from '@/lib/constants';
import { getQuestionById } from '@/lib/questions';

const ROOM_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const games = new Map<string, GameState>();

function generateRoomCode(): string {
  let code: string;
  do {
    code = Array.from({ length: ROOM_CODE_LENGTH }, () =>
      ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
    ).join('');
  } while (games.has(code));
  return code;
}

function createInitialState(roomCode: string): GameState {
  return {
    roomCode,
    teams: [],
    currentQuestion: null,
    revealedAnswers: [],
    strikes: 0,
    controllingTeamIndex: 0,
    phase: 'lobby',
    scores: {},
    roundPoints: 0,
    faceoff: null,
  };
}

export function createGame(): GameState {
  const roomCode = generateRoomCode();
  const state = createInitialState(roomCode);
  games.set(roomCode, state);
  return state;
}

export function joinTeam(
  roomCode: string,
  teamName: string,
  socketId: string
): GameState {
  const state = games.get(roomCode);
  if (!state) throw new Error(`Game not found: ${roomCode}`);
  if (state.phase !== 'lobby') throw new Error('Game already in progress');
  if (state.teams.length >= MAX_TEAMS) throw new Error('Game is full');
  if (state.teams.some((t) => t.name === teamName))
    throw new Error(`Team "${teamName}" already exists`);

  state.teams.push({ name: teamName, socketId });
  state.scores[teamName] = 0;
  return state;
}

export function getState(roomCode: string): GameState | undefined {
  return games.get(roomCode);
}

export function adjustScore(
  roomCode: string,
  teamName: string,
  delta: number
): GameState {
  const state = games.get(roomCode);
  if (!state) throw new Error(`Game not found: ${roomCode}`);
  if (!(teamName in state.scores))
    throw new Error(`Team "${teamName}" not found`);

  state.scores[teamName] += delta;
  return state;
}

export function endGame(roomCode: string): GameState {
  const state = games.get(roomCode);
  if (!state) throw new Error(`Game not found: ${roomCode}`);

  state.phase = 'gameOver';
  return state;
}

function getGame(roomCode: string): GameState {
  const state = games.get(roomCode);
  if (!state) throw new Error(`Game not found: ${roomCode}`);
  return state;
}

export function startFaceoff(
  roomCode: string,
  questionId: string
): GameState {
  const state = getGame(roomCode);
  const question = getQuestionById(questionId);
  if (!question) throw new Error(`Question not found: ${questionId}`);
  if (state.teams.length < MAX_TEAMS) throw new Error('Need 2 teams to start');

  state.currentQuestion = question;
  state.revealedAnswers = [];
  state.strikes = 0;
  state.roundPoints = 0;
  state.phase = 'faceoff';
  state.faceoff = { buzzedTeams: [], answers: [] };
  return state;
}

export function faceoffBuzz(
  roomCode: string,
  teamName: string
): GameState {
  const state = getGame(roomCode);
  if (state.phase !== 'faceoff') throw new Error('Not in faceoff phase');
  if (!state.faceoff) throw new Error('No active faceoff');
  if (state.faceoff.buzzedTeams.includes(teamName))
    throw new Error(`Team "${teamName}" already buzzed`);

  state.faceoff.buzzedTeams.push(teamName);
  return state;
}

export function faceoffAnswer(
  roomCode: string,
  teamName: string,
  answerIndex: number | null
): GameState {
  const state = getGame(roomCode);
  if (state.phase !== 'faceoff') throw new Error('Not in faceoff phase');
  if (!state.faceoff || !state.currentQuestion)
    throw new Error('No active faceoff');
  if (state.faceoff.answers.some((a) => a.teamName === teamName))
    throw new Error(`Team "${teamName}" already answered`);

  state.faceoff.answers.push({ teamName, answerIndex });

  // Reveal the answer on the board if it's valid
  if (answerIndex !== null && !state.revealedAnswers.includes(answerIndex)) {
    state.revealedAnswers.push(answerIndex);
    state.roundPoints += state.currentQuestion.answers[answerIndex].count;
  }

  // Transition to resolve once both teams have answered
  if (state.faceoff.answers.length >= MAX_TEAMS) {
    state.phase = 'faceoff-resolve';
  }

  return state;
}

export function resolveFaceoff(roomCode: string): {
  state: GameState;
  winnerTeam: string;
} {
  const state = getGame(roomCode);
  if (state.phase !== 'faceoff-resolve') throw new Error('Not in faceoff-resolve phase');
  if (!state.faceoff) throw new Error('No active faceoff');

  const answers = state.faceoff.answers;
  const first = answers[0];
  const second = answers[1];

  let winnerTeam: string;

  const firstOnBoard = first.answerIndex !== null;
  const secondOnBoard = second.answerIndex !== null;

  if (firstOnBoard && secondOnBoard) {
    // Both on board — lower index = higher ranked = winner
    winnerTeam =
      first.answerIndex! <= second.answerIndex!
        ? first.teamName
        : second.teamName;
  } else if (firstOnBoard) {
    winnerTeam = first.teamName;
  } else if (secondOnBoard) {
    winnerTeam = second.teamName;
  } else {
    // Neither on board — first buzzer wins
    winnerTeam = state.faceoff.buzzedTeams[0];
  }

  return { state, winnerTeam };
}

export function playOrPass(
  roomCode: string,
  choice: 'play' | 'pass',
  winnerTeam: string
): GameState {
  const state = getGame(roomCode);
  if (state.phase !== 'faceoff-resolve') throw new Error('Not in faceoff-resolve phase');

  const winnerIndex = state.teams.findIndex((t) => t.name === winnerTeam);
  if (winnerIndex === -1) throw new Error(`Team "${winnerTeam}" not found`);

  const otherIndex = winnerIndex === 0 ? 1 : 0;
  state.controllingTeamIndex = choice === 'play' ? winnerIndex : otherIndex;
  state.phase = 'playing';
  state.faceoff = null;
  return state;
}

export function removeGame(roomCode: string): void {
  games.delete(roomCode);
}
