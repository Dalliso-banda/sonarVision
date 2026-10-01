import { createTheme } from '@mui/material/styles'

// Palette sampled from the printed enclosure: orange PLA body, a deeper orange
// where the layers shade, the translucent amber lip of the lid, and the dark
// wood bench it sits on.
export const palette = {
  orange: '#F28A30', // printed body
  orangeDeep: '#C2601A', // shaded edges and rim
  orangeSoft: '#F7B26B', // light face of the lid
  amber: '#F2C14E', // translucent lip, used for warnings and focus
  bench: '#1F1A17', // dark wood, page background
  benchRaised: '#2C2520', // panels sitting on the bench
  grain: '#4A3F37', // wood-grain lines, dividers
  cream: '#F6EBDD', // text on dark
  creamMuted: '#CDBBA6', // secondary text
  alert: '#FF5A4F', // kept clearly apart from the orange primary
  ok: '#8ED1A0',
}

// Orange with white text is only about 2.3:1; dark text on this orange is about 8:1.
// Every orange surface below uses bench-coloured text for that reason.
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: palette.orange, dark: palette.orangeDeep, light: palette.orangeSoft, contrastText: palette.bench },
    secondary: { main: palette.amber, contrastText: palette.bench },
    error: { main: palette.alert, contrastText: palette.bench },
    warning: { main: palette.amber, contrastText: palette.bench },
    success: { main: palette.ok, contrastText: palette.bench },
    background: { default: palette.bench, paper: palette.benchRaised },
    text: { primary: palette.cream, secondary: palette.creamMuted },
    divider: palette.grain,
  },
  shape: { borderRadius: 4 }, // the print has small, slightly soft corners
  typography: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h1: { fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5em' },
    h2: { fontSize: '1.25rem', fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Hooks for the existing plain-CSS classes (.btn, .status, .banner, ...).
        ':root': {
          '--sv-bg': palette.bench,
          '--sv-panel': palette.benchRaised,
          '--sv-line': palette.grain,
          '--sv-text': palette.cream,
          '--sv-muted': palette.creamMuted,
          '--sv-accent': palette.orange,
          '--sv-accent-deep': palette.orangeDeep,
          '--sv-warn': palette.amber,
          '--sv-alert': palette.alert,
          '--sv-ok': palette.ok,
        },
        body: { backgroundColor: palette.bench, color: palette.cream },
        // Keyboard focus must be obvious against both dark and orange surfaces.
        ':focus-visible': { outline: `3px solid ${palette.amber}`, outlineOffset: '2px' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        // Backgrounds stay flat; a thin rim stands in for the raised lip on the lid.
        root: { backgroundImage: 'none', border: `1px solid ${palette.grain}` },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 48, paddingInline: 20 }, // large touch target
        containedPrimary: {
          boxShadow: `inset 0 -3px 0 ${palette.orangeDeep}`, // layer shading at the bottom edge
          '&:hover': { backgroundColor: palette.orangeSoft },
        },
        outlined: { borderColor: palette.orange, borderWidth: 2, '&:hover': { borderWidth: 2 } },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: { height: 72, backgroundColor: palette.orange, borderTop: `2px solid ${palette.orangeDeep}` },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: palette.bench, // dark on orange, about 8:1
          minWidth: 0,
          '&.Mui-selected': { color: palette.bench },
        },
        label: { fontSize: '0.75rem', '&.Mui-selected': { fontSize: '0.8125rem', fontWeight: 700 } },
      },
    },
  },
})

export default theme