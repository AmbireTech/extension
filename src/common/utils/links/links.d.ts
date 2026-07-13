export declare const openInTab: ({
  url,
  windowId,
  shouldCloseCurrentWindow
}: {
  url: string
  windowId?: number
  shouldCloseCurrentWindow?: boolean
}) => Promise<any>

export declare const openInternalPageInTab: ({
  route,
  params,
  searchParams,
  windowId,
  shouldCloseCurrentWindow
}: {
  route: string
  params?: any
  searchParams?: any
  windowId?: number
  shouldCloseCurrentWindow?: boolean
}) => Promise<void>
