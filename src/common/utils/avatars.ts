import { isAddress } from 'ethers'

import { blockyColors } from '@common/components/Avatar/Blockies/utils'
import Jazzicon from '@raugfer/jazzicon'

type AvatarType = 'ens' | 'jazz' | 'blockies' | 'legacy'

const getAvatarType = (pfp: string, ensAvatar?: string | null): AvatarType => {
  if (ensAvatar) return 'ens'

  if (isAddress(pfp)) {
    return 'jazz'
  }

  return 'legacy'
}

const FALLBACK_COLORS: AvatarColors = ['#6000FF', '#A36AF8', '#35008C']

export type AvatarColors = [string, string, string]

const getAvatarColors = (pfp: string): AvatarColors => {
  const avatarType = getAvatarType(pfp)

  if (avatarType === 'blockies') {
    return blockyColors(pfp)
  }
  if (avatarType === 'jazz') {
    const jazzIcon = Jazzicon(pfp)
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
