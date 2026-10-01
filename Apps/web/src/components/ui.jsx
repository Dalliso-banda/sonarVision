import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

// Shared building blocks: one rounded-card look for every page, same as the landing page.
export const Page = ({ title, intro, children }) => (
  <Box sx={{ maxWidth: 736, mx: 'auto', display: 'grid', gap: 2.5 }}>
    <Box component="header">
      <Typography variant="h1" sx={{ fontSize: '2rem', lineHeight: 1.15, m: 0 }}>{title}</Typography>
      {intro && <Typography color="text.secondary" sx={{ mt: 1 }}>{intro}</Typography>}
    </Box>
    {children}
  </Box>
)

export const Card = ({ children, sx, component = 'section', ...rest }) => (
  <Paper component={component} elevation={0} sx={{ p: 2.5, borderRadius: '20px', ...sx }} {...rest}>
    {children}
  </Paper>
)

export const Empty = ({ title, children }) => (
  <Card>
    <Typography component="h2" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>{title}</Typography>
    <Typography color="text.secondary" sx={{ mt: 0.5 }}>{children}</Typography>
  </Card>
)