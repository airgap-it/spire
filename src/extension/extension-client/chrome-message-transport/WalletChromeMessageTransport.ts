import { ChromeMessageTransport, Storage, StorageKey } from '@airgap/beacon-sdk'
import { PostMessagePairingRequest } from '@airgap/beacon-sdk/dist/cjs/types/PostMessagePairingRequest'
import * as sodium from 'libsodium-wrappers'

// const logger = new Logger('DappP2PTransport')

export class WalletChromeMessageTransport extends ChromeMessageTransport<
  PostMessagePairingRequest,
  StorageKey.TRANSPORT_POSTMESSAGE_PEERS_WALLET
> {
  constructor(name: string, keyPair: sodium.KeyPair, storage: Storage) {
    super(name, keyPair, storage, StorageKey.TRANSPORT_POSTMESSAGE_PEERS_WALLET)
  }

  public async addPeer(newPeer: PostMessagePairingRequest): Promise<void> {
    await super.addPeer(newPeer)
    await this.client.sendPairingResponse(newPeer)
  }
}
