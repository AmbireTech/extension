import { NetworkId, NetworkType } from 'ambire-common/src/constants/networks'
import { Token } from 'ambire-common/src/hooks/usePortfolio'
import {
  TokenWithIsHiddenFlag,
  UsePortfolioReturnType
} from 'ambire-common/src/hooks/usePortfolio/types'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { LayoutAnimation, TouchableOpacity, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import Segments from '@common/components/Segments'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import { useTranslation } from '@common/config/localization'
import { triggerLayoutAnimation } from '@common/services/layoutAnimation'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

import AddOrHideTokenForm from './AddOrHideTokenForm'
import { MODES } from './constants'
import ExtraTokensList from './ExtraTokensList'
import HideTokenList from './HideTokenList'
import styles from './styles'

const segments = [{ value: MODES.ADD_TOKEN }, { value: MODES.HIDE_TOKEN }]

interface Props {
  tokens: TokenWithIsHiddenFlag[]
  extraTokens: UsePortfolioReturnType['extraTokens']
  hiddenTokens: UsePortfolioReturnType['hiddenTokens']
  networkId?: NetworkId
  networkName?: NetworkType['name']
  onAddExtraToken: UsePortfolioReturnType['onAddExtraToken']
  onAddHiddenToken: UsePortfolioReturnType['onAddHiddenToken']
  onRemoveExtraToken: UsePortfolioReturnType['onRemoveExtraToken']
  onRemoveHiddenToken: UsePortfolioReturnType['onRemoveHiddenToken']
}

const AddOrHideToken = ({
  tokens,
  extraTokens,
  hiddenTokens,
  networkId,
  networkName,
  onAddExtraToken,
  onAddHiddenToken,
  onRemoveExtraToken,
  onRemoveHiddenToken
}: Props) => {
  const { t } = useTranslation()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const tokensWithHidden = useMemo(() => [...hiddenTokens, ...tokens], [hiddenTokens, tokens])
  const [tokenHideChanges, setTokenHideChanges] = useState<TokenWithIsHiddenFlag[]>([])
  const [sortedTokens, setSortedTokens] = useState<Token[]>(
    tokensWithHidden.sort((a, b) => b.balanceUSD - a.balanceUSD)
  )

  // Tokens and hidden tokens get updated asynchronously, so we need to update
  // the sorted tokens when they change. Track only the length changes, since
  // the tokens attributes that change themselves are not used in the component.
  useEffect(() => {
    setSortedTokens(tokensWithHidden.sort((a, b) => b.balanceUSD - a.balanceUSD))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokensWithHidden.length])

  const [formType, setFormType] = useState<MODES>(MODES.ADD_TOKEN)

  const handleOnSubmit = (token: Token, formMode: MODES) => {
    const cases: { [key in MODES]: () => void } = {
      [MODES.ADD_TOKEN]: () => {
        onAddExtraToken(token)
        closeBottomSheet()
      },
      [MODES.HIDE_TOKEN]: () => {
        onAddHiddenToken([token])
        closeBottomSheet()
      }
    }

    return cases[formMode]()
  }

  const toggleTokenHide = useCallback<(t: TokenWithIsHiddenFlag) => any>((token) => {
    const nextIsHiddenState = !token.isHidden

    setTokenHideChanges((prevChanges) => {
      const hasChange = prevChanges.find((c) => c.address === token.address)

      if (hasChange) {
        return prevChanges.filter((c) => c.address !== token.address)
      }

      return [...prevChanges, { ...token, isHidden: nextIsHiddenState }]
    })

    setSortedTokens((prevTokens) => {
      return prevTokens.map((t) => {
        if (t.address === token.address) {
          return { ...t, isHidden: nextIsHiddenState }
        }

        return t
      })
    })
  }, [])

  const handleUpdates = useCallback(() => {
    const hiddenTokensToAdd = tokenHideChanges.filter((token) => token.isHidden)
    const addressesToRemove = tokenHideChanges
      .filter((token) => !token.isHidden)
      .map((token) => token.address)

    if (hiddenTokensToAdd.length) onAddHiddenToken(hiddenTokensToAdd)
    if (addressesToRemove.length) onRemoveHiddenToken(addressesToRemove)

    // Reset states
    setSortedTokens(tokensWithHidden.sort((a, b) => b.balanceUSD - a.balanceUSD))
    setTokenHideChanges([])
  }, [onAddHiddenToken, onRemoveHiddenToken, tokenHideChanges, tokensWithHidden])

  return (
    <>
      <TouchableOpacity style={[styles.btnContainer, spacings.mbTy]} onPress={openBottomSheet}>
        <Text fontSize={14} style={{ lineHeight: 24 }}>
          {t('Add or Hide Token')}
        </Text>
      </TouchableOpacity>

      <BottomSheet
        id="add-token"
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        onClosed={handleUpdates}
        cancelText={t('Close')}
      >
        <Segments
          defaultValue={formType}
          segments={segments}
          onChange={(value: MODES) => {
            setFormType(value)
            triggerLayoutAnimation({
              // Animate only for iOS, because on Android it conflicts with
              // the bottom sheet backdrop animation.
              forceAnimate: false,
              config: LayoutAnimation.create(300, 'linear', 'opacity')
            })
          }}
          fontSize={14}
        />
        <View style={[flexboxStyles.flex1, flexboxStyles.justifyEnd, spacings.mtMd, spacings.mbTy]}>
          {formType === MODES.ADD_TOKEN && (
            <>
              <Title type="small" style={textStyles.center}>
                {t('Add Token')}
              </Title>
              <AddOrHideTokenForm
                mode={MODES.ADD_TOKEN}
                onSubmit={handleOnSubmit}
                tokens={tokens}
                networkId={networkId}
                networkName={networkName}
              />
              <ExtraTokensList tokens={extraTokens} onRemoveExtraToken={onRemoveExtraToken} />
            </>
          )}
          {formType === MODES.HIDE_TOKEN && (
            <>
              <Title type="small" style={textStyles.center}>
                {t('Hide Token')}
              </Title>
              <HideTokenList tokens={sortedTokens} toggleTokenHide={toggleTokenHide} />
            </>
          )}
        </View>
      </BottomSheet>
    </>
  )
}

export default AddOrHideToken
