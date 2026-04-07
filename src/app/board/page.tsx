'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useGameSocket } from '@/hooks/useGameSocket';
import GameBoard from '@/components/board/GameBoard';

function BoardContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('room');
  const { gameState, lastEvent, connectionStatus } = useGameSocket(roomCode, 'board');

  if (!roomCode) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Typography variant="h5" sx={{ color: 'error.main' }}>No room code provided</Typography>
      </Box>
    );
  }

  if (connectionStatus !== 'connected' || !gameState) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Typography variant="h5" sx={{ color: 'text.secondary' }}>Connecting...</Typography>
      </Box>
    );
  }

  return <GameBoard gameState={gameState} lastEvent={lastEvent} />;
}

export default function BoardPage() {
  return (
    <Suspense>
      <BoardContent />
    </Suspense>
  );
}
