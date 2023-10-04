export interface SessionProp {
  origin: string
  icon: string
  name: string
}

export class Session {
  origin = ''

  icon = ''

  name = ''

  web3ViewRef = null

  pushMessage(event: any, data: any) {
    try {
      const dataToPass = JSON.stringify({ event, data })

      this.web3ViewRef?.injectJavaScript(
        `try {
          window.handleBackgroundMessage(${dataToPass});
        } catch (e) {
          alert('Ambire could not send message to the dapp (handleBackgroundMessage): ' + e)
        }

        true;`
      )
    } catch (e) {
      console.error('Ambire could not send message to the dapp (handleBackgroundMessage). ', e)
    }
  }

  constructor(data: SessionProp | null, web3ViewRef: any) {
    this.web3ViewRef = web3ViewRef
    if (data) {
      this.setProp(data)
    }
  }

  setProp({ origin, icon, name }: SessionProp) {
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

const createSession = (key: string, data: null | SessionProp, web3ViewRef) => {
  const session = new Session(data, web3ViewRef)
  sessionMap.set(key, session)

  return session
}

const getOrCreateSession = (id: number | string, origin: string, web3ViewRef) => {
  if (sessionMap.has(`${id}-${origin}`)) {
    return getSession(`${id}-${origin}`)
  }

  return createSession(`${id}-${origin}`, null, web3ViewRef)
}
const deleteSession = (key: string) => {
  sessionMap.delete(key)
}

const broadcastEvent = (ev: any, data?: any, origin?: string) => {
  let sessions: { key: string; data: Session }[] = []
  sessionMap.forEach((session, key) => {
    if (session) {
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
