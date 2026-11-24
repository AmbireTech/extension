import flexbox from '@common/styles/utils/flexbox'

/** The account button and the menu button, a bit taller than the other screens' header buttons */
export const DASHBOARD_HEADER_BUTTON_SIZE = 44

/** The dark circle behind the icon buttons of the header */
export const ROUND_BUTTON_STYLE = [
  flexbox.justifyCenter,
  flexbox.alignCenter,
  {
    borderRadius: DASHBOARD_HEADER_BUTTON_SIZE / 2,
    width: DASHBOARD_HEADER_BUTTON_SIZE,
    height: DASHBOARD_HEADER_BUTTON_SIZE,
    backgroundColor: '#000000A3',
    borderWidth: 1,
    borderColor: '#FFFFFF1F'
  }
]
