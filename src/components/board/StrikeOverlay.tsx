'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { keyframes } from '@emotion/react';

const STRIKE_DISPLAY_MS = 1500;

const scaleShake = keyframes`
  0% { transform: scale(0); opacity: 1; }
  30% { transform: scale(1.2); opacity: 1; }
  40% { transform: scale(1.2) translateX(-10px); }
  50% { transform: scale(1.2) translateX(10px); }
  60% { transform: scale(1.2) translateX(-6px); }
  70% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1); opacity: 0; }
`;

interface StrikeOverlayProps {
  visible: boolean;
}

export default function StrikeOverlay({ visible }: StrikeOverlayProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setShow(true);
    const timer = setTimeout(() => setShow(false), STRIKE_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!show) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <Typography
        sx={{
          fontSize: '12rem',
          fontFamily: '"Press Start 2P", monospace',
          color: 'error.main',
          animation: `${scaleShake} ${STRIKE_DISPLAY_MS}ms ease-out forwards`,
          textShadow: '0 0 40px rgba(255,0,0,0.6)',
        }}
      >
        ✕
      </Typography>
    </Box>
  );
}
