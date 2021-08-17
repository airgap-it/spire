import { TezosWrappedOperation } from '@airgap/coinlib-core'

export type MetadataBalanceUpdatesKindEnum = 'contract' | 'freezer'
export type MetadataBalanceUpdatesCategoryEnum = 'rewards' | 'fees' | 'deposits'

export interface OperationMetadataBalanceUpdates {
  kind: MetadataBalanceUpdatesKindEnum
  category?: MetadataBalanceUpdatesCategoryEnum
  contract?: string
  delegate?: string
  cycle?: number
  change: string
}

export interface MichelsonV1ExpressionBase {
  int?: string
  string?: string
  bytes?: string
}

export interface MichelsonV1ExpressionExtended {
  prim: string
  args?: MichelsonV1Expression[]
  annots?: string[]
}

export type MichelsonV1Expression = MichelsonV1ExpressionBase | MichelsonV1ExpressionExtended

export interface TransactionOperationParameter {
  entrypoint: string
  value: MichelsonV1Expression
}
export type OperationResultStatusEnum = 'applied' | 'failed' | 'skipped' | 'backtracked'

export interface ContractBigMapDiffItem {
  key_hash: string
  key: MichelsonV1Expression
  value?: MichelsonV1Expression
}

export type BalanceUpdateKindEnum = 'contract' | 'freezer'
export type BalanceUpdateCategoryEnum = 'rewards' | 'fees' | 'deposits'

export interface OperationBalanceUpdatesItem {
  kind: BalanceUpdateKindEnum
  category?: BalanceUpdateCategoryEnum
  delegate?: string
  cycle?: number
  contract?: string
  change: string
}

export type ContractBigMapDiff = ContractBigMapDiffItem[]
export type OperationBalanceUpdates = OperationBalanceUpdatesItem[]

export enum OpKind {
  ORIGINATION = 'origination',
  DELEGATION = 'delegation',
  REVEAL = 'reveal',
  TRANSACTION = 'transaction',
  ACTIVATION = 'activate_account',
  ENDORSEMENT = 'endorsement',
  SEED_NONCE_REVELATION = 'seed_nonce_revelation',
  DOUBLE_ENDORSEMENT_EVIDENCE = 'double_endorsement_evidence',
  DOUBLE_BAKING_EVIDENCE = 'double_baking_evidence',
  PROPOSALS = 'proposals',
  BALLOT = 'ballot'
}

export interface TezosGenericOperationError {
  kind: string
  id: string
}
export interface OperationResultTransaction {
  status: OperationResultStatusEnum
  storage?: MichelsonV1Expression
  big_map_diff?: ContractBigMapDiff
  balance_updates?: OperationBalanceUpdates
  originated_contracts?: string[]
  consumed_gas?: string
  storage_size?: string
  paid_storage_size_diff?: string
  allocated_destination_contract?: boolean
  errors?: TezosGenericOperationError[]
}
export interface ScriptedContracts {
  code: MichelsonV1Expression[]
  storage: MichelsonV1Expression
}
export type InternalOperationResultKindEnum =
  | OpKind.REVEAL
  | OpKind.TRANSACTION
  | OpKind.ORIGINATION
  | OpKind.DELEGATION

export interface InternalOperationResult {
  kind: InternalOperationResultKindEnum
  source: string
  nonce: number
  amount?: string
  destination?: string
  parameters?: TransactionOperationParameter
  public_key?: string
  balance?: string
  delegate?: string
  script?: ScriptedContracts
  result: OperationResultTransaction
}

export interface OperationContentsAndResultTransaction {
  kind: OpKind.TRANSACTION
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  amount: string
  destination: string
  parameters?: TransactionOperationParameter
  metadata: OperationContentsAndResultMetadataTransaction
}

export interface OperationContentsAndResultMetadataTransaction {
  balance_updates: OperationMetadataBalanceUpdates[]
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
