export type ProviderRequest<TMethod = string> = {
  data: {
    method: TMethod
    id?: string
    params?: any
    $ctx?: any
  }
  session?: {
    name: string
    origin: string
    icon: string
  } | null
  origin?: string
  requestedApproval?: boolean
}
