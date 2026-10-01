import { Link, useLocation } from 'react-router-dom'
import Paper from '@mui/material/Paper'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'

import SensorsIcon from '@mui/icons-material/Sensors'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import TuneIcon from '@mui/icons-material/Tune'
import HistoryIcon from '@mui/icons-material/History'
import SettingsIcon from '@mui/icons-material/Settings'

const NAV_ITEMS = [
  { path: '/live', label: 'Live', icon: <SensorsIcon /> },
  { path: '/people', label: 'People', icon: <PeopleAltIcon /> },
  { path: '/calibration', label: 'Calibration', icon: <TuneIcon /> },
  { path: '/history', label: 'History', icon: <HistoryIcon /> },
  { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
]

// The bar is the printed orange. Icons and labels are bench-dark on it (about 8:1),
// and the current page is a dark pill with an orange icon, so the state shows by
// shape and by label weight, not by colour alone.
const actionSx = (theme) => ({
  color: theme.palette.primary.contrastText,
  minWidth: 0,
  paddingTop: 1,
  '& .MuiSvgIcon-root': {
    boxSizing: 'content-box',
    padding: '4px 16px',
    borderRadius: 16,
  },
  '&.Mui-selected': {
    color: theme.palette.primary.contrastText,
    '& .MuiSvgIcon-root': {
      backgroundColor: theme.palette.primary.contrastText,
      color: theme.palette.primary.main,
    },
  },
  // Amber would vanish on orange, so focus uses the dark colour.
  '&.Mui-focusVisible': {
    outline: `3px solid ${theme.palette.primary.contrastText}`,
    outlineOffset: -3,
  },
})

export default function NavBar() {
  const location = useLocation()

  const currentPath = NAV_ITEMS.some((item) => item.path === location.pathname)
    ? location.pathname
    : '/live'

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: theme.zIndex.appBar,
        backgroundColor: theme.palette.primary.main,
        border: 'none',
        borderTop: `2px solid ${theme.palette.primary.dark}`,
        borderRadius: 0,
      })}
    >
      <BottomNavigation component="nav" aria-label="Main" showLabels value={currentPath} sx={{ height: 72, bgcolor: 'transparent', borderTop: 'none' }}>
        {NAV_ITEMS.map(({ path, label, icon }) => (
          <BottomNavigationAction
            key={path}
            component={Link}
            to={path}
            label={label}
            value={path}
            icon={icon}
            aria-current={path === currentPath ? 'page' : undefined}
            sx={actionSx}
          />
        ))}
      </BottomNavigation>
    </Paper>
  )
}