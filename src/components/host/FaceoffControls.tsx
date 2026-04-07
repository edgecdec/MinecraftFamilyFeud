'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { GameEvent } from '@/hooks/useGameSocket';
import type { ClientToServerEvents, GameState } from '@/types';

const NOT_ON_BOARD = -1;

interface FaceoffControlsProps {
  gameState: GameState;
  lastEvent: GameEvent | null;
  emit: <E extends keyof ClientToServerEvents>(
    event: E,
    ...args: Parameters<ClientToServerEvents[E]>
  ) => void;
}

export default function FaceoffControls({ gameState, lastEvent, emit }: FaceoffControlsProps) {
  const [buzzerOpen, setBuzzerOpen] = useState(false);
  const [faceoffWinner, setFaceoffWinner] = useState<string | null>(null);

  const { faceoff, currentQuestion, teams, phase } = gameState;
  const buzzedTeams = faceoff?.buzzedTeams ?? [];
  const answeredTeams = faceoff?.answers.map((a) => a.teamName) ?? [];

  useEffect(() => {
    if (lastEvent?.event === 'game:faceoffResult') {
      const payload = lastEvent.payload as { winnerTeam: string };
      setFaceoffWinner(payload.winnerTeam);
    }
  }, [lastEvent]);

  // Reset state when entering a new faceoff
  useEffect(() => {
    if (phase === 'faceoff') {
      setFaceoffWinner(null);
      setBuzzerOpen(false);
    }
  }, [phase]);

  const handleOpenBuzzer = () => {
    emit('host:openFaceoff', {});
    setBuzzerOpen(true);
  };

  const handlePlayOrPass = (choice: 'play' | 'pass') => {
    emit('host:playOrPass', { choice });
  };

  const isFaceoff = phase === 'faceoff';
  const isResolve = phase === 'faceoff-resolve';

  return (
    <Box sx={{ bgcolor: 'background.paper', p: 2, border: '3px solid', borderColor: 'divider' }}>
      <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
        Face-Off
      </Typography>

      {/* Step 1: Open buzzer */}
      {isFaceoff && !buzzerOpen && (
        <Button variant="contained" color="primary" fullWidth onClick={handleOpenBuzzer}>
          Open Buzzer
        </Button>
      )}

      {/* Step 2: Show buzz status */}
      {isFaceoff && buzzerOpen && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', mb: 1 }}>
            Buzzed In
          </Typography>
          <Stack direction="row" spacing={2}>
            {teams.map((t) => (
              <Box key={t.name} sx={{ textAlign: 'center', flex: 1 }}>
                <Typography sx={{ color: buzzedTeams.includes(t.name) ? 'primary.main' : 'text.secondary', fontWeight: 'bold' }}>
                  {t.name}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                  {buzzedTeams.includes(t.name) ? `#${buzzedTeams.indexOf(t.name) + 1}` : 'Waiting...'}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Step 3: Answer entry for each buzzed team */}
      {isFaceoff && buzzedTeams.length > 0 && currentQuestion && (
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          {buzzedTeams.map((teamName) => {
            const alreadyAnswered = answeredTeams.includes(teamName);
            if (alreadyAnswered) {
              const entry = faceoff?.answers.find((a) => a.teamName === teamName);
              const answerText = entry?.answerIndex !== null && entry?.answerIndex !== undefined
                ? currentQuestion.answers[entry.answerIndex].text
                : 'Not on board';
              return (
                <Box key={teamName}>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{teamName}&apos;s answer</Typography>
                  <Typography sx={{ color: 'primary.main' }}>{answerText}</Typography>
                </Box>
              );
            }
            return (
              <FaceoffAnswerSelect
                key={teamName}
                teamName={teamName}
                answers={currentQuestion.answers.map((a) => a.text)}
                revealedAnswers={gameState.revealedAnswers}
                emit={emit}
              />
            );
          })}
        </Stack>
      )}

      {/* Step 4: Faceoff resolved — show winner + play/pass */}
      {isResolve && faceoffWinner && (
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography sx={{ color: 'primary.main', textAlign: 'center', fontWeight: 'bold' }}>
            {faceoffWinner} wins the face-off!
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button variant="contained" color="primary" fullWidth onClick={() => handlePlayOrPass('play')}>
              Play
            </Button>
            <Button variant="outlined" color="secondary" fullWidth onClick={() => handlePlayOrPass('pass')}>
              Pass
            </Button>
          </Stack>
        </Stack>
      )}
    </Box>
  );
}

interface FaceoffAnswerSelectProps {
  teamName: string;
  answers: string[];
  revealedAnswers: number[];
  emit: <E extends keyof ClientToServerEvents>(
    event: E,
    ...args: Parameters<ClientToServerEvents[E]>
  ) => void;
}

function FaceoffAnswerSelect({ teamName, answers, revealedAnswers, emit }: FaceoffAnswerSelectProps) {
  const [selected, setSelected] = useState<number>(NOT_ON_BOARD);

  const handleSubmit = () => {
    const answerIndex = selected === NOT_ON_BOARD ? null : selected;
    emit('host:faceoffAnswer', { teamName, answerIndex });
  };

  return (
    <Box>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', mb: 0.5 }}>{teamName}&apos;s answer</Typography>
      <Stack direction="row" spacing={1}>
        <Select
          size="small"
          value={selected}
          onChange={(e) => setSelected(e.target.value as number)}
          sx={{ flex: 1, fontSize: '0.85rem' }}
        >
          <MenuItem value={NOT_ON_BOARD}>Not on board</MenuItem>
          {answers.map((text, i) => (
            <MenuItem key={i} value={i} disabled={revealedAnswers.includes(i)}>
              {i + 1}. {text}
            </MenuItem>
          ))}
        </Select>
        <Button variant="contained" size="small" onClick={handleSubmit}>
          Submit
        </Button>
      </Stack>
    </Box>
  );
}
