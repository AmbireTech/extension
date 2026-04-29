import React from 'react'
import { View } from 'react-native'

import Alert from '@common/components/Alert'
import RequestingDappInfo from '@common/components/RequestingDappInfo'
import ActionFooter from '@common/modules/action-requests/components/ActionFooter'
import ActionHeader from '@common/modules/action-requests/components/ActionHeader'
import useGetEncryptionPublicKeyRequest from '@common/modules/action-requests/hooks/useGetEncryptionPublicKeyRequest'
import spacings from '@common/styles/spacings'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

const GetEncryptionPublicKeyRequestScreen = () => {
  const {
    t,
    name,
    icon,
    errorNode,
    actionFooterResolveNode,
    isDisabled,
    handleAccept,
    handleDeny
  } = useGetEncryptionPublicKeyRequest()

  return (
    <MobileLayoutContainer
      header={<ActionHeader />}
      renderDirectChildren={() => (
        <ActionFooter
          onReject={handleDeny}
          onResolve={handleAccept}
          resolveButtonText={t('Provide')}
          resolveDisabled={isDisabled}
          resolveButtonTestID="button-provide"
          resolveNode={actionFooterResolveNode}
        />
      )}
    >
      <MobileLayoutWrapperMainContent>
        <RequestingDappInfo
          name={name}
          icon={icon}
          intentText={t('wants to get your public encryption key')}
        />

        <View style={spacings.mtLg}>
          {errorNode || (
            <Alert
              title={t('This app will be able to compose encrypted messages to you.')}
              type="info"
            />
          )}
        </View>
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(GetEncryptionPublicKeyRequestScreen)
