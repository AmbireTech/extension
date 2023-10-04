import { DappManifestData } from 'ambire-common/src/hooks/useDapps'
import React, { useEffect } from 'react'
import { View } from 'react-native'

import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Panel from '@common/components/Panel'
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
import { Web3ContextData } from '@mobile/modules/web3/contexts/web3Context/types'

type Props = {
  approval: Web3ContextData['approval']

  rejectApproval: Web3ContextData['rejectApproval']
  isInBottomSheet?: boolean
  selectedDapp: DappManifestData | null
  tabSessionData: any
  closeBottomSheet?: (dest?: 'default' | 'alwaysOpen' | undefined) => void
}

const GetEncryptionPublicKeyRequest = ({
  isInBottomSheet,
  closeBottomSheet,
  approval,
  selectedDapp,
  tabSessionData,
  rejectApproval
}: Props) => {
  const { t } = useTranslation()

  useEffect(() => {
    return () => {
      rejectApproval(t('User rejected the request.'))
      !!closeBottomSheet && closeBottomSheet()
    }
  }, [rejectApproval, closeBottomSheet, t])

  const GradientWrapper = isInBottomSheet ? React.Fragment : GradientBackgroundWrapper

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
            <DappIcon
              iconUrl={
                selectedDapp?.id.includes('search:')
                  ? tabSessionData?.params?.icon
                  : selectedDapp?.iconUrl || ''
              }
            />
          </View>

          <Title style={[textStyles.center, spacings.phSm, spacings.pbLg]}>
            {selectedDapp?.id.includes('search:')
              ? tabSessionData?.params?.name
              : selectedDapp?.name || approval?.data?.params?.session?.name}
          </Title>

          <View>
            <Trans>
              <Text style={[textStyles.center, spacings.phSm, spacings.mbLg]}>
                <Text fontSize={14} weight="regular">
                  {'The dApp '}
                </Text>
                <Text fontSize={14} weight="regular" color={colors.heliotrope}>
                  {getHostname(
                    selectedDapp?.id.includes('search:')
                      ? tabSessionData?.params?.origin || ''
                      : selectedDapp?.url || ''
                  ) ||
                    approval?.data?.params?.session?.name ||
                    'webpage'}
                </Text>
                <Text fontSize={14} weight="regular">
                  {
                    ' wants to get your public encryption key. This method is deprecated and Ambire does not support it.'
                  }
                </Text>
              </Text>
            </Trans>
          </View>
        </Panel>
      </Wrapper>
    </GradientWrapper>
  )
}

export default React.memo(GetEncryptionPublicKeyRequest)
