import { TezosWrappedOperation } from '@airgap/coinlib-core'

export interface TezosGenericOperationError {
  kind: string
  id: string
  message: string | undefined
}
export interface OperationResultTransaction {
  status: 'applied' | 'failed' | 'skipped' | 'backtracked'
  errors?: TezosGenericOperationError[]
}

export interface InternalOperationResult {
  result: OperationResultTransaction
}

export interface OperationContentsAndResultTransaction {
  metadata: OperationContentsAndResultMetadataTransaction
}

export interface OperationContentsAndResultMetadataTransaction {
  operation_result: OperationResultTransaction
  internal_operation_results?: InternalOperationResult[]
}
export type PreapplyResponse = {
  contents: OperationContentsAndResultTransaction[]
}

export interface DryRunResponse {
  preapplyResponse: PreapplyResponse[]
  signatures: DryRunSignatures
}

export interface FullOperationGroup extends TezosWrappedOperation {
  chain_id: string
}

export interface DryRunSignatures {
  preapplySignature: string
  signedTransaction: string
}
