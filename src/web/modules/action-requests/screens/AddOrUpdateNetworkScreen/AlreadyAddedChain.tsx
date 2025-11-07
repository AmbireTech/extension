import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Statuses } from '@ambire-common/interfaces/eventEmitter'
import { Network } from '@ambire-common/interfaces/network'
import SuccessAnimation from '@common/components/SuccessAnimation'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import HeaderAccountAndNetworkInfo from '@web/components/HeaderAccountAndNetworkInfo'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'

import ActionFooter from '../../components/ActionFooter'

type AlreadyAddedChainProps = {
  handleCloseOnAlreadyAdded: () => void
  statuses: Statuses<'addNetwork' | 'updateNetwork'> & Statuses<string>
  networkAlreadyAdded: Network
  successStateText: string
}

const AlreadyAddedChain = ({
  handleCloseOnAlreadyAdded,
  statuses,
  networkAlreadyAdded,
  successStateText
}: AlreadyAddedChainProps) => {
  const { theme, themeType } = useTheme()
  const { t } = useTranslation()

  return (
    <TabLayoutContainer
      width="full"
      header={
        <HeaderAccountAndNetworkInfo
          backgroundColor={
            themeType === THEME_TYPES.DARK
              ? (theme.tertiaryBackground as string)
              : (theme.primaryBackground as string)
          }
        />
      }
      footer={
        <ActionFooter
          onReject={undefined}
          onResolve={handleCloseOnAlreadyAdded}
          resolveButtonText={t('Close')}
          rejectButtonText={undefined}
          resolveDisabled={
            statuses.addNetwork === 'LOADING' || statuses.updateNetwork === 'LOADING'
          }
        />
      }
      backgroundColor={theme.quinaryBackground}
    >
      <TabLayoutWrapperMainContent style={spacings.mbLg} withScroll={false}>
        <View style={[flexbox.flex1, flexbox.alignCenter, spacings.mt2Xl]}>
          <View
            style={[
              common.borderRadiusPrimary,
              common.shadowTertiary,
              {
                width: '100%',
                maxWidth: 422,
                maxHeight: 343,
                ...flexbox.justifyCenter,
                backgroundColor: theme.primaryBackground
              }
            ]}
          >
            <SuccessAnimation>
              <Text fontSize={20} weight="medium" style={spacings.mb}>
                {networkAlreadyAdded.name} {t('Network')}
              </Text>
              <Text fontSize={15} appearance="secondaryText">
                {successStateText}
              </Text>
            </SuccessAnimation>
          </View>
        </View>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}
export default React.memo(AlreadyAddedChain)
