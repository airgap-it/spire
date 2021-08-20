import { TezosRevealOperation } from "@airgap/coinlib-core/protocols/tezos/types/operations/Reveal"
import { TezosTransactionOperation } from "@airgap/coinlib-core/protocols/tezos/types/operations/Transaction"
import { TezosDelegationOperation } from "@airgap/coinlib-core/protocols/tezos/types/operations/Delegation"
import { TezosOriginationOperation } from "@airgap/coinlib-core/protocols/tezos/types/operations/Origination"
import { TezosOperationType } from "@airgap/coinlib-core/protocols/tezos/types/TezosOperationType"
import { TezosOperation } from "@airgap/coinlib-core/protocols/tezos/types/operations/TezosOperation"

export type TezosInjectableOperation = TezosRevealOperation | TezosTransactionOperation | TezosDelegationOperation | TezosOriginationOperation
const INJECTABLE_TYPES = [TezosOperationType.REVEAL, TezosOperationType.TRANSACTION, TezosOperationType.DELEGATION, TezosOperationType.ORIGINATION]

export function isInjectableOperation(operation: TezosOperation): operation is TezosInjectableOperation {
    return INJECTABLE_TYPES.includes(operation.kind)
}
