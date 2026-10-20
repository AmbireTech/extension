import { HD_PATH_TEMPLATE_TYPE } from '@ambire-common/consts/derivation'
import { KeyIterator as KeyIteratorInterface } from '@ambire-common/interfaces/keyIterator'
import { ExternalSignerController } from '@ambire-common/interfaces/keystore'
import { getHdPathFromTemplate } from '@ambire-common/utils/hdPath'

interface KeyIteratorProps {
  controller: ExternalSignerController
}

class OneKeyKeyIterator implements KeyIteratorInterface {
  type = 'onekey' as const

  subType = 'hw' as const

  controller: ExternalSignerController

  constructor({ controller }: KeyIteratorProps) {
    if (!controller?.retrieveAddresses) {
      throw new Error("Ambire couldn't connect to your OneKey. Please try again.")
    }

    this.controller = controller
  }

  async retrieve(
    fromToArr: { from: number; to: number }[],
    hdPathTemplate?: HD_PATH_TEMPLATE_TYPE
  ) {
    if (!hdPathTemplate || !this.controller.retrieveAddresses) {
      throw new Error("Ambire couldn't load accounts from your OneKey. Please try again.")
    }

    const paths: string[] = []
    for (const { from, to } of fromToArr) {
      if ((!from && from !== 0) || (!to && to !== 0)) {
        throw new Error("Ambire couldn't load accounts from your OneKey. Please try again.")
      }

      for (let index = from; index <= to; index++) {
        paths.push(getHdPathFromTemplate(hdPathTemplate, index))
      }
    }

    return this.controller.retrieveAddresses(paths)
  }
}

export default OneKeyKeyIterator
