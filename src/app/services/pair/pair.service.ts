import { Transport } from '@airgap/beacon-sdk/dist/client/transports/Transport'
import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root'
})
export class PairService {
  public activeTransport: Transport | undefined

  constructor() {}

  public async addTransport() {}
}
