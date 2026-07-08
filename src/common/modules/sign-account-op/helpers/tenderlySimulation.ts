import { Interface } from 'ethers'
import { v4 as uuidv4 } from 'uuid'

import AmbireAccount from '@ambire-common/../contracts/compiled/AmbireAccount.json'
import AmbireFactory from '@ambire-common/../contracts/compiled/AmbireFactory.json'
import { DEPLOYLESS_SIMULATION_FROM } from '@ambire-common/consts/deploy'
import { execTransactionAbi } from '@ambire-common/consts/safe'
import { getSpoof } from '@ambire-common/libs/account/account'
import { getSignableCalls } from '@ambire-common/libs/accountOp/accountOp'
import { getSafeTxn } from '@ambire-common/libs/safe/safe'

import type { AccountOnchainState } from '@ambire-common/interfaces/account'
import type { AllControllersMappingType } from '@common/constants/controllersMapping'

type SignAccountOpState = AllControllersMappingType['SignAccountOpController'] | null

type GetTenderlySimulationLinkProps = {
  signAccountOpState: SignAccountOpState
  state?: AccountOnchainState
}

const TENDERLY_SIMULATOR_URL = 'https://dashboard.tenderly.co/simulator/new'

const getTenderlySimulationLink = ({
  signAccountOpState,
  state
}: GetTenderlySimulationLinkProps) => {
  try {
    if (!signAccountOpState || !signAccountOpState.accountOp.calls.length || !state) return null

    let params: URLSearchParams

    if (state.isEOA && !state.isSmarterEoa && signAccountOpState.accountOp.calls.length > 1) {
      // we cannot create a tenderly link for EOA batches as passing the code
      // as a param to the URLSearchParams makes the url too large, and
      // tenderly blocks it
      return null
    } else if (signAccountOpState.account.creation || state.isSmarterEoa) {
      if (signAccountOpState.account.creation && !state.isDeployed) {
        const ambireFactory = new Interface(AmbireFactory.abi)
        const executeData = ambireFactory.encodeFunctionData('deployAndExecute', [
          signAccountOpState.account.creation.bytecode,
          signAccountOpState.account.creation.salt,
          getSignableCalls(signAccountOpState.accountOp),
          getSpoof(signAccountOpState.account)
        ])
        params = new URLSearchParams({
          network: signAccountOpState.accountOp.chainId.toString(),
          from: DEPLOYLESS_SIMULATION_FROM,
          contractAddress: signAccountOpState.account.creation.factoryAddr,
          rawFunctionInput: executeData,
          value: '0'
        })
      } else {
        const ambireAccount = new Interface(AmbireAccount.abi)
        const executeData = ambireAccount.encodeFunctionData('execute', [
          getSignableCalls(signAccountOpState.accountOp),
          getSpoof(signAccountOpState.account)
        ])
        params = new URLSearchParams({
          network: signAccountOpState.accountOp.chainId.toString(),
          from: DEPLOYLESS_SIMULATION_FROM,
          contractAddress: signAccountOpState.accountOp.accountAddr,
          rawFunctionInput: executeData,
          value: '0'
        })
      }
    } else if (signAccountOpState.account.safeCreation && state.isDeployed) {
      const firstSigner = state.associatedKeys[0]
      if (!firstSigner) throw new Error('No Safe owners found')

      const safeTxn = getSafeTxn(signAccountOpState.accountOp, state)
      const exec = new Interface(execTransactionAbi)
      const preValidatedSig = `0x000000000000000000000000${firstSigner.slice(2).toLowerCase()}000000000000000000000000000000000000000000000000000000000000000001`
      const execData = exec.encodeFunctionData('execTransaction', [
        safeTxn.to,
        safeTxn.value,
        safeTxn.data,
        safeTxn.operation,
        safeTxn.safeTxGas,
        safeTxn.baseGas,
        safeTxn.gasPrice,
        safeTxn.gasToken,
        safeTxn.refundReceiver,
        preValidatedSig
      ])

      // Tenderly's new UI uses base64 encoded json to provide simulation
      // parameters. The new format is required to use state overrides
      const draftTemplate = {
        v: 1,
        network: { id: signAccountOpState.accountOp.chainId.toString() },
        row: {
          from: firstSigner,
          gas: '0',
          gasPrice: '0',
          value: 0,
          block: '',
          blockIndex: null,
          endOfBlock: false,
          usePendingBlock: true,
          depositTx: false,
          systemTx: false,
          mint: '0',
          l1BlockNumber: '',
          l1Timestamp: '',
          l1MessageSender: '0x0000000000000000000000000000000000000000',
          l1Turing: '',
          contractAddress: signAccountOpState.accountOp.accountAddr,
          functionInputs: {},
          inputDataType: 'raw',
          rawFunctionInput: execData,
          contractAbiImport: '',
          blockHeaderOverrides: {},
          stateOverrides:
            state.threshold > 1
              ? [
                  {
                    id: uuidv4(),
                    contractAddress: signAccountOpState.accountOp.accountAddr,
                    balance: '',
                    storage: [
                      {
                        key: '0x0000000000000000000000000000000000000000000000000000000000000004', // threshold slot
                        value: '0x0000000000000000000000000000000000000000000000000000000000000001'
                      }
                    ]
                  }
                ]
              : [],
          contractFunction: null
        }
      }

      params = new URLSearchParams({
        draft: btoa(JSON.stringify(draftTemplate)).replace(/=+$/, '') // remove trailing padding, tenderly doesn't use it
      })
    } else {
      // only a single call for EOAs
      const call = signAccountOpState.accountOp.calls[0]!
      params = new URLSearchParams({
        network: signAccountOpState.accountOp.chainId.toString(),
        from: signAccountOpState.accountOp.accountAddr,
        rawFunctionInput: call.data,
        value: call.value.toString(),
        ...(call.to ? { contractAddress: call.to } : {})
      })
    }

    return `${TENDERLY_SIMULATOR_URL}?${params.toString()}`
  } catch (e: any) {
    console.error('Error generating Tenderly link', e)
    return null
  }
}

export { getTenderlySimulationLink }
