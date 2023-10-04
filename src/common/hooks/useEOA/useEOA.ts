import accountPresets from 'ambire-common/src/constants/accountPresets'
import { generateAddress2 } from 'ethereumjs-util'
import { getAddress, hexZeroPad } from 'ethers/lib/utils'
import { useCallback } from 'react'
import { Platform } from 'react-native'

import CONFIG from '@common/config/env'
import useAccounts from '@common/hooks/useAccounts'
import useToast from '@common/hooks/useToast'
import { getProxyDeployBytecode } from '@common/modules/auth/services/IdentityProxyDeploy'
import { fetchPost } from '@common/services/fetch'
import useReferral from '@mobile/modules/referral/hooks/useReferral'

const relayerURL = CONFIG.RELAYER_URL

// EOA implementation = Externally Owned Account
// Logs in to an existing acc or creates a new one
export default function useEOA() {
  const { onAddAccount } = useAccounts()
  const { addToast } = useToast()
  const { getPendingReferral, removePendingReferral } = useReferral()

  const getAccountByAddr = useCallback(async (idAddr, signerAddr) => {
    // In principle, we need these values to be able to operate in relayerless mode,
    // so we just store them in all cases
    // Plus, in the future this call may be used to retrieve other things
    const { salt, identityFactoryAddr, baseIdentityAddr, bytecode } = await fetch(
      `${relayerURL}/identity/${idAddr}`
    ).then((r) => r.json())
    if (!(salt && identityFactoryAddr && baseIdentityAddr && bytecode))
      throw new Error(`Incomplete data from relayer for ${idAddr}`)
    return {
      id: idAddr,
      salt,
      identityFactoryAddr,
      baseIdentityAddr,
      bytecode,
      signer: { address: signerAddr }
    }
  }, [])

  const getOwnedByEOAs = useCallback(
    async (eoas) => {
      const allUniqueOwned: any = {}

      await Promise.all(
        eoas.map(async (signerAddr: any) => {
          const resp = await fetch(
            `${relayerURL}/identity/any/by-owner/${signerAddr}?includeFormerlyOwned=true`
          )
          const privEntries = Object.entries(await resp.json())
          // discard the privileges value, we do not need it as we wanna add all accounts EVER owned by this eoa
          // eslint-disable-next-line no-return-assign
          privEntries.forEach(([id]) => (allUniqueOwned[id] = getAddress(signerAddr)))
        })
      )

      return Promise.all(
        Object.entries(allUniqueOwned).map(([id, signer]) => getAccountByAddr(id, signer))
      )
    },
    [getAccountByAddr]
  )

  // Add or create accounts from Trezor/Ledger/Metamask/etc.
  const createFromEOA = useCallback(async (addr, signerType) => {
    const privileges = [[getAddress(addr), hexZeroPad('0x01', 32)]]
    const { salt, baseIdentityAddr, identityFactoryAddr } = accountPresets
    const bytecode = getProxyDeployBytecode(baseIdentityAddr, privileges, { privSlot: 0 })
    const identityAddr = getAddress(
      `0x${generateAddress2(
        // Converting to buffer is required in ethereumjs-util version: 7.1.3
        Buffer.from(identityFactoryAddr.slice(2), 'hex'),
        Buffer.from(salt.slice(2), 'hex'),
        Buffer.from(bytecode.slice(2), 'hex')
      ).toString('hex')}`
    )

    if (relayerURL) {
      const referral = getPendingReferral()

      const createResp = await fetchPost(`${relayerURL}/identity/${identityAddr}`, {
        salt,
        identityFactoryAddr,
        baseIdentityAddr,
        privileges,
        signerType,
        registeredFrom: Platform.OS,
        ...(!!referral && { referralAddr: referral.hexAddress })
      })

      if (
        !createResp.success &&
        !(createResp.message && createResp.message.includes('already exists'))
      )
        throw createResp

      removePendingReferral()
    }

    return {
      id: identityAddr,
      salt,
      identityFactoryAddr,
      baseIdentityAddr,
      bytecode,
      signer: { address: getAddress(addr) }
    }
  }, [])

  const onEOASelected = useCallback(
    async (addr, signerExtra) => {
      // @ts-ignore
      const addAccount = (acc, opts) => onAddAccount({ ...acc, signerExtra }, opts)
      // when there is no relayer, we can only add the 'default' account created from that EOA
      // @TODO in the future, it would be nice to do getLogs from the provider here to find out which other addrs we control
      //   ... maybe we can isolate the code for that in lib/relayerless or something like that to not clutter this code
      if (!relayerURL)
        return addAccount(await createFromEOA(addr, signerExtra.type), { select: true })
      // otherwise check which accs we already own and add them
      const owned = await getOwnedByEOAs([addr])
      if (!owned.length) {
        addAccount(await createFromEOA(addr, signerExtra.type), { select: true, isNew: true })
      } else {
        addToast(`Found ${owned.length} existing accounts with signer ${addr}`, { timeout: 15000 })
        owned.forEach((acc, i) => addAccount(acc, { select: i === 0 }))
      }
    },
    [addToast, createFromEOA, getOwnedByEOAs, onAddAccount]
  )

  return {
    getAccountByAddr,
    getOwnedByEOAs,
    createFromEOA,
    onEOASelected
  }
}
