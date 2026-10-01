import { createTheme } from '@mui/material/styles'

// Light version of the enclosure theme: white pages, the printed orange for
// fills, and dark brown text. Orange itself is only about 2.9:1 on white, so it
// is never used for text or thin lines there; orangeInk is the deeper shade for that.
export const palette = {
    orange: '#F27A24', // printed body: fills (nav bar, header, primary buttons)
    orangeDeep: '#BD5512', // shaded edges and rims
    orangeSoft: '#F79A56', // lighter face, hover
    orangeInk: '#A84A00', // orange used as text, outlines and indicators on white (about 6:1)
    ink: '#1F1A17', // text, and the text colour used on orange fills
    white: '#FFFFFF',
    panel: '#FFF6EC', // cards and panels, a faint orange tint
    line: '#E6D5C3', // dividers
    muted: '#5E5249', // secondary text (about 7:1 on white)
    warn: '#8A5A00', // amber, dark enough to read as text on white
    alert: '#B3261E', // red, clearly apart from the orange
    ok: '#1F7A44',
}

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: palette.orange, dark: palette.orangeDeep, light: palette.orangeSoft, contrastText: palette.ink },
        secondary: { main: palette.orangeInk, contrastText: palette.white },
        error: { main: palette.alert, contrastText: palette.white },
        warning: { main: palette.warn, contrastText: palette.white },
        success: { main: palette.ok, contrastText: palette.white },
        background: { default: palette.white, paper: palette.panel },
        text: { primary: palette.ink, secondary: palette.muted },
        divider: palette.line,
    },
    shape: { borderRadius: 4 },
    typography: {
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        h1: { fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5em' },
        h2: { fontSize: '1.25rem', fontWeight: 700 },
        button: { textTransform: 'none', fontWeight: 700 },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                // Hooks for the plain-CSS classes in index.css.
                ':root': {
                    '--sv-bg': palette.white,
                    '--sv-panel': palette.panel,
                    '--sv-line': palette.line,
                    '--sv-text': palette.ink,
                    '--sv-muted': palette.muted,
                    '--sv-accent': palette.orange,
                    '--sv-accent-text': palette.orangeInk,
                    '--sv-accent-deep': palette.orangeDeep,
                    '--sv-warn': palette.warn,
                    '--sv-alert': palette.alert,
                    '--sv-ok': palette.ok,
                },
                body: { backgroundColor: palette.white, color: palette.ink },
                // Dark ring: visible on white and on orange (amber would vanish on both).
                ':focus-visible': { outline: `3px solid ${palette.ink}`, outlineOffset: '2px' },
            },
        },
        MuiPaper: {
            styleOverrides: { root: { backgroundImage: 'none', border: `1px solid ${palette.line}` } },
        },
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: { minHeight: 48, paddingInline: 20 },
                containedPrimary: {
                    boxShadow: `inset 0 -3px 0 ${palette.orangeDeep}`, // layer shading at the bottom edge
                    '&:hover': { backgroundColor: palette.orangeSoft },
                },
                outlined: {
                    color: palette.orangeInk,
                    borderColor: palette.orangeInk,
                    borderWidth: 2,
                    '&:hover': { borderWidth: 2, backgroundColor: palette.panel },
                },
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
                    color: palette.ink, // dark on orange, about 6:1
                    minWidth: 0,
                    '&.Mui-selected': { color: palette.ink },
                },
                label: { fontSize: '0.75rem', '&.Mui-selected': { fontSize: '0.8125rem', fontWeight: 700 } },
            },
        },
    },
})

export default theme