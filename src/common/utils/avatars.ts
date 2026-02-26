import { blockyColors } from '@common/components/Avatar/Blockies/utils'
import { generateSeedEthereum, getPolyconColors } from '@common/components/Avatar/Polycons/utils'
import Jazzicon from '@raugfer/jazzicon'
import { AvatarType } from '@web/extension-services/background/controllers/wallet-state'

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

    console.log('Debug: colors extracted from Jazzicon SVG:', colors) // Debug log

    return [colors[1]!, colors[2]!, colors[3]!]
  }

  if (avatarType === 'polycons') {
    const seed = generateSeedEthereum(address)
    const polyconColors = getPolyconColors(seed)

    return [polyconColors.fgColor, polyconColors.fgColor, polyconColors.bgColor]
  }

  return FALLBACK_COLORS
}

export { getAvatarColors }
