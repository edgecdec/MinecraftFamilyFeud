'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const FLIP_DURATION_MS = 600;

interface AnswerTileProps {
  index: number;
  text?: string;
  count?: number;
  revealed: boolean;
  animating: boolean;
}

export default function AnswerTile({ index, text, count, revealed, animating }: AnswerTileProps) {
  const [flipped, setFlipped] = useState(revealed && !animating);

  useEffect(() => {
    if (animating) {
      const timer = setTimeout(() => setFlipped(true), 50);
      return () => clearTimeout(timer);
    }
  }, [animating]);

  useEffect(() => {
    if (revealed && !animating) setFlipped(true);
  }, [revealed, animating]);

  const tileBase = {
    position: 'absolute' as const,
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden' as const,
    display: 'flex',
    alignItems: 'center',
    px: 2,
    gap: 2,
    border: '3px solid',
  };

  return (
    <Box sx={{ height: 64, perspective: '600px' }}>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: `transform ${FLIP_DURATION_MS}ms ease-in-out`,
          transform: flipped ? 'rotateX(180deg)' : 'rotateX(0deg)',
        }}
      >
        {/* Front — hidden tile */}
        <Box sx={{ ...tileBase, borderColor: '#555', bgcolor: 'background.paper' }}>
          <Typography variant="h6" sx={{ color: 'text.secondary', minWidth: 36, textAlign: 'center', fontSize: '0.85rem' }}>
            {index + 1}
          </Typography>
          <Typography sx={{ flex: 1, color: 'text.secondary', fontFamily: '"Press Start 2P", monospace', fontSize: '0.7rem', letterSpacing: 4 }}>
            ■■■■■■
          </Typography>
        </Box>

        {/* Back — revealed tile */}
        <Box sx={{ ...tileBase, borderColor: 'secondary.main', bgcolor: 'secondary.main', transform: 'rotateX(180deg)' }}>
          <Typography variant="h6" sx={{ color: '#FFF', minWidth: 36, textAlign: 'center', fontSize: '0.85rem' }}>
            {index + 1}
          </Typography>
          <Typography sx={{ flex: 1, color: '#FFF', fontFamily: '"Press Start 2P", monospace', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {text}
          </Typography>
          <Typography variant="h6" sx={{ color: 'primary.main', fontSize: '0.85rem', minWidth: 40, textAlign: 'right' }}>
            {count}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
