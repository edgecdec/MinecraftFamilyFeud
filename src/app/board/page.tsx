'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { useGameSocket } from '@/hooks/useGameSocket';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import GameBoard from '@/components/board/GameBoard';

function BoardContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('room');
  const [muted, setMuted] = useState(false);
  const { gameState, lastEvent, connectionStatus } = useGameSocket(roomCode, 'board');

  useSoundEffects(lastEvent, muted);

  if (!roomCode) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Typography variant="h5" sx={{ color: 'error.main' }}>No room code provided</Typography>
      </Box>
    );
  }

  const muteButton = (
    <IconButton
      onClick={() => setMuted((m) => !m)}
      aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
      sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10, color: 'text.secondary' }}
    >
      {muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
    </IconButton>
  );

  if (connectionStatus !== 'connected' || !gameState) {
    return (
      <Box sx={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        {muteButton}
        <Typography variant="h5" sx={{ color: 'text.secondary' }}>Connecting...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {muteButton}
      <GameBoard gameState={gameState} lastEvent={lastEvent} />
    </Box>
  );
}

export default function BoardPage() {
  return (
    <Suspense>
      <BoardContent />
    </Suspense>
  );
}
