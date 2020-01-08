import { WalletCommunicationClient } from '@airgap/beacon-sdk/dist/client/WalletCommunicationClient'
import { Injectable } from '@angular/core'

import { SettingsKey, StorageService } from './storage.service'

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

    await this.listenForChannelOpening()

    const pubKeys = await this.storageService.get(SettingsKey.COMMUNICATION_WALLET_PUBKEYS)
    this.listenForMessages(pubKeys)
  }

  public async listenForChannelOpening() {
    if (!this.client) {
      throw new Error('client not ready')
    }

    await this.client.listenForChannelOpening(pubKey => {
      console.log('GOT PUB KEY FROM NEW WALLET', pubKey)
      this.saveWalletPubKey(pubKey)

      // Open regular channel with DApp
      if (!this.client) {
        throw new Error('Client not initialized')
      }
      this.listenForMessages([pubKey])
    })
  }

  public async listenForMessages(pubKeys: string[]) {
    pubKeys.forEach(pubKey => {
      if (!this.client) {
        throw new Error('client not ready')
      }

      this.client.listenForEncryptedMessage(pubKey, message => {
        console.log('DAPP gotEncryptedMessage:', message)
      })
      this.client.sendMessage(pubKey, 'CHANNEL SUCCESSFULLY OPENED!')
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

  public async saveWalletPubKey(pubKey: string) {
    const pubKeys = await this.storageService.get(SettingsKey.COMMUNICATION_WALLET_PUBKEYS)
    if (!pubKeys.includes(pubKey)) {
      pubKeys.push(pubKey)
      this.storageService.set(SettingsKey.COMMUNICATION_WALLET_PUBKEYS, pubKeys)
    }
  }
}
