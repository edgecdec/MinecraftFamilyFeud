'use client';

import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useGameSocket } from '@/hooks/useGameSocket';
import QuestionSelector from '@/components/host/QuestionSelector';

const HOST_PIN = '0000';

export default function HostPanel() {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const { gameState, lastEvent, connectionStatus, emit } = useGameSocket(roomCode, 'host');

  useEffect(() => {
    if (connectionStatus === 'connected' && !roomCode) {
      emit('host:create', { hostPin: HOST_PIN });
    }
  }, [connectionStatus, roomCode, emit]);

  useEffect(() => {
    if (lastEvent?.event === 'game:created') {
      const payload = lastEvent.payload as { roomCode: string };
      setRoomCode(payload.roomCode);
    }
  }, [lastEvent]);

  const handleSelectQuestion = useCallback(
    (questionId: string) => {
      emit('host:selectQuestion', { questionId });
    },
    [emit]
  );

  if (connectionStatus !== 'connected') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Typography variant="h5" sx={{ color: 'text.secondary' }}>Connecting...</Typography>
      </Box>
    );
  }

  const phase = gameState?.phase ?? 'lobby';
  const teams = gameState?.teams ?? [];
  const scores = gameState?.scores ?? {};
  const isLobby = phase === 'lobby' || phase === 'roundEnd';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 3 }}>
      <Stack spacing={3} sx={{ maxWidth: 700, mx: 'auto' }}>
        {/* Room Code */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
            Room Code
          </Typography>
          <Typography variant="h2" sx={{ color: 'primary.main', letterSpacing: 8 }}>
            {roomCode ?? '...'}
          </Typography>
        </Box>

        {/* Connected Teams */}
        <Box sx={{ bgcolor: 'background.paper', p: 2, border: '3px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
            Teams
          </Typography>
          {teams.length === 0 ? (
            <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
              Waiting for teams to join...
            </Typography>
          ) : (
            <Stack direction="row" spacing={1}>
              {teams.map((t) => (
                <Chip key={t.name} label={t.name} color="primary" variant="outlined" />
              ))}
            </Stack>
          )}
        </Box>

        {/* Scores */}
        {teams.length > 0 && (
          <Box sx={{ bgcolor: 'background.paper', p: 2, border: '3px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
              Scores
            </Typography>
            <Stack direction="row" spacing={4} sx={{ justifyContent: 'center' }}>
              {teams.map((t) => (
                <Box key={t.name} sx={{ textAlign: 'center' }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{t.name}</Typography>
                  <Typography variant="h4" sx={{ color: 'primary.main' }}>{scores[t.name] ?? 0}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Question Selector — shown in lobby or roundEnd */}
        {isLobby && (
          <QuestionSelector onSelect={handleSelectQuestion} disabled={teams.length < 1} />
        )}

        {/* Current phase indicator */}
        {!isLobby && (
          <Box sx={{ bgcolor: 'background.paper', p: 2, border: '3px solid', borderColor: 'divider', textAlign: 'center' }}>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', mb: 0.5 }}>
              Current Phase
            </Typography>
            <Typography variant="h5" sx={{ color: 'secondary.main' }}>
              {phase.toUpperCase()}
            </Typography>
            {gameState?.currentQuestion && (
              <Typography sx={{ color: 'text.primary', mt: 1, fontSize: '0.85rem' }}>
                {gameState.currentQuestion.question}
              </Typography>
            )}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
