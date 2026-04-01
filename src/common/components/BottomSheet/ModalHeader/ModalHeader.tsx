import React, { FC } from 'react'
import { View, ViewStyle } from 'react-native'

import { isMobile } from '@common/config/env'
import Header from '@common/modules/header/components/Header'
import spacings from '@common/styles/spacings'

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

  return (
    <Header.Wrapper
      containerStyle={{ ...spacings.ptTy, ...spacings.pb0, ...spacings.ph0, ...spacings.mb0 }}
      style={{ ...(isMobile ? spacings.mb : spacings.mbLg), ...style, minHeight: 28 }}
    >
      {withSideContainers && (
        <Header.Container side="left">
          {((handleClose && !isMobile) || forceBackButtonOnMobile) && (
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
