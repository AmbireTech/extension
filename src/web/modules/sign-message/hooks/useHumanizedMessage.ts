import { useEffect, useMemo, useState } from 'react'

import { Message } from '@ambire-common/interfaces/userRequest'
import {
  Erc7730ResolvedDescriptor,
  fetchErc7730DescriptorForMessage,
  humanizeMessage
} from '@ambire-common/libs/humanizer'
import { IrMessage } from '@ambire-common/libs/humanizer/interfaces'
import { relayerCall } from '@ambire-common/libs/relayerCall/relayerCall'
import { RELAYER_URL } from '@env'

const ERC7730_DESCRIPTOR_WAIT_MS = 4000
const callRelayer = relayerCall.bind({ url: RELAYER_URL, fetch })

type UseHumanizedMessageResult = {
  humanizedMessage?: IrMessage
  isHumanizing: boolean
}

const useHumanizedMessage = (message?: Message | null): UseHumanizedMessageResult => {
  const [erc7730Descriptor, setErc7730Descriptor] = useState<Erc7730ResolvedDescriptor | null>(null)
  const [shouldUseFallback, setShouldUseFallback] = useState(false)

  useEffect(() => {
    let isMounted = true
    setErc7730Descriptor(null)
    setShouldUseFallback(false)

    if (!message || message.content.kind !== 'typedMessage') {
      return () => {
        isMounted = false
      }
    }

    const fallbackTimeout = setTimeout(() => {
      if (!isMounted) return
      setShouldUseFallback(true)
    }, ERC7730_DESCRIPTOR_WAIT_MS)

    fetchErc7730DescriptorForMessage(message, { callRelayer })
      .then((descriptor) => {
        if (!isMounted) return

        if (descriptor) {
          setErc7730Descriptor(descriptor)
        } else {
          setShouldUseFallback(true)
        }
      })
      .catch((error) => {
        console.error(error)
        if (!isMounted) return
        setShouldUseFallback(true)
      })
      .finally(() => {
        clearTimeout(fallbackTimeout)
      })

    return () => {
      isMounted = false
      clearTimeout(fallbackTimeout)
    }
  }, [message])

  const humanizedMessage = useMemo(() => {
    if (!message) return undefined
    if (message.content.kind !== 'typedMessage') return humanizeMessage(message)
    if (erc7730Descriptor) return humanizeMessage(message, { erc7730Descriptor })
    if (shouldUseFallback) return humanizeMessage(message)

    return undefined
  }, [erc7730Descriptor, message, shouldUseFallback])

  return {
    humanizedMessage,
    isHumanizing:
      !!message &&
      message.content.kind === 'typedMessage' &&
      !erc7730Descriptor &&
      !shouldUseFallback
  }
}

export default useHumanizedMessage
