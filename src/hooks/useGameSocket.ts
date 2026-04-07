'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  GameState,
  ServerToClientEvents,
} from '@/types';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type ServerEventName = keyof ServerToClientEvents;

export interface GameEvent {
  event: ServerEventName;
  payload: unknown;
  timestamp: number;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

type Role = 'host' | 'team' | 'board';

interface UseGameSocketReturn {
  gameState: GameState | null;
  lastEvent: GameEvent | null;
  connectionStatus: ConnectionStatus;
  emit: <E extends keyof ClientToServerEvents>(
    event: E,
    ...args: Parameters<ClientToServerEvents[E]>
  ) => void;
}

const GRANULAR_EVENTS: ServerEventName[] = [
  'game:created',
  'game:teamJoined',
  'game:faceoffOpen',
  'game:buzzed',
  'game:faceoffResult',
  'game:answerRevealed',
  'game:strike',
  'game:stealStart',
  'game:stealResult',
  'game:roundEnd',
  'game:allRevealed',
  'game:over',
  'error',
];

export function useGameSocket(
  roomCode: string | null,
  role: Role
): UseGameSocketReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('connecting');
  const socketRef = useRef<GameSocket | null>(null);

  useEffect(() => {
    const socket: GameSocket = io({
      query: { roomCode, role },
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnectionStatus('connected'));
    socket.on('disconnect', () => setConnectionStatus('disconnected'));
    socket.on('connect_error', () => setConnectionStatus('error'));

    socket.on('game:state', (payload) => setGameState(payload));

    for (const event of GRANULAR_EVENTS) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socket as any).on(event, (payload: unknown) => {
        setLastEvent({ event, payload, timestamp: Date.now() });
      });
    }

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomCode, role]);

  const emit = useCallback(
    <E extends keyof ClientToServerEvents>(
      event: E,
      ...args: Parameters<ClientToServerEvents[E]>
    ) => {
      socketRef.current?.emit(event, ...args);
    },
    []
  );

  return { gameState, lastEvent, connectionStatus, emit };
}
