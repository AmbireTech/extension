import React, { Suspense, useCallback, useMemo } from 'react'
import { View } from 'react-native'

import type { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import { SAFE_CALL_OPERATION, SAFE_DELEGATE_CALL_OPERATION } from '@ambire-common/libs/safe/helpers'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useDecodedCallsByData from '@common/hooks/useDecodedCallsByData'
import type { DecodedCallsByData } from '@common/hooks/useDecodedCallsByData'
import {
  findHumanizedCall,
  getDecodedCallLines,
  isEmptyCallData,
  RequestCall,
  RequestCalls
} from '@common/modules/hardware-wallets/utils/getRequestCalls'
import CompactHumanizedCalls from '@common/modules/sign-account-op/components/CompactHumanizedCalls/lazyCompactHumanizedCalls'
import spacings, { SPACING_SM } from '@common/styles/spacings'

import { MonoBox, MonoText, SectionHeader } from './DetailsPrimitives'

type Props = {
  /** The calls of the signed request, read once with its hashes and checks */
  requestCalls: RequestCalls | null
  /** The calls as Ambire humanized them on the sign screen */
  humanization?: IrCall[]
}

const DecodedCallBody = React.memo(function DecodedCallBody({
  call,
  decodedCallsByData
}: {
  call: RequestCall
  decodedCallsByData: DecodedCallsByData
}) {
  const { t } = useTranslation()
  const decodedCall = decodedCallsByData.get(call.data)
  const lines = useMemo(() => (decodedCall ? getDecodedCallLines(decodedCall) : []), [decodedCall])

  if (isEmptyCallData(call.data)) {
    return (
      <Text fontSize={12} appearance="secondaryText" style={spacings.mtMi}>
        {t('No data: this call only sends value.')}
      </Text>
    )
  }

  if (decodedCall === undefined) {
    return (
      <Text fontSize={12} appearance="secondaryText" style={spacings.mtMi}>
        {t('Decoding…')}
      </Text>
    )
  }

  if (!decodedCall) {
    return (
      <>
        <Text fontSize={12} appearance="secondaryText" style={spacings.mtMi}>
          {t("Ambire doesn't know the function of this call, so it can't decode it.")}
        </Text>
        <MonoText>{`data: ${call.data}`}</MonoText>
      </>
    )
  }

  return (
    <View style={spacings.mtMi}>
      {/* The signature and arguments come from the request, so they're not passed through t() */}
      <MonoText style={{ fontWeight: '600' }}>{decodedCall.signature}</MonoText>
      {lines.map((line) => (
        <MonoText key={line.id} style={{ marginLeft: SPACING_SM * (line.depth + 1) }}>
          {line.text}
        </MonoText>
      ))}
    </View>
  )
})

const CallCard = React.memo(function CallCard({
  call,
  title,
  humanizedCall,
  chainId,
  decodedCallsByData
}: {
  call: RequestCall
  title?: string
  /** What Ambire showed for this exact call, when it was shown */
  humanizedCall?: IrCall
  chainId: bigint | null
  decodedCallsByData: DecodedCallsByData
}) {
  const humanization = useMemo(() => (humanizedCall ? [humanizedCall] : []), [humanizedCall])

  return (
    <View style={spacings.mbTy}>
      <MonoBox>
        {!!title && (
          <Text fontSize={12} weight="medium" appearance="secondaryText" style={spacings.mbMi}>
            {title}
          </Text>
        )}
        {!!humanization.length && chainId !== null && (
          <Suspense fallback={null}>
            <View style={spacings.mbTy}>
              <CompactHumanizedCalls humanization={humanization} chainId={chainId} />
            </View>
          </Suspense>
        )}
        <MonoText>{`to: ${call.to ?? '-'}`}</MonoText>
        <MonoText>{`value: ${call.value.toString()}`}</MonoText>
        <DecodedCallBody call={call} decodedCallsByData={decodedCallsByData} />
      </MonoBox>
    </View>
  )
})

/**
 * The calls of the signed request with their data decoded, shown last as
 * Ambire's reading of the data above. For a Safe transaction, that's its
 * call, or the calls of its batch one by one. Each call also shows how Ambire
 * humanized it, when the humanized call is exactly the signed one.
 */
const DecodedRequest = ({ requestCalls, humanization }: Props) => {
  const { t } = useTranslation()
  const callDatas = useMemo(
    () =>
      (requestCalls?.calls ?? []).map(({ data }) => data).filter((data) => !isEmptyCallData(data)),
    [requestCalls]
  )
  const decodedCallsByData = useDecodedCallsByData(callDatas)
  const humanizedCallsById = useMemo(
    () =>
      new Map(
        (requestCalls?.calls ?? []).map((call) => [
          call.id,
          humanization?.length ? findHumanizedCall(call, humanization) : undefined
        ])
      ),
    [requestCalls, humanization]
  )

  const getOperationLabel = useCallback(
    (call: RequestCall) => {
      if (call.operation === SAFE_CALL_OPERATION) return t('call')
      if (call.operation === SAFE_DELEGATE_CALL_OPERATION) return t('delegate call')

      return t('unknown operation')
    },
    [t]
  )

  if (!requestCalls) return null

  return (
    <>
      <SectionHeader title={t('Decoded data')} />
      <Text fontSize={12} appearance="secondaryText" style={spacings.mbTy}>
        {t(
          'Decoded by Ambire with the function signatures it knows. What you sign is the data above.'
        )}
      </Text>
      {requestCalls.kind === 'transaction' ? (
        requestCalls.calls.map((call, index) => (
          <CallCard
            key={call.id}
            call={call}
            title={requestCalls.calls.length > 1 ? `#${index + 1}` : undefined}
            humanizedCall={humanizedCallsById.get(call.id)}
            chainId={requestCalls.chainId}
            decodedCallsByData={decodedCallsByData}
          />
        ))
      ) : (
        <>
          <Text fontSize={13} weight="semiBold" style={spacings.mbTy}>
            {requestCalls.isBatch
              ? t('Transactions in the batch ({{count}})', { count: requestCalls.calls.length })
              : t('Transaction')}
          </Text>
          {requestCalls.calls.map((call, index) => (
            <CallCard
              key={call.id}
              call={call}
              title={
                requestCalls.isBatch
                  ? `#${index + 1} · ${getOperationLabel(call)}`
                  : getOperationLabel(call)
              }
              humanizedCall={humanizedCallsById.get(call.id)}
              chainId={requestCalls.chainId}
              decodedCallsByData={decodedCallsByData}
            />
          ))}
          {!!requestCalls.batchError && (
            <Text fontSize={12} appearance="warningText">
              {t(requestCalls.batchError)}
            </Text>
          )}
        </>
      )}
    </>
  )
}

export default React.memo(DecodedRequest)
