import { DappManifestData } from 'ambire-common/src/hooks/useDapps'
import { nanoid } from 'nanoid'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Keyboard,
  TextInputProps,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native'

import CloseIconRound from '@common/assets/svg/CloseIconRound'
import SearchIcon from '@common/assets/svg/SearchIcon'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import { isWeb } from '@common/config/env'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import { ROUTES } from '@common/modules/router/constants/common'
import colors from '@common/styles/colors'
import flexbox from '@common/styles/utils/flexbox'
import BrowserNavigationToolbar from '@mobile/modules/web3/components/BrowserNavigationToolbar'
import DappsCatalogList from '@mobile/modules/web3/components/DappsCatalogList'
import useDapps from '@mobile/modules/web3/hooks/useDapps'
import useWeb3 from '@mobile/modules/web3/hooks/useWeb3'

const DappsCatalogScreen = () => {
  const { t } = useTranslation()
  const {
    search,
    // categories,
    // categoryFilter,
    filteredCatalog,
    searchDappItem,
    searchDappUrlOrHostnameItem,
    onSearchChange
    // onCategorySelect
  } = useDapps()
  const { setSelectedDapp } = useWeb3()
  const { navigate } = useNavigation()
  const { params } = useRoute()
  // Helper state to immediately open a dapp, when the user lands here with
  // incoming `params?.selectedDappId`. Needed in order to persist the
  // incoming `params`, because after the first render - they get cleared.
  const [pendingToRedirectDappId, setPendingToRedirectDappId] = useState(params?.selectedDappId)

  // Check if should immediately open (navigate to) a dapp
  useEffect(() => {
    const shouldTriggerRedirect = pendingToRedirectDappId && filteredCatalog.length > 0
    if (!shouldTriggerRedirect) return

    const item = filteredCatalog.find(({ id }) => id === pendingToRedirectDappId)
    if (!item) return

    setSelectedDapp(item)
    onSearchChange(item.name)
    navigate(`${ROUTES.web3Browser}-screen`)
    setPendingToRedirectDappId(null) // clears the flag, so this runs only once
  }, [filteredCatalog, navigate, onSearchChange, pendingToRedirectDappId, setSelectedDapp])

  // Dapp favorites are temporarily disabled since v3.11.0 */
  // const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()

  const addressInputProps = useMemo<Partial<TextInputProps>>(
    () => ({
      leftIcon: () => (
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 2 }}
          onPress={() => {
            if (search) {
              setSelectedDapp(searchDappUrlOrHostnameItem || searchDappItem)
              navigate(`${ROUTES.web3Browser}-screen`)
            }
          }}
        >
          <SearchIcon />
        </TouchableOpacity>
      ),
      button: search ? <CloseIconRound color={!search ? colors.titan_50 : colors.titan} /> : null,
      buttonProps: {
        onPress: () => onSearchChange(''),
        disabled: !search
      },
      returnKeyType: 'search',
      returnKeyLabel: 'search'
    }),
    [navigate, onSearchChange, search, searchDappItem, searchDappUrlOrHostnameItem, setSelectedDapp]
  )

  const handleOnSubmitEditingAddressBar = useCallback(() => {
    if (!filteredCatalog.length && !!search) {
      setSelectedDapp(searchDappUrlOrHostnameItem || searchDappItem)
      navigate(`${ROUTES.web3Browser}-screen`)
    }
  }, [
    filteredCatalog.length,
    navigate,
    search,
    searchDappItem,
    searchDappUrlOrHostnameItem,
    setSelectedDapp
  ])

  return (
    <GradientBackgroundWrapper>
      <TouchableWithoutFeedback
        onPress={() => {
          !isWeb && Keyboard.dismiss()
        }}
      >
        <View style={flexbox.flex1}>
          <BrowserNavigationToolbar
            onChangeAddressBarValue={onSearchChange}
            onSubmitEditingAddressBar={handleOnSubmitEditingAddressBar}
            addressBarValue={search}
            addressInputProps={addressInputProps}
            addressBarPlaceholder={t('Search or type URL')}
          />

          <DappsCatalogList />

          {/* Dapp favorites are temporarily disabled since v3.11.0 */}
          {/* <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, right: 10, left: 5 }}
            onPress={() => {
              openBottomSheet()
              !isWeb && Keyboard.dismiss()
            }}
          >
            <SortIcon />
          </TouchableOpacity> */}
          {/* <BottomSheet
            id="dapps-filter-bottom-sheet"
            sheetRef={sheetRef}
            closeBottomSheet={closeBottomSheet}
          >
            <Title style={text.center}>{t('Filter dApps by')}</Title>
            <View style={[spacings.pt, spacings.pbMd]}>
              {categories
                // will temporarily support only these 2 categories
                .filter((e) => e.name === 'all' || e.name === 'favorites')
                .map((category: any) => {
                  return (
                    <TouchableOpacity
                      key={category.name}
                      onPress={() => onCategorySelect(category)}
                      style={[
                        styles.filterItem,
                        categoryFilter?.name === category.name && { backgroundColor: colors.howl }
                      ]}
                    >
                      <Text fontSize={16} style={text.capitalize}>
                        {category.name}
                      </Text>
                      {categoryFilter?.name === category.name && <CheckIcon />}
                    </TouchableOpacity>
                  )
                })}
            </View>
          </BottomSheet> */}
        </View>
      </TouchableWithoutFeedback>
    </GradientBackgroundWrapper>
  )
}

export default DappsCatalogScreen
