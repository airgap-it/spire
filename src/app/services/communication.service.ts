import { Injectable } from '@angular/core'
import { WalletCommunicationClient } from '@airgap/beacon-sdk/dist/client/WalletCommunicationClient'
import { SettingsKey, StorageService } from './storage.service'
import { MessageTypes, PermissionRequest } from '@airgap/beacon-sdk/dist/client/Messages'
import { Serializer } from '@airgap/beacon-sdk/dist/client/Serializer'

@Injectable({
  providedIn: 'root'
})
export class CommunicationService {
  private client: WalletCommunicationClient | undefined
  constructor(private readonly storageService: StorageService) {
    this.init()
  }

  public async init(): Promise<void> {
    let seed: string | undefined = await this.storageService.get(SettingsKey.COMMUNICATION_PRIVATE_SEED)
    if (!seed) {
      seed = Math.random()
        .toString()
        .replace('.', '')
      await this.storageService.set(SettingsKey.COMMUNICATION_PRIVATE_SEED, seed)
    }
    this.client = new WalletCommunicationClient('BEACON', seed, 1, true)
    await this.client.start()

    await this.client.listenForChannelOpening(pubKey => {
      console.log('GOT PUB KEY FROM NEW WALLET', pubKey)
      // 6. Open regular channel with DApp
      if (!this.client) {
        throw new Error('Client not initialized')
      }
      this.client.listenForEncryptedMessage(pubKey, message => {
        console.log('DAPP gotEncryptedMessage:', message)
      })
      this.client.sendMessage(pubKey, 'CHANNEL SUCCESSFULLY OPENED!')

      const permissionRequest: PermissionRequest = {
        id: 'id',
        type: MessageTypes.PermissionRequest,
        scope: ['read_address', 'sign', 'payment_request', 'threshold']
      }
      const serializer = new Serializer()
      const serializedPermissionRequest = serializer.serialize(permissionRequest)
      this.client.sendMessage(pubKey, serializedPermissionRequest)
    })
  }

  public async getQrData(): Promise<string> {
    return new Promise(resolve => {
      setTimeout(() => {
        if (!this.client) {
          throw new Error('Client not initialized')
        }
        resolve(JSON.stringify(this.client.getHandshakeInfo()))
      }, 1000)
    })
  }
}
