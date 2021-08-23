import { Pipe, PipeTransform } from '@angular/core'
import { getProtocolByIdentifier, ICoinProtocol } from '@airgap/coinlib-core'
import { ProtocolSymbols } from '@airgap/coinlib-core/utils/ProtocolSymbols'
import { BigNumber } from 'bignumber.js'

@Pipe({
  name: 'feeConverter'
})
export class FeeConverterPipe implements PipeTransform {
  public transform(value: BigNumber | string | number, args: { protocolIdentifier: ProtocolSymbols, reverse?: boolean, appendSymbol?: boolean }): string {
    const reverse = args.reverse !== undefined && args.reverse
    const appendSymbol = args.appendSymbol === undefined || args.appendSymbol
    if (BigNumber.isBigNumber(value)) {
      value = value.toNumber()
    }
    if (!args.protocolIdentifier || (!value && value !== 0) || isNaN(Number(value))) {
      // console.warn(`FeeConverterPipe: necessary properties missing!\n` + `Protocol: ${args.protocolIdentifier}\n` + `Value: ${value}`)
      return ''
    }
    let protocol: ICoinProtocol

    try {
      protocol = getProtocolByIdentifier(args.protocolIdentifier)
    } catch (e) {
      return ''
    }

    const amount = new BigNumber(value)
    const shiftDirection: number = !reverse ? -1 : 1
    const fee = amount.shiftedBy(shiftDirection * protocol.feeDecimals)
    
    return fee.toFixed() + (appendSymbol ? ' ' + protocol.feeSymbol.toUpperCase() : '')
  }
}
