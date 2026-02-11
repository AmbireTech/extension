import React, { FC } from 'react'
import { ViewStyle } from 'react-native'

import Header from '@common/modules/header/components/Header'
import spacings from '@common/styles/spacings'

interface Props {
  handleClose?: () => void
  withBackButton?: boolean
  title?: React.ReactNode
  style?: ViewStyle
  hasAmbireLogo?: boolean
  children?: React.ReactNode
}

const ModalHeader: FC<Props> = ({ handleClose, withBackButton = true, title, style, children }) => {
  const withSideContainers = withBackButton || !!children

  return (
    <Header.Wrapper
      containerStyle={{ ...spacings.ptTy, ...spacings.pb0, ...spacings.ph0 }}
      style={{ ...spacings.mbLg, ...style }}
    >
      {withSideContainers && (
        <Header.Container side="left">
          {withBackButton && <Header.BackButton onGoBackPress={handleClose} forceBack />}
        </Header.Container>
      )}
      <Header.Title>{title}</Header.Title>
      {withSideContainers && <Header.Container side="right">{children}</Header.Container>}
    </Header.Wrapper>
  )
}

export default React.memo(ModalHeader)
