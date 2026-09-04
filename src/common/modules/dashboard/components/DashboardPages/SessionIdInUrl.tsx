import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Writes the dashboard's session id to the url. The sessions this screen's pages open
 * are tied to the extension's port through the id in the url, so the background can
 * drop them when the tab goes away (there is no window event for that - see
 * `port.onDisconnect`). Each page owns the lifecycle of its own session, so there is
 * nothing to undo here.
 *
 * A component of its own because `useSearchParams` subscribes to the router's
 * location: held here, a navigation re-renders this one node instead of the whole
 * dashboard - which on mobile stays mounted behind every screen the user opens.
 */
const SessionIdInUrl = ({ sessionId }: { sessionId: string }) => {
  const [, setSearchParams] = useSearchParams()

  useEffect(() => {
    setSearchParams((prev) => {
      prev.set('sessionId', sessionId)
      return prev
    })
    // setSearchParams changes identity on every call, so it must stay out of the deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  return null
}

export default SessionIdInUrl
