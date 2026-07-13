import React, { createContext, useContext } from 'react'

export const BottomSheetContext = createContext(false)

export const useIsInsideBottomSheet = () => useContext(BottomSheetContext)
