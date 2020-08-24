enum Action {
  GET_ADDRESS = 'getAddress',
  SIGN_TRANSACTION = 'signTransaction',
  SIGN_HASH = 'signHash',
  GET_VERSION = 'getVersion'
}

interface BeaconLedgerBridgeMessage {
  action: Action
  params?: {
    derivationPath: string
    operation?: string
    hash?: string
  }
}

interface BeaconLedgerBridgeVersionResponse {
  major: number
  minor: number
  path: number
  bakingApp: boolean
}

export class BeaconLedgerBridge {
  private static readonly TARGET: string = 'BEACON-SDK-LEDGER-BRIDGE'

  private readonly iframe: HTMLIFrameElement

  private get origin(): string {
    return this.bridgeURL
      .split('/')
      .slice(0, 3)
      .join('/')
  }

  constructor(private readonly bridgeURL: string) {
    this.iframe = document.createElement('iframe')
    this.iframe.src = bridgeURL
    document.head.appendChild(this.iframe)
  }

  public async getAddress(derivationPath: string = "44'/1729'/0'/0'"): Promise<string> {
    return this.sendMessage({
      action: Action.GET_ADDRESS,
      params: {
        derivationPath
      }
    })
  }

  public async signOperation(operation: string, derivationPath: string = "44'/1729'/0'/0'"): Promise<string> {
    return this.sendMessage({
      action: Action.SIGN_TRANSACTION,
      params: {
        derivationPath,
        operation
      }
    })
  }

  public async signHash(hash: string, derivationPath: string = "44'/1729'/0'/0'"): Promise<string> {
    return this.sendMessage({
      action: Action.SIGN_HASH,
      params: {
        derivationPath,
        hash
      }
    })
  }

  public async getVersion(): Promise<BeaconLedgerBridgeVersionResponse> {
    return this.sendMessage({
      action: Action.GET_VERSION
    })
  }

  private async sendMessage(message: BeaconLedgerBridgeMessage): Promise<any> {
    const msg = {
      target: BeaconLedgerBridge.TARGET,
      context: this.randomID(),
      action: message.action,
      params: message.params
    }

    return new Promise((resolve, reject) => {
      const handler = (event: any) => {
        if (event.origin !== this.origin) {
          return false
        }
        const response = event.data
        if (response === undefined || (response.action !== msg.action && response.context !== msg.context)) {
          return false
        }
        response.context = undefined
        window.removeEventListener('message', handler)
        if (response.payload !== undefined) {
          resolve(response.payload)
        } else {
          reject(response.error)
        }

        return true
      }
      window.addEventListener('message', handler)
      if (this.iframe.contentWindow) {
        this.iframe.contentWindow.postMessage(msg, '*')
      }
    })
  }

  private randomID(): string {
    const uint32: number = window.crypto.getRandomValues(new Uint32Array(1))[0]

    return uint32.toString(16)
  }
}
