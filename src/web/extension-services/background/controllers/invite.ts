import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { relayerCall } from '@ambire-common/libs/relayerCall/relayerCall'
import { storage } from '@web/extension-services/background/webapi/storage'

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum INVITE_STATUS {
  UNVERIFIED = 'UNVERIFIED',
  VERIFIED = 'VERIFIED'
}

type Invite = {
  status: INVITE_STATUS
  verifiedAt: null | number // timestamp
  verifiedCode: null | string
}

/**
 * As of v4.20.0, an invite verification flow is introduced as a first step upon
 * extension installation. This flow requires users to provide a valid invite
 * code before they can use the Ambire extension. This controller manages the
 * verification of these invite codes and persisting the current invite status.
 */
export class InviteController extends EventEmitter {
  #callRelayer: Function

  inviteStatus: Invite['status'] = INVITE_STATUS.UNVERIFIED

  #initialLoadPromise: Promise<void>

  constructor({ relayerUrl, fetch }: { relayerUrl: string; fetch: Function }) {
    super()

    this.#callRelayer = relayerCall.bind({ url: relayerUrl, fetch })
    this.#initialLoadPromise = this.#load()
  }

  async #load() {
    const invite = await storage.get('invite', {
      status: INVITE_STATUS.UNVERIFIED,
      verifiedAt: null,
      verifiedCode: null
    })

    this.inviteStatus = invite.status
    this.emitUpdate()
  }

  /**
   * Verifies an invite code and if verified successfully, persists the invite
   * status (and some meta information) in the storage.
   */
  async verify(code: string) {
    await this.#initialLoadPromise

    try {
      const res = await this.#callRelayer(`/promotions/extension-key/${code}`, 'GET')

      if (!res.success) throw new Error(res.message || "Couldn't verify the invite code")

      this.inviteStatus = INVITE_STATUS.VERIFIED
      this.emitUpdate()

      const verifiedAt = Date.now()
      await storage.set('invite', {
        status: INVITE_STATUS.VERIFIED,
        verifiedAt,
        verifiedCode: code
      })
    } catch (error: any) {
      this.emitError(error)
    }
  }
}
