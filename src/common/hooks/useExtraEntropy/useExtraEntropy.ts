import { useCallback } from 'react'

import { generateUuid } from '@ambire-common/utils/uuid'

const useExtraEntropy = () => {
  const getExtraEntropy = useCallback(() => {
    // TODO: steps to add support for the mobile app:
    // 1. install the polyfill: `yarn add react-native-performance`
    // 2. add it globally in a top-level file:
    // if (typeof performance === "undefined") {
    //   global.performance = { now }
    // }
    const uuid = generateUuid()
    const extraEntropy = `${uuid}-${performance.now()}`

    return extraEntropy
  }, [])

  return { getExtraEntropy }
}

export default useExtraEntropy
