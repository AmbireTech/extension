import React from 'react'

import { TrueSheetOverlay } from '@lodev09/react-native-true-sheet'

const AboveSheetsOverlay = ({ children }: { children: React.ReactNode }) => (
  <TrueSheetOverlay>{children}</TrueSheetOverlay>
)

export default AboveSheetsOverlay
