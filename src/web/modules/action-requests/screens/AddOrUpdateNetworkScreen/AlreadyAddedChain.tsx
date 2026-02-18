import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Statuses } from '@ambire-common/interfaces/eventEmitter'
import { Network } from '@ambire-common/interfaces/network'
import SuccessAnimation from '@common/components/SuccessAnimation'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'
import ActionFooter from '@web/modules/action-requests/components/ActionFooter'
import ActionHeader from '@web/modules/action-requests/components/ActionHeader'

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
  const { theme } = useTheme()
  const { t } = useTranslation()

  return (
    <TabLayoutContainer
      width="full"
      header={<ActionHeader />}
      renderDirectChildren={() => (
        <ActionFooter
          onReject={undefined}
          onResolve={handleCloseOnAlreadyAdded}
          resolveButtonText={t('Close')}
          rejectButtonText={undefined}
          resolveDisabled={
            statuses.addNetwork === 'LOADING' || statuses.updateNetwork === 'LOADING'
          }
        />
      )}
    >
      <TabLayoutWrapperMainContent style={spacings.mbLg} withScroll={false}>
        <View style={[flexbox.flex1, flexbox.alignCenter, spacings.mt2Xl]}>
          <View
            style={[
              common.borderRadiusPrimary,
              {
                width: '100%',
                ...spacings.phXl,
                maxWidth: 420,
                ...spacings.pv3Xl,
                ...flexbox.center,
                backgroundColor: theme.secondaryBackground
              }
            ]}
          >
            <SuccessAnimation style={spacings.mbLg} size={96} />
            <Text fontSize={20} weight="medium" style={spacings.mb}>
              {networkAlreadyAdded.name} {t('Network')}
            </Text>
            <Text fontSize={15} appearance="secondaryText">
              {successStateText}
            </Text>
          </View>
        </View>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}
export default React.memo(AlreadyAddedChain)
