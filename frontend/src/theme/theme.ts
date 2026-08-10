import { alpha, createTheme } from '@mui/material/styles';

const brand = '#3556D8';
const ink = '#172033';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brand,
      dark: '#2743B0',
      light: '#EEF1FF',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#167766',
      dark: '#105C50',
      light: '#E9F7F3',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F6F7F9',
      paper: '#FFFFFF',
    },
    text: {
      primary: ink,
      secondary: '#5A6476',
    },
    divider: '#E3E6EC',
    success: { main: '#187A5A', light: '#EAF6F1', dark: '#10563F' },
    warning: { main: '#A65F08', light: '#FFF4E2', dark: '#784304' },
    error: { main: '#C83D4A', light: '#FDECEF', dark: '#972D38' },
    info: { main: '#2E6FA7', light: '#EAF3FA', dark: '#23547E' },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"DM Sans", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h3: { fontWeight: 750, fontSize: '2rem', lineHeight: 1.15, letterSpacing: '-0.03em' },
    h4: { fontWeight: 750, fontSize: '1.65rem', lineHeight: 1.2, letterSpacing: '-0.025em' },
    h5: { fontWeight: 700, fontSize: '1.2rem', lineHeight: 1.3, letterSpacing: '-0.015em' },
    h6: { fontWeight: 700, fontSize: '1rem', lineHeight: 1.4 },
    subtitle1: { fontWeight: 650 },
    body1: { fontSize: '0.94rem', lineHeight: 1.55 },
    body2: { fontSize: '0.835rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.45 },
    button: { textTransform: 'none', fontWeight: 700, letterSpacing: 0 },
  },
  shadows: [
    'none',
    '0 1px 2px rgba(35, 45, 68, 0.06)',
    '0 2px 6px rgba(35, 45, 68, 0.07)',
    '0 4px 10px rgba(35, 45, 68, 0.08)',
    '0 6px 14px rgba(35, 45, 68, 0.09)',
    ...Array(20).fill('0 8px 24px rgba(35, 45, 68, 0.10)'),
  ] as any,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box' },
        html: { WebkitFontSmoothing: 'antialiased' },
        body: { minWidth: 320 },
        '::selection': { backgroundColor: alpha(brand, 0.16) },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: 38,
          borderRadius: 10,
          paddingInline: 16,
          transition: 'background-color 180ms ease-out, border-color 180ms ease-out, transform 180ms ease-out',
          '&:active': { transform: 'translateY(1px)' },
        },
        sizeSmall: { minHeight: 32, paddingInline: 11 },
        outlined: { borderColor: '#D5D9E2', '&:hover': { borderColor: brand, backgroundColor: alpha(brand, 0.04) } },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'background-color 180ms ease-out, transform 180ms ease-out',
          '&:active': { transform: 'translateY(1px)' },
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none' }, outlined: { borderColor: '#E3E6EC' } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: '1px solid #E3E6EC', borderRadius: 12 } },
    },
    MuiCardContent: {
      styleOverrides: { root: { padding: 20, '&:last-child': { paddingBottom: 20 } } },
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#FFFFFF',
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#AEB5C2' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
        },
        notchedOutline: { borderColor: '#D9DDE5' },
        input: { paddingTop: 10, paddingBottom: 10 },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { color: '#5A6476' } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 14, border: '1px solid #E3E6EC' } } },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: '#ECEEF2', paddingTop: 12, paddingBottom: 12 },
        head: { fontWeight: 700, color: '#4B5568', backgroundColor: '#F8F9FB' },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 8, fontWeight: 650 }, sizeSmall: { height: 26 } },
    },
    MuiAlert: { styleOverrides: { root: { borderRadius: 10, alignItems: 'center' } } },
    MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 8, fontSize: '0.75rem' } } },
    MuiListItemButton: { styleOverrides: { root: { borderRadius: 8 } } },
    MuiLinearProgress: { styleOverrides: { root: { borderRadius: 4, height: 4 } } },
  },
});
