import type { Answer, GameState, Team } from './game';

export interface ClientToServerEvents {
  'host:create': (payload: { hostPin: string }) => void;
  'host:selectQuestion': (payload: { questionId: string }) => void;
  'host:openFaceoff': (payload: Record<string, never>) => void;
  'host:faceoffAnswer': (payload: { teamName: string; answerIndex: number | null }) => void;
  'host:playOrPass': (payload: { choice: 'play' | 'pass' }) => void;
  'host:correctAnswer': (payload: { answerIndex: number }) => void;
  'host:strike': (payload: Record<string, never>) => void;
  'host:stealAttempt': (payload: { answerIndex: number | null }) => void;
  'host:revealRemaining': (payload: Record<string, never>) => void;
  'host:endRound': (payload: Record<string, never>) => void;
  'host:adjustScore': (payload: { teamName: string; delta: number }) => void;
  'host:endGame': (payload: Record<string, never>) => void;
  'team:join': (payload: { roomCode: string; teamName: string }) => void;
  'team:buzz': (payload: Record<string, never>) => void;
}

export interface ServerToClientEvents {
  'game:created': (payload: { roomCode: string }) => void;
  'game:state': (payload: GameState) => void;
  'game:teamJoined': (payload: { teamName: string; teams: Team[] }) => void;
  'game:faceoffOpen': (payload: Record<string, never>) => void;
  'game:buzzed': (payload: { teamName: string }) => void;
  'game:faceoffResult': (payload: { winnerTeam: string }) => void;
  'game:answerRevealed': (payload: { answerIndex: number; answer: Answer }) => void;
  'game:strike': (payload: { strikes: number }) => void;
  'game:stealStart': (payload: { teamName: string }) => void;
  'game:stealResult': (payload: { success: boolean; teamName: string }) => void;
  'game:roundEnd': (payload: { winnerTeam: string; roundPoints: number; scores: Record<string, number> }) => void;
  'game:allRevealed': (payload: { answers: Answer[] }) => void;
  'game:over': (payload: { finalScores: Record<string, number>; winner: string }) => void;
  'error': (payload: { message: string }) => void;
}
