import { Link, useLocation } from 'react-router-dom'

/**
 * "Something's happening and you're not looking at Live" banner.
 * Shown on every page while sonar is lost or something is closing
 * fast - with a jump-to-Live link, except on the Live page itself.
 */
export default function CriticalBanner({ sonar }) {
  const location = useLocation()
  const isLivePage = location.pathname === '/live'

  if (!(sonar.fast || sonar.lost)) return null

  return (
    <div className="banner" role="alert">
      {sonar.lost ? 'Sensor signal lost.' : 'Something is closing fast.'}
      {!isLivePage && (
        <>
          {' '}
          <Link to="/live">Go to Live</Link>
        </>
      )}
    </div>
  )
}