import permissionService from '@web/background/services/permission'

export type WalletControllerType = Object.Merge<
  {
    [key in keyof WalletControllerClass]: WalletControllerClass[key] extends (
      ...args: infer ARGS
    ) => infer RET
      ? <T extends IExtractFromPromise<RET> = IExtractFromPromise<RET>>(
          ...args: ARGS
        ) => Promise<IExtractFromPromise<T>>
      : WalletControllerClass[key]
  },
  Record<string, <T = any>(...params: any) => Promise<T>>
>

export class WalletController {
  isUnlocked = () => true

  getConnectedSite = permissionService.getConnectedSite
}

export default new WalletController()
