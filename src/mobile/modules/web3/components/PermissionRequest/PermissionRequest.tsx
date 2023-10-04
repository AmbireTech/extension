import { DappManifestData } from 'ambire-common/src/hooks/useDapps'
import React, { useCallback, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import Button from '@common/components/Button'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Panel from '@common/components/Panel'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import Wrapper from '@common/components/Wrapper'
import { Trans, useTranslation } from '@common/config/localization'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'
import getHostname from '@common/utils/getHostname'
import DappIcon from '@mobile/modules/web3/components/DappIcon'

const PermissionRequest = ({
  isInBottomSheet,
  closeBottomSheet,
  grantPermission,
  selectedDapp
}: {
  isInBottomSheet?: boolean
  closeBottomSheet?: (dest?: 'default' | 'alwaysOpen' | undefined) => void
  grantPermission: () => void
  selectedDapp: DappManifestData | null
}) => {
  const { t } = useTranslation()
  const [isAuthorizing, setIsAuthorizing] = useState(false)

  const handleAuthorizeButtonPress = useCallback(() => {
    setIsAuthorizing(true)
    grantPermission()
    !!closeBottomSheet && closeBottomSheet()
  }, [grantPermission, closeBottomSheet])

  const GradientWrapper = isInBottomSheet ? React.Fragment : GradientBackgroundWrapper

  if (!selectedDapp) {
    return (
      <GradientWrapper>
        <View
          style={[StyleSheet.absoluteFill, flexboxStyles.alignCenter, flexboxStyles.justifyCenter]}
        >
          <Spinner />
        </View>
      </GradientWrapper>
    )
  }

  return (
    <GradientWrapper>
      <Wrapper
        hasBottomTabNav={false}
        contentContainerStyle={{
          paddingTop: 0
        }}
        style={isInBottomSheet && spacings.ph0}
      >
        <Panel type="filled">
          <View style={[spacings.pvSm, flexboxStyles.alignCenter]}>
            <DappIcon iconUrl={selectedDapp.iconUrl} />
          </View>

          <Title style={[textStyles.center, spacings.phSm, spacings.pbLg]}>
            {selectedDapp.name || 'webpage'}
          </Title>

          <View>
            <Trans>
              <Text style={[textStyles.center, spacings.phSm, spacings.mbLg]}>
                <Text fontSize={14} weight="regular">
                  {'The dApp '}
                </Text>
                <Text fontSize={14} weight="regular" color={colors.heliotrope}>
                  {getHostname(selectedDapp.url) || ''}
                </Text>
                <Text fontSize={14} weight="regular">
                  {' is requesting an authorization to communicate with Ambire Wallet'}
                </Text>
              </Text>
            </Trans>
          </View>

          <Button
            type="outline"
            onPress={handleAuthorizeButtonPress}
            disabled={isAuthorizing}
            text={isAuthorizing ? t('Authorizing...') : t('Authorize')}
          />
        </Panel>
      </Wrapper>
    </GradientWrapper>
  )
}

export default React.memo(PermissionRequest)
