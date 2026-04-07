'use client';

import { createTheme } from '@mui/material/styles';

const PIXEL_FONT = '"Press Start 2P", monospace';

const minecraftTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#4CAF50' },
    secondary: { main: '#8B6914' },
    background: { default: '#2D2D2D', paper: '#3C3C3C' },
    text: { primary: '#FFFFFF', secondary: '#B0B0B0' },
  },
  typography: {
    fontFamily: 'system-ui, sans-serif',
    h1: { fontFamily: PIXEL_FONT },
    h2: { fontFamily: PIXEL_FONT },
    h3: { fontFamily: PIXEL_FONT },
    h4: { fontFamily: PIXEL_FONT },
    h5: { fontFamily: PIXEL_FONT },
    h6: { fontFamily: PIXEL_FONT },
  },
  shape: { borderRadius: 0 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: PIXEL_FONT,
          fontSize: '0.75rem',
          border: '3px solid',
          textTransform: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { border: '3px solid', borderColor: '#555' },
      },
    },
  },
});

export default minecraftTheme;
