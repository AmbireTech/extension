import { createContext, useContext } from 'react'

/**
 * Whether a sheet list's section headers are glass: frosted by the sticky wrapper around them,
 * so they leave out a fill of their own. Only below a floating sheet header.
 */
const SheetSectionHeaderGlassContext = createContext(false)

const useIsSheetSectionHeaderGlass = () => useContext(SheetSectionHeaderGlassContext)

export { SheetSectionHeaderGlassContext, useIsSheetSectionHeaderGlass }
