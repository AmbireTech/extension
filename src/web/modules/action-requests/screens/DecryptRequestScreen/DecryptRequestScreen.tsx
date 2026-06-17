import React from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import ExpandableCard from '@common/components/ExpandableCard'
import RequestingDappInfo from '@common/components/RequestingDappInfo'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import ActionFooter from '@common/modules/action-requests/components/ActionFooter'
import ActionHeader from '@common/modules/action-requests/components/ActionHeader'
import useDecryptRequest from '@common/modules/action-requests/hooks/useDecryptRequest'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import SmallNotificationWindowWrapper from '@web/components/SmallNotificationWindowWrapper'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'

const DecryptRequestScreen = () => {
  const { theme } = useTheme()
  const {
    t,
    name,
    icon,
    encryptedMessage,
    decryptedMessage,
    errorNode,
    actionFooterResolveNode,
    isDisabled,
    handleDecryptForPreview,
    handleDecrypt,
    handleDeny
  } = useDecryptRequest()

  return (
    <SmallNotificationWindowWrapper>
      <TabLayoutContainer
        width="full"
        header={<ActionHeader />}
        renderDirectChildren={() => (
          <ActionFooter
            onReject={handleDeny}
            onResolve={handleDecrypt}
            resolveButtonText={t('Decrypt')}
            resolveDisabled={isDisabled}
            resolveButtonTestID="button-decrypt"
            resolveNode={actionFooterResolveNode}
          />
        )}
      >
        <TabLayoutWrapperMainContent>
          <RequestingDappInfo
            name={name}
            icon={icon}
            intentText={t('wants you to decrypt a message')}
          />

          <View style={spacings.mtLg}>
            {errorNode || (
              <ExpandableCard
                enableToggleExpand={false}
                isInitiallyExpanded={true}
                hasArrow={false}
                content={
                  <View style={flexbox.flex1}>
                    {decryptedMessage ? (
                      <>
                        <Text
                          weight="semiBold"
                          style={[{ lineHeight: 12 }, spacings.mtTy, spacings.mbLg]}
                        >
                          {t('Decrypted message')}
                        </Text>
                        <Text selectable>{decryptedMessage}</Text>
                      </>
                    ) : (
                      <>
                        <View
                          style={[
                            flexbox.directionRow,
                            flexbox.justifySpaceBetween,
                            flexbox.alignCenter,
                            spacings.mb
                          ]}
                        >
                          <Text weight="semiBold" appearance="infoText" style={{ lineHeight: 12 }}>
                            {t('Encrypted message')}
                          </Text>
                          <Button
                            text={t('Preview decrypted message')}
                            onPress={handleDecryptForPreview}
                            type="outline"
                            hasBottomSpacing={false}
                            accentColor={theme.infoDecorative}
                            disabled={isDisabled}
                            size="small"
                          />
                        </View>

                        <Text appearance="infoText" selectable>
                          {encryptedMessage}
                        </Text>
                      </>
                    )}
                  </View>
                }
                style={{
                  backgroundColor: theme.secondaryBackground
                }}
              />
            )}
          </View>
        </TabLayoutWrapperMainContent>
      </TabLayoutContainer>
    </SmallNotificationWindowWrapper>
  )
}

export default React.memo(DecryptRequestScreen)
