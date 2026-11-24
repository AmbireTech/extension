import { HEADER_BUTTON_SIZE } from '@common/components/HeaderButton/constants'
import flexbox from '@common/styles/utils/flexbox'

/** The dark circle behind the icon buttons of the header */
export const ROUND_BUTTON_STYLE = [
  flexbox.justifyCenter,
  flexbox.alignCenter,
  {
    borderRadius: HEADER_BUTTON_SIZE / 2,
    width: HEADER_BUTTON_SIZE,
    height: HEADER_BUTTON_SIZE,
    backgroundColor: '#000000A3',
    borderWidth: 1,
    borderColor: '#FFFFFF1F'
  }
]
