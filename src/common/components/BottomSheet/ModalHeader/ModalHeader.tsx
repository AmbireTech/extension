import React, { FC } from 'react'
import { View, ViewStyle } from 'react-native'

import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import Header from '@common/modules/header/components/Header'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

const { isSidePanel } = getUiType()

interface Props {
  handleClose?: () => void
  title?: React.ReactNode
  titlePosition?: 'left' | 'center'
  style?: ViewStyle
  hasAmbireLogo?: boolean
  forceBackButtonOnMobile?: boolean
  children?: React.ReactNode
  headerTestID?: string
}

const BACK_BUTTON_BALANCE_WIDTH = 40

const ModalHeader: FC<Props> = ({
  handleClose,
  title,
  titlePosition = 'center',
  style,
  children,
  forceBackButtonOnMobile,
  headerTestID
}) => {
  const withSideContainers = !!handleClose || !!children
  const showBackButton = ((handleClose && !isMobile) || forceBackButtonOnMobile) && !!handleClose
  const shouldBalanceCenteredTitle = titlePosition === 'center' && showBackButton && !children

  const wrapperStyle = {
    ...(isMobile ? spacings.mb : spacings.mbLg),
    ...style,
    minHeight: 28
  }

  if (isSidePanel) {
    return (
      <Header.Wrapper
        containerStyle={{ ...spacings.ptTy, ...spacings.pb0, ...spacings.ph0, ...spacings.mb0 }}
        style={wrapperStyle}
      >
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            { width: '100%', minHeight: 28, columnGap: SPACING_TY }
          ]}
        >
          {showBackButton ? (
            <View style={{ flexShrink: 0 }}>
              <Header.BackButton onGoBackPress={handleClose} forceBack displayIn="always" />
            </View>
          ) : null}

          {!!title && (
            <View
              style={{
                flex: 1,
                minWidth: 0,
                alignItems: titlePosition === 'center' ? 'center' : 'flex-start'
              }}
            >
              <Text
                testID={headerTestID}
                fontSize={isMobile ? 18 : 20}
                weight="medium"
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{
                  width: '100%',
                  textAlign: titlePosition === 'center' ? 'center' : 'left'
                }}
              >
                {title}
              </Text>
            </View>
          )}

          {children ? (
            <View style={{ flexShrink: 0, maxWidth: '55%' }}>{children}</View>
          ) : shouldBalanceCenteredTitle ? (
            <View style={{ width: BACK_BUTTON_BALANCE_WIDTH, flexShrink: 0 }} />
          ) : null}
        </View>
      </Header.Wrapper>
    )
  }

  return (
    <Header.Wrapper
      containerStyle={{ ...spacings.ptTy, ...spacings.pb0, ...spacings.ph0, ...spacings.mb0 }}
      style={wrapperStyle}
    >
      {withSideContainers && (
        <Header.Container side="left">
          {showBackButton && (
            <Header.BackButton onGoBackPress={handleClose} forceBack displayIn="always" />
          )}
        </Header.Container>
      )}
      {/* We are making the title absolute to be able to fit different sized elements on the right
      without changing the flexbox layout to make it fit every possible combination */}
      <View
        style={{
          position: 'absolute',
          width: '100%',
          left: 0,
          height: '100%',
          justifyContent: 'center',
          alignItems: titlePosition === 'left' ? 'flex-start' : 'center',
          pointerEvents: 'none'
        }}
      >
        <Header.Title testID={headerTestID}>{title}</Header.Title>
      </View>
      {withSideContainers && <Header.Container side="right">{children}</Header.Container>}
    </Header.Wrapper>
  )
}

export default React.memo(ModalHeader)
