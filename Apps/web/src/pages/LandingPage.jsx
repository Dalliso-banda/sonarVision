import { Box, Typography, Paper, Avatar, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import SensorsIcon from '@mui/icons-material/Sensors'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import Logo from '../components/Logo'

const features = [
  { title: 'Hear what is ahead', desc: 'Beeps get faster as you get closer', icon: <SensorsIcon sx={{ color: '#C2601A' }} />, iconBg: '#FDEBDD' },
  { title: 'Know what it is', desc: 'Names people, chairs, cars and more', icon: <VisibilityOutlinedIcon sx={{ color: '#1F7A6B' }} />, iconBg: '#DDF3EE' },
  { title: 'Stay private', desc: 'Pictures stay on your phone', icon: <LockOutlinedIcon sx={{ color: '#6B4BB5' }} />, iconBg: '#EDE5F7' },
]

// Same structure as the TrackCash onboarding screen, in the Sonar Vision theme.
export default function Landing() {
  const navigate = useNavigate()

  return (
    <Box
      component="main"
      id="main"
      tabIndex={-1}
      sx={{ bgcolor: 'background.default', minHeight: '100dvh', width: '100%', display: 'flex', flexDirection: 'column', outline: 'none' }}
    >
      {/* Header */}
      <Box
        sx={(t) => ({
          bgcolor: 'primary.main',
          color: 'primary.contrastText', // dark on orange: white here would be about 2.3:1
          pt: 'calc(env(safe-area-inset-top) + 32px)', pb: 6, px: 4,
          textAlign: 'center',
          minHeight: '42dvh', // fills the top of the screen
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
          borderBottom: `4px solid ${t.palette.primary.dark}`,
        })}
      >
        <Avatar variant="rounded" aria-hidden="true" sx={{ bgcolor: 'rgba(31,26,23,0.14)', color: 'primary.contrastText', width: 100, height: 100, borderRadius: '20px' }}>
          <Logo/>
        </Avatar>
        <Typography variant="h1" sx={{ fontSize: '2.125rem', fontWeight: 'bold', letterSpacing: '-0.5px', m: 0 }}>
          Sonar Vision
        </Typography>
        <Typography sx={{ maxWidth: 260, lineHeight: 1.4 }}>
          Know exactly what is ahead and how far away it is
        </Typography>
      </Box>

      {/* Feature cards */}
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, px: 3, mt: 4, display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
        {features.map((feat) => (
          <Paper
            component="li"
            key={feat.title}
            elevation={0}
            sx={{ p: 2, borderRadius: '20px', display: 'flex', alignItems: 'center', gap: 2 }}
          >
            <Avatar variant="rounded" aria-hidden="true" sx={{ bgcolor: feat.iconBg, width: 48, height: 48, borderRadius: '14px' }}>
              {feat.icon}
            </Avatar>
            <Box>
              <Typography component="h2" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>{feat.title}</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', mt: 0.3 }}>{feat.desc}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Footer actions */}
      <Box sx={{ p: 3, pb: 'calc(env(safe-area-inset-bottom) + 32px)', textAlign: 'center', width: '100%', maxWidth: 560, alignSelf: 'center' }}>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 2 }}>
          Sonar Vision adds to your cane or guide dog. It does not replace them.
        </Typography>
        <Button fullWidth variant="contained" onClick={() => navigate('/live')} sx={{ borderRadius: '20px', py: 1.8, fontSize: '1.1rem' }}>
          Get started
        </Button>
      </Box>
    </Box>
  )
}