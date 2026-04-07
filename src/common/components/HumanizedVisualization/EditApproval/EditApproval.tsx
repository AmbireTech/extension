import { formatUnits } from 'ethers'
import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { HumanizerVisualization } from '@ambire-common/libs/humanizer/interfaces'
import { getTokenAmount } from '@ambire-common/libs/portfolio/helpers'
import EditIcon from '@common/assets/svg/EditIcon'
import BottomSheet from '@common/components/BottomSheet'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import MaxAmount from '@common/modules/swap-and-bridge/components/MaxAmount'
import flexbox from '@common/styles/utils/flexbox'

const EditApproval = ({ item }: { item: HumanizerVisualization }) => {
  const { t } = useTranslation()
  const [bindEditApprovals, editApprovalsStyle] = useHover({
    preset: 'opacityInverted'
  })
  const {
    ref: editApprovalsSheetRef,
    open: openEditApprovals,
    close: closeEditApprovals
  } = useModalize()
  const {
    state: { portfolio }
  } = useController('SelectedAccountController')

  const portfolioToken = useMemo(() => {
    return portfolio.tokens.find((t) => t.address.toLowerCase() === item.address?.toLowerCase())
  }, [portfolio.tokens, item])

  return (
    <>
      <AnimatedPressable
        style={[editApprovalsStyle, flexbox.directionRow, flexbox.alignCenter]}
        {...bindEditApprovals}
        onPress={() => openEditApprovals()}
      >
        <EditIcon />
        <Text>{t('Edit Approval')}</Text>
      </AnimatedPressable>
      <BottomSheet
        sheetRef={editApprovalsSheetRef}
        id={`edit-approvals-bottom-sheet-${item.id}`}
        type="bottom-sheet"
        closeBottomSheet={closeEditApprovals}
        scrollViewProps={isWeb ? { contentContainerStyle: { flex: 1 } } : undefined}
        containerInnerWrapperStyles={{ flex: 1 }}
      >
        <View>
          <Text>Just testing for now</Text>
          <Text>Address: {item.address}</Text>
          {portfolioToken && (
            <MaxAmount
              isLoading={false}
              maxAmount={Number(
                formatUnits(getTokenAmount(portfolioToken), portfolioToken.decimals)
              )}
              selectedTokenSymbol={portfolioToken.symbol}
              onMaxButtonPress={() => {
                console.log('max btn hit')
              }}
              simulationFailed={false}
            />
          )}
        </View>
      </BottomSheet>
    </>
  )
}

export default memo(EditApproval)
