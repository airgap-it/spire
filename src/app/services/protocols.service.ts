import { Injectable } from '@angular/core'
import { addSupportedProtocol, TezosProtocol } from '@airgap/coinlib-core'

@Injectable({
  providedIn: 'root'
})
export class ProtocolsService {
  public init(): void {
    addSupportedProtocol(new TezosProtocol())
  }
}
