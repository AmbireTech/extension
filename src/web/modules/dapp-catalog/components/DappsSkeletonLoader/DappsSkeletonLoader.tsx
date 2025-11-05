import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import FailedToConnectIcon from '@common/assets/svg/FailedToConnectIcon'
import Button from '@common/components/Button'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useDappsControllerState from '@web/hooks/useDappsControllerState'

const DappsSkeletonLoader = () => {
  const { state } = useDappsControllerState()
  const { dispatch } = useBackgroundService()
  const { theme } = useTheme()
  const { t } = useTranslation()

  return (
    <View style={[flexbox.flex1, spacings.phSm, spacings.pvSm]}>
      {state.isFetchingAndUpdatingDapps ? (
        <>
          <SkeletonLoader width="100%" height={40} style={spacings.mbTy} />
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              flexbox.justifySpaceBetween,
              spacings.mb
            ]}
          >
            <SkeletonLoader width="27%" height={32} />
            <SkeletonLoader width="32%" height={32} />
            <SkeletonLoader width="15%" height={32} />
            <SkeletonLoader width="18%" height={32} />
          </View>
          <SkeletonLoader width="100%" height={75} style={spacings.mbTy} />
          <SkeletonLoader width="100%" height={75} style={spacings.mbTy} />
          <SkeletonLoader width="100%" height={75} style={spacings.mbTy} />
          <SkeletonLoader width="100%" height={75} style={spacings.mbTy} />
          <SkeletonLoader width="100%" height={75} style={spacings.mbTy} />
        </>
      ) : (
        <View style={[flexbox.flex1, flexbox.justifyCenter]}>
          <View
            style={[
              spacings.pv,
              spacings.ph,
              flexbox.alignCenter,
              { backgroundColor: theme.secondaryBackground, borderRadius: BORDER_RADIUS_PRIMARY }
            ]}
          >
            <FailedToConnectIcon style={spacings.mbLg} />
            <Text fontSize={16} weight="semiBold" style={text.center}>
              {t('Failed to fetch the app list.')}
            </Text>
            <Text fontSize={14} appearance="secondaryText" style={[text.center, spacings.mbLg]}>
              {t('Check your connection and try again.')}
            </Text>
            <Button
              text={t('Try again')}
              type="warning"
              onPress={() => {
                dispatch({ type: 'DAPPS_CONTROLLER_FETCH_AND_UPDATE_DAPPS' })
              }}
              size="small"
              style={{ height: 40 }}
              hasBottomSpacing={false}
            />
          </View>
        </View>
      )}
    </View>
  )
}

export default React.memo(DappsSkeletonLoader)
