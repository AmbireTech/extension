import { ImageProps, StyleSheet, ViewStyle } from 'react-native'

import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import commonStyles from '@common/styles/utils/common'

interface Style {
  emptyStateItem: ViewStyle
  itemsContainer: ViewStyle
  itemWrapper: ViewStyle
  item: ViewStyle
  collectibleImage: ImageProps
  collectibleImageLoadingWrapper: ViewStyle
  collectionImage: ImageProps
}

const styles = StyleSheet.create<Style>({
  emptyStateItem: {
    borderWidth: 1,
    ...commonStyles.borderRadiusPrimary,
    borderColor: colors.waikawaGray,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.howl,
    minHeight: 126,
    ...spacings.mhTy
  },
  itemsContainer: {
    marginHorizontal: -10,
    flexWrap: 'wrap',
    flexDirection: 'row',
    flex: 1
  },
  itemWrapper: {
    width: '50%',
    ...spacings.phTy,
    ...spacings.pbSm
  },
  item: {
    ...commonStyles.borderRadiusPrimary,
    ...commonStyles.hidden,
    backgroundColor: colors.howl
  },
  collectibleImage: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    aspectRatio: 1,
    ...spacings.mbMi
  },
  collectibleImageLoadingWrapper: {
    width: '100%',
    aspectRatio: 1,
    ...spacings.mbMi,
    alignItems: 'center',
    justifyContent: 'center'
  },
  collectionImage: {
    width: 15,
    height: 15,
    borderRadius: 50,
    ...spacings.mrMi
  }
})

export default styles
