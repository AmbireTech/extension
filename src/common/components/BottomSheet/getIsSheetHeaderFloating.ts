import IS_SHEET_HEADER_FLOATING from './isSheetHeaderFloating'

/**
 * Whether a sheet's header floats over its content. Not over a list with sticky section
 * headers: React Native pins those to the top of the list, which would be under the header,
 * and offers no offset for them. A SectionList's headers are sticky by default on iOS.
 */
const getIsSheetHeaderFloating = (sectionListProps?: {
  stickySectionHeadersEnabled?: boolean | null
}) =>
  IS_SHEET_HEADER_FLOATING &&
  !(sectionListProps && sectionListProps.stickySectionHeadersEnabled !== false)

export default getIsSheetHeaderFloating
