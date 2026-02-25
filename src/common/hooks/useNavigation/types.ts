import { Subject } from 'rxjs'

interface UseNavigationReturnTypeCommon {
  navigate: (to: string | number, options?: any) => void
  goBack: () => void
  searchParams: any
  setSearchParams: (params: any) => void
  setOptions: (options: { headerTitle?: string; [key: string]: any }) => void
  canGoBack: boolean
}

export type UseNavigationReturnType = UseNavigationReturnTypeCommon

export type TitleChangeEventStreamType = Subject<string> | null
