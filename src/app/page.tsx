'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { ROOM_CODE_LENGTH } from '@/lib/constants';

export default function Home() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [teamName, setTeamName] = useState('');

  const canJoin = roomCode.length === ROOM_CODE_LENGTH && teamName.trim().length > 0;

  const handleJoin = () => {
    if (!canJoin) return;
    router.push(`/buzzer?room=${roomCode.toUpperCase()}&team=${encodeURIComponent(teamName.trim())}`);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Typography
        variant="h3"
        component="h1"
        sx={{ color: 'primary.main', textAlign: 'center', mb: 1 }}
      >
        MINECRAFT
      </Typography>
      <Typography
        variant="h4"
        component="h2"
        sx={{ color: 'secondary.main', textAlign: 'center', mb: 6 }}
      >
        FAMILY FEUD
      </Typography>

      <Stack spacing={4} sx={{ width: '100%', maxWidth: 400 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          sx={{ py: 2, fontSize: '1rem' }}
          onClick={() => router.push('/host')}
        >
          Host a Game
        </Button>

        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 3,
            border: '3px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', color: 'text.primary' }}>
            Join a Game
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Room Code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, ROOM_CODE_LENGTH))}
              slotProps={{ htmlInput: { maxLength: ROOM_CODE_LENGTH, style: { textTransform: 'uppercase' } } }}
              fullWidth
            />
            <TextField
              label="Team Name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              color="secondary"
              size="large"
              fullWidth
              disabled={!canJoin}
              onClick={handleJoin}
              sx={{ py: 1.5 }}
            >
              Join
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
