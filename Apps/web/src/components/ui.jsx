export const Page = ({ title, intro, children }) => (
  <>
    <h1>{title}</h1>
    {intro && <p>{intro}</p>}
    {children}
  </>
)
export const Empty = ({ title, children }) => (
  <div className="empty"><h2>{title}</h2><p>{children}</p></div>
)
