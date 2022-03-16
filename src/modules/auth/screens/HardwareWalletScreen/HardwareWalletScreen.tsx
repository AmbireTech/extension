import { generateAddress2 } from 'ethereumjs-util'
import { getAddress, hexZeroPad } from 'ethers/lib/utils'
/* eslint-disable no-await-in-loop */
import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, PermissionsAndroid, Platform, RefreshControl, View } from 'react-native'
import { Observable } from 'rxjs'

import CONFIG from '@config/env'
import { useTranslation } from '@config/localization'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import DevicesList from '@modules/auth/components/DeviceList'
import { getProxyDeployBytecode } from '@modules/auth/services/IdentityProxyDeploy'
import Text from '@modules/common/components/Text'
import Title from '@modules/common/components/Title'
import Wrapper from '@modules/common/components/Wrapper'
import accountPresets from '@modules/common/constants/accountPresets'
import useAccounts from '@modules/common/hooks/useAccounts'
import useToast from '@modules/common/hooks/useToast'
import { fetchPost } from '@modules/common/services/fetch'
import { ledgerDeviceGetAddresses } from '@modules/common/services/ledger/ledger'
import colors from '@modules/common/styles/colors'
import spacings from '@modules/common/styles/spacings'
import flexboxStyles from '@modules/common/styles/utils/flexbox'
import textStyles from '@modules/common/styles/utils/text'

const deviceAddition = (device: any) => (devices: any) =>
  devices.some((i: any) => i.id === device.id) ? devices : devices.concat(device)

const HardwareWalletScreen = () => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const [devices, setDevices] = useState<any>([])
  const [refreshing, setRefreshing] = useState<any>(false)
  const { onAddAccount } = useAccounts()
  // TODO: Multiple signers support is not implemented yet.
  // @ledgerhq/hw-app-eth supports retrieving only a single address
  // once multi-address fetching is supported,
  // a bottom sheet with the address list should be implemented
  const [signersToChoose, setChooseSigners] = useState<any>(null)

  let sub: any

  const startScan = async () => {
    setRefreshing(true)
    sub = new Observable(TransportBLE.listen).subscribe({
      complete: () => {
        setRefreshing(false)
      },
      next: (e: any) => {
        if (e.type === 'add') {
          setDevices(deviceAddition(e.descriptor))
        }
      },
      error: () => {
        setRefreshing(false)
      }
    })

    setTimeout(() => {
      sub.complete()
    }, 40000)
  }

  const reload = async () => {
    if (sub) sub.unsubscribe()
    setRefreshing(false)
    startScan()
  }

  useEffect(() => {
    ;(async () => {
      // NB: this is the bare minimal. We recommend to implement a screen to explain to user.
      if (Platform.OS === 'android') {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION)
      }

      let previousAvailable = false
      new Observable(TransportBLE.observeState).subscribe((e: any) => {
        if (e.available !== previousAvailable) {
          previousAvailable = e.available
          if (e.available) {
            reload()
          }
        }
      })

      startScan()
    })()

    return () => {
      if (sub) sub.unsubscribe()
    }
  }, [])

  const getAccountByAddr = useCallback(
    async (idAddr, signerAddr) => {
      // In principle, we need these values to be able to operate in relayerless mode,
      // so we just store them in all cases
      // Plus, in the future this call may be used to retrieve other things
      const { salt, identityFactoryAddr, baseIdentityAddr, bytecode } = await fetch(
        `${CONFIG.RELAYER_URL}/identity/${idAddr}`
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
    },
    [CONFIG.RELAYER_URL]
  )

  const getOwnedByEOAs = useCallback(
    async (eoas) => {
      const allUniqueOwned: any = {}

      await Promise.all(
        eoas.map(async (signerAddr: any) => {
          const resp = await fetch(
            `${CONFIG.RELAYER_URL}/identity/any/by-owner/${signerAddr}?includeFormerlyOwned=true`
          )
          const privEntries = Object.entries(await resp.json())
          // discard the privileges value, we do not need it as we wanna add all accounts EVER owned by this eoa
          // eslint-disable-next-line no-return-assign
          privEntries.forEach(([id, _]) => (allUniqueOwned[id] = getAddress(signerAddr)))
        })
      )

      return Promise.all(
        Object.entries(allUniqueOwned).map(([id, signer]) => getAccountByAddr(id, signer))
      )
    },
    [getAccountByAddr, CONFIG.RELAYER_URL]
  )

  // EOA implementations
  // Add or create accounts from Trezor/Ledger/Metamask/etc.
  const createFromEOA = useCallback(
    async (addr) => {
      const privileges = [[getAddress(addr), hexZeroPad('0x01', 32)]]
      const { salt, baseIdentityAddr, identityFactoryAddr } = accountPresets
      const bytecode = getProxyDeployBytecode(baseIdentityAddr, privileges, { privSlot: 0 })
      const identityAddr = getAddress(
        `0x${generateAddress2(
          // Converting to buffer is required in ethereumjs-util version: 7.1.3
          // Version 6 allows Buffer or string types but installed in RN proj brakes with: Can't find variable: Buffer
          Buffer.from(identityFactoryAddr.slice(2), 'hex'),
          Buffer.from(salt.slice(2), 'hex'),
          Buffer.from(bytecode.slice(2), 'hex')
        ).toString('hex')}`
      )

      if (CONFIG.RELAYER_URL) {
        const createResp = await fetchPost(`${CONFIG.RELAYER_URL}/identity/${identityAddr}`, {
          salt,
          identityFactoryAddr,
          baseIdentityAddr,
          privileges
        })
        if (
          !createResp.success &&
          !(createResp.message && createResp.message.includes('already exists'))
        )
          throw createResp
      }

      return {
        id: identityAddr,
        salt,
        identityFactoryAddr,
        baseIdentityAddr,
        bytecode,
        signer: { address: getAddress(addr) }
      }
    },
    [CONFIG.RELAYER_URL]
  )

  const onEOASelected = useCallback(
    async (addr, signerExtra) => {
      const addAccount = (acc: any, opts: any) => onAddAccount({ ...acc, signerExtra }, opts)
      // when there is no relayer, we can only add the 'default' account created from that EOA
      // @TODO in the future, it would be nice to do getLogs from the provider here to find out which other addrs we control
      //   ... maybe we can isolate the code for that in lib/relayerless or something like that to not clutter this code
      if (!CONFIG.RELAYER_URL) return addAccount(await createFromEOA(addr), { select: true })
      // otherwise check which accs we already own and add them
      const owned = await getOwnedByEOAs([addr])
      if (!owned.length) {
        addAccount(await createFromEOA(addr), { select: true, isNew: true })
      } else {
        addToast(`Found ${owned.length} existing accounts with signer ${addr}`, { timeout: 15000 })
        owned.forEach((acc: any, i: any) => addAccount(acc, { select: i === 0 }))
      }
    },
    [addToast, createFromEOA, getOwnedByEOAs, onAddAccount, CONFIG.RELAYER_URL]
  )

  const onSelectDevice = async (deviceId: any) => {
    let error: any = null

    try {
      const addrData = await ledgerDeviceGetAddresses(deviceId)
      if (!addrData.error) {
        const signerExtra = { type: 'ledger', transportProtocol: 'webHID' }
        if (addrData.addresses.length === 1) {
          onEOASelected(addrData.addresses[0], signerExtra)
        } else {
          setChooseSigners({ addresses: addrData.addresses, signerName: 'Ledger', signerExtra })
        }
      } else {
        error = addrData.error
      }
    } catch (e: any) {
      if (e.statusCode && e.id === 'InvalidChannel') {
        error = 'Invalid channel'
      } else if (e.statusCode && e.statusCode === 25873) {
        error = 'Please make sure your ledger is connected and the ethereum app is open'
      } else {
        error = e.message
      }
    }

    if (error) {
      addToast(`Ledger error: ${error.message || error}`, {
        error: true
      })
    }
  }

  return (
    <Wrapper
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={reload}
          tintColor={colors.primaryIconColor}
          progressBackgroundColor={colors.primaryIconColor}
          enabled={!refreshing}
        />
      }
    >
      {!!refreshing && (
        <View style={[flexboxStyles.alignCenter, spacings.mb]}>
          <Text style={[textStyles.bold, spacings.mbMi]}>{t('Looking for devices')}</Text>
          <Text style={textStyles.center} color={colors.secondaryTextColor} fontSize={14}>
            {t('Please make sure your Ledger Nano X is unlocked and Bluetooth is enabled.')}
          </Text>
        </View>
      )}
      <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter, spacings.mbSm]}>
        <Title hasBottomSpacing={false} style={flexboxStyles.flex1}>
          Available devices
        </Title>
        {refreshing && <ActivityIndicator />}
      </View>
      <DevicesList devices={devices} refreshing={refreshing} onSelectDevice={onSelectDevice} />
    </Wrapper>
  )
}

export default HardwareWalletScreen
