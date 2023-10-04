import { DappManifestData } from 'ambire-common/src/hooks/useDapps'
import usePrevious from 'ambire-common/src/hooks/usePrevious'
import React, { useEffect } from 'react'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import colors from '@common/styles/colors'
import GetEncryptionPublicKeyRequest from '@mobile/modules/web3/components/GetEncryptionPublicKeyRequest'
import PermissionRequest from '@mobile/modules/web3/components/PermissionRequest'
import SwitchNetworkRequest from '@mobile/modules/web3/components/SwitchNetworkRequest'
import WatchTokenRequest from '@mobile/modules/web3/components/WatchTokenRequest'
import { Web3ContextData } from '@mobile/modules/web3/contexts/web3Context/types'

type Props = {
  approval: Web3ContextData['approval']
  tabSessionData: any
  selectedDapp: DappManifestData | null
  resolveApproval: Web3ContextData['resolveApproval']
  rejectApproval: Web3ContextData['rejectApproval']
  checkHasPermission: Web3ContextData['checkHasPermission']
  grantPermission: () => void
  sheetRefPermission: React.RefObject<any>
  closeBottomSheetPermission: (dest?: 'default' | 'alwaysOpen' | undefined) => void
}

const ApprovalBottomSheets = ({
  approval,
  tabSessionData,
  selectedDapp,
  resolveApproval,
  rejectApproval,
  checkHasPermission,
  grantPermission,
  sheetRefPermission,
  closeBottomSheetPermission
}: Props) => {
  const prevApproval: any = usePrevious(approval)
  const { goBack } = useNavigation()

  const {
    ref: sheetRefSwitchNetwork,
    open: openBottomSheetSwitchNetwork,
    close: closeBottomSheetSwitchNetwork
  } = useModalize()

  const {
    ref: sheetRefWatchToken,
    open: openBottomSheetWatchToken,
    close: closeBottomSheetWatchToken
  } = useModalize()

  const {
    ref: sheetRefGetEncryptionPublicKey,
    open: openBottomSheetGetEncryptionPublicKey,
    close: closeBottomSheetGetEncryptionPublicKey
  } = useModalize()

  useEffect(() => {
    if (
      prevApproval?.data?.approvalComponent !== 'SwitchNetwork' &&
      approval?.data?.approvalComponent === 'SwitchNetwork'
    ) {
      openBottomSheetSwitchNetwork()
    }
    if (
      prevApproval?.data?.approvalComponent !== 'WalletWatchAsset' &&
      approval?.data?.approvalComponent === 'WalletWatchAsset'
    ) {
      openBottomSheetWatchToken()
    }
    if (
      prevApproval?.data?.approvalComponent !== 'GetEncryptionPublicKey' &&
      approval?.data?.approvalComponent === 'GetEncryptionPublicKey'
    ) {
      openBottomSheetGetEncryptionPublicKey()
    }
  }, [
    approval,
    prevApproval,
    openBottomSheetSwitchNetwork,
    openBottomSheetWatchToken,
    openBottomSheetGetEncryptionPublicKey
  ])
  const { t } = useTranslation()

  return (
    <>
      <BottomSheet
        id="allow-dapp-to-connect"
        sheetRef={sheetRefPermission}
        onClosed={() => {
          setTimeout(() => {
            if (!!selectedDapp && !checkHasPermission(selectedDapp.url)) {
              goBack()
            }
          }, 10)
        }}
        closeBottomSheet={closeBottomSheetPermission}
      >
        <PermissionRequest
          isInBottomSheet
          selectedDapp={selectedDapp}
          closeBottomSheet={closeBottomSheetPermission}
          grantPermission={grantPermission}
        />
      </BottomSheet>
      <BottomSheet
        id="switch-network-approval"
        sheetRef={sheetRefSwitchNetwork}
        closeBottomSheet={closeBottomSheetSwitchNetwork}
        style={{ backgroundColor: colors.martinique }}
      >
        <SwitchNetworkRequest
          isInBottomSheet
          approval={approval}
          selectedDapp={selectedDapp}
          tabSessionData={tabSessionData}
          resolveApproval={resolveApproval}
          rejectApproval={rejectApproval}
          closeBottomSheet={closeBottomSheetSwitchNetwork}
        />
      </BottomSheet>
      <BottomSheet
        id="watch-token-approval"
        sheetRef={sheetRefWatchToken}
        closeBottomSheet={closeBottomSheetWatchToken}
        style={{ backgroundColor: colors.martinique }}
      >
        <WatchTokenRequest
          isInBottomSheet
          approval={approval}
          selectedDapp={selectedDapp}
          tabSessionData={tabSessionData}
          resolveApproval={resolveApproval}
          rejectApproval={rejectApproval}
          closeBottomSheet={closeBottomSheetWatchToken}
        />
      </BottomSheet>
      <BottomSheet
        id="get-encryption-public-key-approval"
        sheetRef={sheetRefGetEncryptionPublicKey}
        closeBottomSheet={closeBottomSheetGetEncryptionPublicKey}
        style={{ backgroundColor: colors.martinique }}
        cancelText={t('Okay')}
      >
        <GetEncryptionPublicKeyRequest
          isInBottomSheet
          approval={approval}
          selectedDapp={selectedDapp}
          tabSessionData={tabSessionData}
          rejectApproval={rejectApproval}
          closeBottomSheet={closeBottomSheetGetEncryptionPublicKey}
        />
      </BottomSheet>
    </>
  )
}

export default React.memo(ApprovalBottomSheets)
