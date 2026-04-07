'use client';

import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useGameSocket } from '@/hooks/useGameSocket';

const BUZZER_ACTIVE_PHASE = 'faceoff';

function triggerVibration() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(100);
  }
}

export default function BuzzerPage() {
  const params = useSearchParams();
  const roomCode = params.get('room');
  const teamName = params.get('team');

  const { gameState, lastEvent, connectionStatus, emit } = useGameSocket(
    roomCode,
    'team'
  );

  /* Join the game on mount */
  useEffect(() => {
    if (connectionStatus === 'connected' && roomCode && teamName) {
      emit('team:join', { roomCode, teamName });
    }
  }, [connectionStatus, roomCode, teamName, emit]);

  /* Vibrate when faceoff opens */
  useEffect(() => {
    if (lastEvent?.event === 'game:faceoffOpen') {
      triggerVibration();
    }
  }, [lastEvent]);

  const hasBuzzed = gameState?.faceoff?.buzzedTeams.includes(teamName ?? '') ?? false;
  const isFaceoff = gameState?.phase === BUZZER_ACTIVE_PHASE;
  const buzzerEnabled = isFaceoff && !hasBuzzed;

  const handleBuzz = useCallback(() => {
    if (!buzzerEnabled) return;
    emit('team:buzz', {} as Record<string, never>);
    triggerVibration();
  }, [buzzerEnabled, emit]);

  if (!roomCode || !teamName) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Typography variant="h6" sx={{ color: 'error.main' }}>Missing room code or team name.</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: 'background.default',
        p: 2,
        userSelect: 'none',
      }}
    >
      {/* Team name header */}
      <Typography
        variant="h5"
        sx={{ color: 'primary.main', mt: 2, mb: 1, textAlign: 'center' }}
      >
        {teamName}
      </Typography>

      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', mb: 2 }}
      >
        Room: {roomCode}
      </Typography>

      {/* Buzz button area — fills remaining space */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <Button
          disabled={!buzzerEnabled}
          onClick={handleBuzz}
          sx={{
            width: '80vw',
            height: '80vw',
            maxWidth: 400,
            maxHeight: 400,
            borderRadius: '50%',
            fontSize: '2rem',
            fontWeight: 'bold',
            border: '6px solid',
            transition: 'transform 0.1s, background-color 0.2s',
            ...(buzzerEnabled
              ? {
                  bgcolor: 'primary.main',
                  borderColor: 'primary.dark',
                  color: 'common.white',
                  '&:hover': { bgcolor: 'primary.light' },
                  '&:active': { transform: 'scale(0.95)' },
                }
              : hasBuzzed
                ? {
                    bgcolor: 'secondary.main',
                    borderColor: 'secondary.dark',
                    color: 'common.white',
                  }
                : {
                    bgcolor: 'action.disabledBackground',
                    borderColor: 'divider',
                    color: 'text.secondary',
                  }),
          }}
        >
          {buzzerEnabled ? 'BUZZ!' : hasBuzzed ? 'BUZZED' : 'WAIT'}
        </Button>
      </Box>

      {/* Connection status */}
      {connectionStatus !== 'connected' && (
        <Typography variant="body2" sx={{ color: 'error.main', mb: 2 }}>
          {connectionStatus === 'connecting' ? 'Connecting…' : 'Disconnected'}
        </Typography>
      )}
    </Box>
  );
}
