import { getBigInt } from 'ethers'

import { NetworkDescriptor } from '@ambire-common/interfaces/networkDescriptor'
import { UserRequest } from '@ambire-common/interfaces/userRequest'
import { parse } from '@ambire-common/libs/richJson/richJson'
import { DappsController } from '@web/extension-services/background/controllers/dapps'

export class UserNotification {
  #dappsCtrl: DappsController

  constructor(dappsCtrl: DappsController) {
    this.#dappsCtrl = dappsCtrl
  }

  createSignMessageUserRequest({
    id,
    data,
    origin,
    selectedAccount,
    networks,
    onError,
    onSuccess
  }: {
    id: number
    data: any
    origin: string
    selectedAccount: string
    networks: NetworkDescriptor[]
    onError: (msg: string) => void
    onSuccess: (data: any, id: number) => void
  }) {
    const msg = data
    if (!msg) {
      onError('No msg request to sign')
      return
    }

    if (msg?.[1]?.toLowerCase() !== selectedAccount.toLowerCase()) {
      onSuccess('Invalid parameters: must use the current user address to sign', id)
      return
    }

    const network = networks.find(
      (n) => Number(n.chainId) === Number(this.#dappsCtrl.getDapp(origin)?.chainId)
    )

    if (!network) {
      onError('Unsupported network')
      return
    }

    const request: UserRequest = {
      id,
      action: {
        kind: 'message',
        message: msg[0]
      },
      networkId: network.id,
      accountAddr: selectedAccount,
      forceNonce: null
    }

    return request
  }

  createSignTypedDataUserRequest({
    id,
    data,
    origin,
    selectedAccount,
    networks,
    onError,
    onSuccess
  }: {
    id: number
    data: any
    origin: string
    selectedAccount: string
    networks: NetworkDescriptor[]
    onError: (msg: string) => void
    onSuccess: (data: any, id: number) => void
  }) {
    const msg = data
    if (!msg) {
      onError('No msg request to sign')
      return
    }
    if (msg?.[0]?.toLowerCase() !== selectedAccount.toLowerCase()) {
      // resolve with error to handle the error in the ProviderController
      onSuccess(
        {
          error: 'Invalid parameters: must use the current user address to sign'
        },
        id
      )
      return
    }

    const messageToSign = msg?.[1]
    if (!messageToSign) {
      onError('No msg request in received params')
      return
    }
    let typedData: any = {}
    try {
      typedData = parse(messageToSign)
    } catch (error) {
      onError('Invalid typedData format')
    }

    if (!typedData?.types || !typedData.domain || !typedData?.message) {
      onError('Invalid typedData v4 format')
    }

    const network = networks.find(
      (n) => Number(n.chainId) === Number(this.#dappsCtrl.getDapp(origin)?.chainId)
    )

    if (!network) {
      onError('Unsupported network')
      return
    }

    const request: UserRequest = {
      id,
      action: {
        kind: 'typedMessage',
        types: typedData.types,
        domain: typedData.domain,
        message: typedData.message,
        primaryType: typedData.primaryType
      },
      networkId: network.id,
      accountAddr: selectedAccount,
      forceNonce: null
    }

    return request
  }

  createAccountOpUserRequest({
    id,
    txn,
    network
  }: {
    id: number
    txn: any
    network: NetworkDescriptor
  }) {
    const request: UserRequest = {
      id,
      action: {
        kind: 'call',
        ...txn,
        value: txn.value ? getBigInt(txn.value) : 0n
      },
      networkId: network.id,
      accountAddr: txn.from,
      // TODO: ?
      forceNonce: null
    }

    return request
  }
}
