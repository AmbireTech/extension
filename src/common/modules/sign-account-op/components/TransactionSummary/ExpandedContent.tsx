import { formatUnits } from 'ethers'
import React, { useState } from 'react'
import { View } from 'react-native'

import { DecodedCall } from '@ambire-common/interfaces/decodeCall'
import { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useDecodeTransactionData from '@common/hooks/useDecodeTransactionData/useDecodeTransactionData'
import useTheme from '@common/hooks/useTheme/useTheme'
import { SPACING_MI, SPACING_SM, SPACING_TY } from '@common/styles/spacings'

import getStyles from './styles'

interface Props {
  call: IrCall
  size: 'sm' | 'md' | 'lg'
  sizeMultiplier: Record<'sm' | 'md' | 'lg', number>
  styles: Record<string, any>
}

const DataArgs = ({
  decodedArgs,
  indent = 0,
  key
}: {
  decodedArgs: DecodedCall['args']
  indent?: number
  key: string
}) => {
  const { theme } = useTheme(getStyles)

  return decodedArgs.map((arg, index) => {
    const breakableStyle = {
      color: theme.secondaryText,
      wordBreak: 'break-all'
    } as any

    return (
      <View
        key={`${key}-${index}`}
        style={{ marginLeft: SPACING_MI * indent, flexDirection: 'column' }}
      >
        {Array.isArray(arg.val) ? (
          <View>
            <Text selectable fontSize={12} style={breakableStyle}>
              {`${arg.key}: [`}
            </Text>
            <DataArgs decodedArgs={arg.val} indent={indent + 1} key={`${key}-${index}`} />
            <Text selectable fontSize={12} style={breakableStyle}>
              {`]`}
            </Text>
          </View>
        ) : typeof arg.val === 'object' ? (
          <View>
            <Text selectable fontSize={12} style={breakableStyle}>
              {`${arg.key}: function call `}
              <Text selectable fontSize={12} style={[breakableStyle, { fontWeight: '900' }]}>
                {arg.val.signature}
              </Text>
            </Text>
            <Text selectable fontSize={12} style={breakableStyle}>
              {`Selector: ${arg.val.selector}`}
            </Text>

            <DataArgs decodedArgs={arg.val.args} indent={indent + 1} key={`${key}-${index}`} />
          </View>
        ) : (
          <Text selectable fontSize={12} style={breakableStyle}>
            {arg.key}: {arg.val.toString()}
          </Text>
        )}
        <br />
      </View>
    )
  })
}
const ExpandedContent = ({ call, size, sizeMultiplier }: Props) => {
  const { t } = useTranslation()
  const { decodedFunction, isLoading } = useDecodeTransactionData(call)
  const { styles, theme } = useTheme(getStyles)
  const [displayRawData, setDisplayRawData] = useState(false)

  return (
    <View
      style={{
        paddingHorizontal: SPACING_SM * sizeMultiplier[size],
        paddingVertical: SPACING_TY * sizeMultiplier[size]
      }}
    >
      {call.to && (
        <Text selectable fontSize={12} style={styles.bodyText}>
          <Text fontSize={12} style={styles.bodyText}>
            {t('Interacting with (to): ')}
          </Text>
          {call.to}
        </Text>
      )}
      <Text selectable fontSize={12} style={styles.bodyText}>
        <Text fontSize={12} style={styles.bodyText}>
          {t('Value to be sent (value): ')}
        </Text>
        {formatUnits(call.value || '0x0', 18)}
      </Text>

      {isLoading ? (
        <View style={[styles.bodyText, { flexDirection: 'row', alignItems: 'center' }]}>
          <Spinner style={{ width: 16, height: 16 }} />
        </View>
      ) : decodedFunction ? (
        <View style={styles.bodyText}>
          <Text selectable style={{ color: theme.secondaryText }} fontSize={12}>
            {t('Function to call: ')}
            {decodedFunction.signature}
          </Text>
          <Text
            onPress={() => setDisplayRawData(!displayRawData)}
            style={{
              color: theme.primaryText,
              marginVertical: SPACING_MI,
              textDecorationLine: 'underline'
            }}
            fontSize={12}
          >
            {displayRawData ? t('Show Decoded') : t('Show Raw')}
          </Text>
          {displayRawData ? (
            <Text fontSize={12} style={styles.bodyText}>
              <Text fontSize={12} style={styles.bodyText}>
                {t('Data: ')}
              </Text>
              <Text selectable fontSize={12} style={styles.bodyText}>
                {call.data}
              </Text>
            </Text>
          ) : (
            <>
              <Text style={{ color: theme.secondaryText }} fontSize={12}>
                {t('Decoded function arguments:')}
              </Text>
              <DataArgs decodedArgs={decodedFunction.args} key="" />
            </>
          )}
        </View>
      ) : (
        <Text selectable fontSize={12} style={styles.bodyText}>
          <Text fontSize={12} style={styles.bodyText}>
            {t('Data: ')}
          </Text>
          <Text fontSize={12} style={styles.bodyText}>
            {call.data}
          </Text>
        </Text>
      )}
    </View>
  )
}

export default ExpandedContent
