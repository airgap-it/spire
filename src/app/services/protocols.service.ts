import { Injectable } from '@angular/core'
import { addSupportedProtocol, TezosProtocol } from 'airgap-coin-lib'

@Injectable({
  providedIn: 'root'
})
export class ProtocolsService {
  public init(): void {
    addSupportedProtocol(new TezosProtocol())
  }
}
