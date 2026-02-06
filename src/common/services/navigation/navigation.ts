import * as React from 'react'

import { NavigationContainerRef } from '@react-navigation/native'

// TODO: switch from <any> to <RootParamList>
export const navigationRef = React.createRef<NavigationContainerRef<any | null>>()
export const routeNameRef = React.createRef<string | null>()

// Mechanism for being able to navigate without the navigation prop.
// {@link https://reactnavigation.org/docs/navigating-without-navigation-prop/}
export function navigate(name: string, params?: object): void {
  if (navigationRef?.current?.isReady()) {
    if (name?.[0] === '/') {
      name = name.substring(1)
    }

    return navigationRef?.current?.navigate(name, params)
  }

  // Tries to perform navigation when react navigation is ready to handle
  // actions (is mounted). Otherwise, calling `navigate()` immediately returns
  // error: "The 'navigation' object hasn't been initialized yet."
  // Since there is no listener when the navigation object is initialized,
  // keep trying (by interval) until the redirect clicks.
  // {@link https://reactnavigation.org/docs/navigating-without-navigation-prop/#handling-initialization}
  const redirectInterval = setInterval(() => {
    if (navigationRef?.current?.isReady()) {
      navigationRef?.current?.navigate(name, params)
      clearInterval(redirectInterval)
    }
  }, 1000)
}
