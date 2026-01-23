import { blockyColors } from '@common/components/Avatar/Blockies/utils'
import Jazzicon from '@raugfer/jazzicon'
import { AvatarType } from '@web/extension-services/background/controllers/wallet-state'

const getAvatarType = (avatarType: AvatarType, canBeEns?: boolean): AvatarType => {
  if (canBeEns) return 'ens'

  return avatarType
}

const FALLBACK_COLORS: AvatarColors = ['#6000FF', '#A36AF8', '#35008C']

export type AvatarColors = [string, string, string]

const getAvatarColors = (avatarType: AvatarType, address: string): AvatarColors => {
  if (avatarType === 'blockies') {
    return blockyColors(address)
  }
  if (avatarType === 'jazzicon') {
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

    return [colors[2]!, colors[1]!, colors[0]!]
  }

  return FALLBACK_COLORS
}

export { getAvatarType, getAvatarColors }
