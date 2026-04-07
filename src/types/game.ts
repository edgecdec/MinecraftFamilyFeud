export interface Team {
  name: string;
  socketId: string;
}

export interface Answer {
  text: string;
  count: number;
}

export interface Question {
  id: string;
  question: string;
  answers: Answer[];
  totalResponses: number;
}

export interface FaceoffState {
  buzzedTeams: string[];
  answers: { teamName: string; answerIndex: number | null }[];
}

export type GamePhase =
  | 'lobby'
  | 'faceoff'
  | 'faceoff-resolve'
  | 'playing'
  | 'steal'
  | 'roundEnd'
  | 'gameOver';

export interface GameState {
  roomCode: string;
  teams: Team[];
  currentQuestion: Question | null;
  revealedAnswers: number[];
  strikes: number;
  controllingTeamIndex: number;
  phase: GamePhase;
  scores: Record<string, number>;
  roundPoints: number;
  faceoff: FaceoffState | null;
}
