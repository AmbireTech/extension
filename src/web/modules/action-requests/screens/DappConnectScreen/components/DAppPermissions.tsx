import React, { createContext, FC, useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorValue, View } from 'react-native'

import CloseIcon from '@common/assets/svg/CloseIcon'
import TransactionsIcon from '@common/assets/svg/TransactionsIcon'
import VisibilityIcon from '@common/assets/svg/VisibilityIcon'
import Text, { Props as TextProps } from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const dAppPermissionWrapperContext = createContext({
  responsiveSizeMultiplier: 1
})

const DAppPermissionWrapper = ({
  children,
  responsiveSizeMultiplier
}: {
  children: React.ReactNode
  responsiveSizeMultiplier: number
}) => {
  const contextValue = useMemo(() => ({ responsiveSizeMultiplier }), [responsiveSizeMultiplier])

  return (
    <dAppPermissionWrapperContext.Provider value={contextValue}>
      <View
        style={[
          flexbox.directionRow,
          {
            marginBottom: SPACING_SM * responsiveSizeMultiplier
          }
        ]}
      >
        {children}
      </View>
    </dAppPermissionWrapperContext.Provider>
  )
}

const DAppPermissionIcon = ({
  children,
  backgroundColor
}: {
  children: React.ReactNode
  backgroundColor: ColorValue | string
}) => {
  const { responsiveSizeMultiplier } = useContext(dAppPermissionWrapperContext)
  return (
    <View
      style={{
        backgroundColor,
        width: responsiveSizeMultiplier * 32,
        height: responsiveSizeMultiplier * 32,
        ...flexbox.center,
        ...spacings.mrTy,
        borderRadius: 25
      }}
    >
      {children}
    </View>
  )
}

const DAppPermissionText = ({ children, ...rest }: { children: React.ReactNode } & TextProps) => {
  const { responsiveSizeMultiplier } = useContext(dAppPermissionWrapperContext)

  return (
    <Text appearance="secondaryText" fontSize={responsiveSizeMultiplier * 14} {...rest}>
      {children}
    </Text>
  )
}

const DAppPermissions: FC<{
  responsiveSizeMultiplier: number
}> = ({ responsiveSizeMultiplier }) => {
  const { theme } = useTheme()
  const { t } = useTranslation()

  return (
    <View
      style={{
        marginBottom: SPACING_TY * responsiveSizeMultiplier
      }}
    >
      <Text fontSize={16} weight="medium" numberOfLines={1} style={spacings.mbSm}>
        {t('Connecting with this app will:')}
      </Text>
      <DAppPermissionWrapper responsiveSizeMultiplier={responsiveSizeMultiplier}>
        <DAppPermissionIcon backgroundColor={theme.info2Background}>
          <VisibilityIcon
            width={responsiveSizeMultiplier * 24}
            height={responsiveSizeMultiplier * 24}
            color={theme.info2Decorative}
          />
        </DAppPermissionIcon>
        <DAppPermissionText style={spacings.ptMi}>
          Allow the app to{' '}
          <DAppPermissionText weight="medium">{t('see your addresses')}</DAppPermissionText>
        </DAppPermissionText>
      </DAppPermissionWrapper>
      <DAppPermissionWrapper responsiveSizeMultiplier={responsiveSizeMultiplier}>
        <DAppPermissionIcon backgroundColor={theme.infoBackground}>
          <TransactionsIcon
            width={responsiveSizeMultiplier * 18}
            height={responsiveSizeMultiplier * 18}
            color={theme.infoDecorative}
          />
        </DAppPermissionIcon>
        <DAppPermissionText style={spacings.ptMi}>
          Allow the app to{' '}
          <DAppPermissionText weight="medium">{t('propose transactions')}</DAppPermissionText>
        </DAppPermissionText>
      </DAppPermissionWrapper>
      <DAppPermissionWrapper responsiveSizeMultiplier={responsiveSizeMultiplier}>
        <DAppPermissionIcon backgroundColor={theme.errorBackground}>
          <CloseIcon
            width={responsiveSizeMultiplier * 14}
            height={responsiveSizeMultiplier * 14}
            color={theme.errorDecorative}
          />
        </DAppPermissionIcon>
        <DAppPermissionText style={spacings.ptMi}>
          The app <DAppPermissionText weight="medium">{t('cannot move funds')}</DAppPermissionText>{' '}
          without your permission
        </DAppPermissionText>
      </DAppPermissionWrapper>
    </View>
  )
}

export default React.memo(DAppPermissions)
