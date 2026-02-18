import { useRef, useState } from 'react'
import { ScrollView } from 'react-native'

const useIsScrollable = () => {
  const scrollViewRef = useRef<ScrollView>(null)
  const [isScrollable, setIsScrollable] = useState(false)

  const checkIsScrollable = () => {
    if (
      !scrollViewRef.current ||
      !('scrollHeight' in scrollViewRef.current) ||
      !('clientHeight' in scrollViewRef.current)
    )
      return

    const { scrollHeight, clientHeight } = scrollViewRef.current as unknown as HTMLDivElement

    setIsScrollable(scrollHeight > clientHeight)
  }

  return {
    scrollViewRef,
    isScrollable,
    checkIsScrollable
  }
}

export default useIsScrollable
