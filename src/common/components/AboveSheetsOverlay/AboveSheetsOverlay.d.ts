import React from 'react'

/**
 * Renders its children above every open bottom sheet. Native sheets are presented in their
 * own window, so content drawn at the app root (like toasts) would otherwise sit under them.
 * Web sheets are regular views, so there it renders the children as they are.
 */
declare const AboveSheetsOverlay: React.FC<{ children: React.ReactNode }>
export default AboveSheetsOverlay
