import PQueue from 'p-queue'
import React from 'react'

import useNavigation from '@common/hooks/useNavigation'
import useToast from '@common/hooks/useToast'

// !IMPORTANT!: Ledger instance only allow one request at a time,
// so we need a queue to control the request.
const useTaskQueue = () => {
  const queueRef = React.useRef(new PQueue({ concurrency: 1 }))
  const { goBack } = useNavigation()
  const { addToast } = useToast()

  const createTask = React.useCallback(async (task: () => Promise<any>) => {
    return queueRef.current.add(task)
  }, [])

  React.useEffect(() => {
    queueRef.current.on('error', (e) => {
      addToast('Unable to connect to Hardware wallet. Please try to re-connect.', { error: true })
      goBack()
    })

    return () => {
      queueRef.current.clear()
    }
  }, [])

  return { queueRef, createTask }
}

export default useTaskQueue
