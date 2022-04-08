import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { BackHandler, LayoutAnimation, View } from 'react-native'

import Panel from '@modules/common/components/Panel'

import { CARDS, CardsVisibilityContext } from '../cardsVisibilityContext'

type ExpandableCardData = {
  isExpanded: boolean
  expand: (cardName: CARDS) => void
  collapse: () => void
}

const ExpandableCardContext = createContext<ExpandableCardData>({
  isExpanded: false,
  expand: () => {},
  collapse: () => {}
})

const ExpandableCardProvider: React.FC<any> = ({ children, cardName: name }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  const { visibleCard, setVisibleCard } = useContext(CardsVisibilityContext)

  useEffect(() => {
    if (!isExpanded) {
      return
    }

    const backAction = () => {
      if (isExpanded) {
        LayoutAnimation.configureNext(LayoutAnimation.create(450, 'linear', 'opacity'))
        setIsExpanded(false)
        setVisibleCard(null)
        // Returning true prevents execution of the default native back handling
        return true
      }

      return false
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)

    return () => backHandler.remove()
  }, [isExpanded, setVisibleCard])

  const expand = (cardName: CARDS) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(450, 'linear', 'opacity'))
    setVisibleCard(cardName)
    setIsExpanded(true)
  }

  const collapse = () => {
    LayoutAnimation.configureNext(LayoutAnimation.create(450, 'linear', 'opacity'))
    setIsExpanded(false)
    setVisibleCard(null)
  }

  return (
    <ExpandableCardContext.Provider
      value={useMemo(
        () => ({
          isExpanded,
          expand,
          collapse
        }),
        [isExpanded]
      )}
    >
      {/*
        This view is here because of the display none prop.
        We don't want the card to loose its position in the cards list
      */}
      <View>
        <Panel
          type="filled"
          style={[
            !isExpanded && { minHeight: 120 },
            !!visibleCard && visibleCard !== name && { display: 'none' }
          ]}
        >
          {children}
        </Panel>
      </View>
    </ExpandableCardContext.Provider>
  )
}

export { ExpandableCardContext, ExpandableCardProvider }
