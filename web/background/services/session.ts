import permissionService from '@web/background/services/permission'
import PortMessage from '@web/message/portMessage'

export interface SessionProp {
  origin: string
  icon: string
  name: string
}

export class Session {
  origin = ''

  icon = ''

  name = ''

  pm: PortMessage | null = null

  pushMessage(event: any, data: any) {
    if (this.pm) {
      this.pm.send('message', { event, data })
    }
  }

  constructor(data?: SessionProp | null) {
    if (data) {
      console.log('constructor sesh', data)
      this.setProp(data)
    }
  }

  setPortMessage(pm: PortMessage) {
    this.pm = pm
  }

  setProp({ origin, icon, name }: SessionProp) {
    console.log('constructor sesh', origin, icon, name)

    this.origin = origin
    this.icon = icon
    this.name = name
  }
}

// for each tab
const sessionMap = new Map<string, Session | null>()

const getSession = (key: string) => {
  return sessionMap.get(key)
}

const createSession = (key: string, data?: null | SessionProp) => {
  const session = new Session(data)
  sessionMap.set(key, session)

  return session
}

const getOrCreateSession = (id: number, origin: string) => {
  if (sessionMap.has(`${id}-${origin}`)) {
    return getSession(`${id}-${origin}`)
  }

  return createSession(`${id}-${origin}`, null)
}
const deleteSession = (key: string) => {
  sessionMap.delete(key)
}

const broadcastEvent = (ev: any, data?: any, origin?: string) => {
  let sessions: { key: string; data: Session }[] = []
  sessionMap.forEach((session, key) => {
    if (session && permissionService.hasPermission(session.origin)) {
      sessions.push({
        key,
        data: session
      })
    }
  })

  // same origin
  if (origin) {
    sessions = sessions.filter((session) => session.data.origin === origin)
  }

  sessions.forEach((session) => {
    try {
      session.data.pushMessage?.(ev, data)
    } catch (e) {
      if (sessionMap.has(session.key)) {
        deleteSession(session.key)
      }
    }
  })
}

export default {
  getSession,
  getOrCreateSession,
  deleteSession,
  broadcastEvent
}
