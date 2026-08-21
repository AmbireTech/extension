import React, { Fragment, ReactNode, Suspense } from 'react'
import { View, ViewStyle } from 'react-native'

// Suspending on a thenable that never resolves makes React keep the subtree that
// was already rendered mounted but hidden, and stop reconciling it altogether -
// state and native views survive, updates cost nothing. Same technique as
// react-freeze, which react-native-screens uses to freeze background screens.
const NEVER_RESOLVES = { then: () => {} }

const Freezer = ({ frozen, children }: { frozen: boolean; children: ReactNode }) => {
  if (frozen) throw NEVER_RESOLVES

  return <Fragment>{children}</Fragment>
}

interface Props {
  style: ViewStyle
  /** Pages that were never swiped to don't render at all, but keep their slot. */
  mounted: boolean
  frozen: boolean
  children: ReactNode
}

const CarouselPage = ({ style, mounted, frozen, children }: Props) => (
  <View style={style}>
    {!!mounted && (
      <Suspense fallback={null}>
        <Freezer frozen={frozen}>{children}</Freezer>
      </Suspense>
    )}
  </View>
)

export default CarouselPage
