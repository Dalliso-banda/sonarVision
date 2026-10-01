import Box from '@mui/material/Box'
import NavBar from './NavBar'
import LiveRegions from './LiveRegions'
import CriticalBanner from './CriticalBanner'

/**
 * The page shell: skip link, screen-reader live regions, the nav
 * drawer, and the main content area (with the critical-sonar banner
 * pinned above whatever page is currently routed into it).
 */
export default function AppLayout({ sonar, children }) {
  
  const handleSkipToContent = (e) => {
    e.preventDefault()
    const mainElement = document.getElementById('main')
    if (mainElement) {
      mainElement.focus()
    }
  }

  return (
    <Box 
      className="app" 
      sx={{ 
        display: 'flex', 
        minHeight: '100vh', // Ensures layout fills screen height
        width: '100%' 
      }}
    >
      {/* Accessible Skip Link */}
      <Box
        component="a"
        className="skip"
        href="#main"
        onClick={handleSkipToContent}
        sx={{
          position: 'absolute',
          left: '-10000px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          '&:focus': {
            position: 'fixed',
            top: 16,
            left: 16,
            width: 'auto',
            height: 'auto',
            zIndex: 9999,
            backgroundColor: 'background.paper',
            padding: 2,
            borderRadius: 1,
            boxShadow: 3,
          }
        }}
      >
        Skip to content
      </Box>

      {/* Screen reader live announcements */}
      <LiveRegions />
      
      {/* Side or Top Navigation */}
      <NavBar />

      {/* Main content body stacked vertically */}
      <Box 
        component="main" 
        id="main" 
        tabIndex={-1} 
        sx={{ 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column', // Stacks CriticalBanner on top of children
          outline: 'none',          // Removes harsh browser outline on click focus
          minWidth: 0,             // Prevents flex items from bursting out horizontally
        }}
      >
        <CriticalBanner sonar={sonar} />
        <Box sx={{ p: 3, flexGrow: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
