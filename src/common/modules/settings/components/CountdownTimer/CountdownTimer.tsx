import React, { useEffect, useState } from 'react'

import Text from '@common/components/Text'

interface Props {
  seconds: number
  setTimeIsUp: (isTimeIsUp: boolean) => void
}

// Copied over from the web app implementation, ideally should live in ambire-common
const CountdownTimer: React.FC<Props> = ({ seconds: initialSeconds, setTimeIsUp }) => {
  const [counter, setCounter] = useState(initialSeconds)
  const [timerFormatted, setTimerFormatted] = useState('')

  const isTimeIsUp = timerFormatted === '0:00'

  useEffect(() => {
    const timer = counter > 0 && setInterval(() => setCounter(counter - 1), 1000)
    const minutes = Math.floor(counter / 60)
    let seconds = counter - minutes * 60
    if (seconds < 10) {
      seconds = `0${seconds}`
    }

    if (isTimeIsUp) setTimeIsUp(true)
    setTimerFormatted(`${minutes}:${seconds}`)

    return () => clearInterval(timer)
  }, [counter, isTimeIsUp, setTimeIsUp])

  return (
    <Text fontSize={25} weight="semiBold">
      {timerFormatted}
    </Text>
  )
}

export default CountdownTimer
