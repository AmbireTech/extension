import createGroupScreen from './createGroupScreen'

// Shared instances so a preload (e.g. from DashboardScreen) and the actual route rendering
// (MainRoutes) hit the same chunk instead of each triggering their own.
export const PopupGroupScreen = createGroupScreen(() => import('./popupRoutes'))
export const AuthGroupScreen = createGroupScreen(() => import('./authRoutes'))
export const SettingsGroupScreen = createGroupScreen(() => import('./settingsRoutes'))
