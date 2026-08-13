export const storage: {
  get: (key: string, defaultValue?: any) => Promise<any>
  set: (key: string, value: any) => Promise<null>
  remove: (key: string) => Promise<null>
}
export const syncStorage: {
  get: (key: string, defaultValue?: any) => any
  set: (key: string, value: any) => void
  remove: (key: string) => void
}
export const syncSessionStorage: {
  get: (key: string, defaultValue?: any) => any
  set: (key: string, value: any) => void
  remove: (key: string) => void
}
export const secureStorage: {
  get: (key: string, prompt?: string) => Promise<string | null>
  set: (key: string, value: string) => Promise<void>
  remove: (key: string) => Promise<void>
}
