import { NavigateOptions } from 'react-router-dom'
import { Subject } from 'rxjs'

import { ROUTES } from '@common/modules/router/constants/common'
import { NavigationProp } from '@react-navigation/native'

interface UseNavigationReturnTypeCommon {
  navigate: (to: ROUTES | number | '/', options?: NavigateOptions) => void
  goBack: NavigationProp<ReactNavigation.RootParamList>['goBack']
  setParams: NavigationProp<ReactNavigation.RootParamList>['setParams']
  setOptions: NavigationProp<ReactNavigation.RootParamList>['setOptions']
}

export type UseNavigationReturnType = Partial<
  Omit<NavigationProp<ReactNavigation.RootParamList>, 'navigate'>
> &
  UseNavigationReturnTypeCommon

export type TitleChangeEventStreamType = Subject<string> | null
