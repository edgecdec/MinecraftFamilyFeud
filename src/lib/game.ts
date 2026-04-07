import type { GameState } from '@/types/game';
import { MAX_TEAMS, ROOM_CODE_LENGTH } from '@/lib/constants';

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

export function removeGame(roomCode: string): void {
  games.delete(roomCode);
}
