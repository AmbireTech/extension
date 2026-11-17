import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TextStyle, View } from 'react-native'

import { Hex } from '@ambire-common/interfaces/hex'
import { getDelegatorName } from '@ambire-common/libs/7702/7702'
import { ZERO_ADDRESS } from '@ambire-common/services/socket/constants'
import ExpandableCard from '@common/components/ExpandableCard'
import Text from '@common/components/Text'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  setDelegation?: boolean
  delegatedContract?: Hex | null
  isBorderless?: boolean
}

const DelegationHumanization: FC<Props> = ({ setDelegation, delegatedContract, isBorderless }) => {
  const { t } = useTranslation()

  const delegatorName = useMemo(() => {
    if (!delegatedContract) return ''
    return getDelegatorName(delegatedContract)
  }, [delegatedContract])

  const fontSize = isBorderless ? 14 : 16

  return (
    <View>
      <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]}>
        <ExpandableCard
          enableToggleExpand={false}
          hasArrow={false}
          // @ts-ignore
          style={[{ width: '100%' }, isBorderless ? { borderWidth: 0, paddingLeft: 8 } : {}]}
          content={
            <Text>
              {setDelegation ? (
                <>
                  <Text fontSize={fontSize} weight="semiBold">
                    {t('Enable')}{' '}
                  </Text>
                  <Text fontSize={fontSize}>
                    {t('the Ambire EIP-7702 Delegation for this account')}
                  </Text>
                </>
              ) : (
                <>
                  <Text fontSize={fontSize} weight="semiBold">
                    {t('Revoke')}{' '}
                  </Text>
                  <Text fontSize={fontSize}>
                    {t('the')} {delegatorName ? `${delegatorName} ` : ''}
                    {t('EIP-7702 Delegation for this account')}
                  </Text>
                  {!delegatorName && delegatedContract !== ZERO_ADDRESS && (
                    <>
                      <Text fontSize={fontSize}>: </Text>
                      <Text
                        fontSize={fontSize}
                        weight="semiBold"
                        style={{ wordBreak: 'break-all' } as TextStyle}
                      >
                        {delegatedContract}
                      </Text>
                    </>
                  )}
                </>
              )}
            </Text>
          }
        />
      </View>
    </View>
  )
}

export default DelegationHumanization
