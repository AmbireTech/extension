import { dataSlice, id } from 'ethers'

import { blockyColors } from '@common/components/Avatar/Blockies/utils'
import { generateSeedEthereum, getPolyconColors } from '@common/components/Avatar/Polycons/utils'
import { AvatarType } from '@common/controllers/wallet-state'
import Jazzicon from '@raugfer/jazzicon'

const FALLBACK_COLORS: AvatarColors = ['#6000FF', '#A36AF8', '#35008C']

export type AvatarColors = [string, string, string]

const getAvatarColors = (avatarType: AvatarType, address: string): AvatarColors => {
  if (avatarType === 'blockies') {
    return blockyColors(address)
  }
  if (avatarType === 'jazzicons') {
    const jazzIcon = Jazzicon(address)
    const fillAttributeRegex = /fill="([^"]*)"/g

    const fillAttributes = jazzIcon.match(fillAttributeRegex)

    const colors = fillAttributes?.map((fillAttribute) => {
      const color = fillAttribute.split('"')[1]
      return color
    })

    if (!colors || colors.length < 3) {
      return FALLBACK_COLORS
    }

    return [colors[1]!, colors[2]!, colors[3]!]
  }

  if (avatarType === 'polycons') {
    const seed = generateSeedEthereum(address)
    const polyconColors = getPolyconColors(seed)

    return [polyconColors.fgColor, polyconColors.fgColor, polyconColors.bgColor]
  }

  return FALLBACK_COLORS
}

/**
 * An address-shaped value to seed a Privacy Pools account's colors with, the way an address seeds a
 * regular account's. The account has no address - it is identified by its recovery phrase's id,
 * which the avatar color generators reject - so one is hashed out of that id. It only picks
 * colors, stays the same for the same account, and is never shown or used as an address.
 */
const getPrivacyPoolsColorSeed = (seedId: string) => dataSlice(id(seedId), 12)

export { getAvatarColors, getPrivacyPoolsColorSeed }
