import { Injectable } from '@angular/core'
import { Network } from '@airgap/beacon-sdk/dist/messages/Messages'

export enum StorageKey {
  DEV_SETTINGS_ENABLED = 'DEV_SETTINGS_ENABLED',
  SIGNING_METHOD = 'SIGNING_METHOD',
  HAS_ONBOARDED = 'HAS_ONBOARDED',
  ACTIVE_NETWORK = 'ACTIVE_NETWORK'
}

interface StorageKeyReturnType {
  [StorageKey.DEV_SETTINGS_ENABLED]: boolean
  [StorageKey.SIGNING_METHOD]: string | undefined
  [StorageKey.HAS_ONBOARDED]: boolean
  [StorageKey.ACTIVE_NETWORK]: Network | undefined
}

type StorageKeyReturnDefaults = { [key in StorageKey]: StorageKeyReturnType[key] }

const defaultValues: StorageKeyReturnDefaults = {
  [StorageKey.DEV_SETTINGS_ENABLED]: false,
  [StorageKey.SIGNING_METHOD]: undefined,
  [StorageKey.HAS_ONBOARDED]: false,
  [StorageKey.ACTIVE_NETWORK]: undefined
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly storage: Partial<Storage>
  constructor() {
    if (window.chrome && chrome.runtime && chrome.runtime.id) {
      this.storage = {
        get: async (key: string): Promise<unknown> => {
          return new Promise(resolve => {
            chrome.storage.local.get(null, result => {
              resolve(result[key])
            })
          })
        },
        set: async (key: string, value: any): Promise<void> => {
          return chrome.storage.local.set({ [key]: value })
        }
      }
    } else {
      this.storage = {
        get: async (key: string): Promise<unknown> => {
          return localStorage.getItem(key)
        },
        set: async (key: string, value: any): Promise<void> => {
          return localStorage.setItem(key, value)
        }
      }
    }
  }
  public async get<K extends StorageKey>(key: K): Promise<StorageKeyReturnType[K]> {
    const value: StorageKeyReturnType[K] = (await this.storage.get(key)) || defaultValues[key]
    console.log(`[SETTINGS_SERVICE:get] ${key}, returned: ${value}`)

    return value
  }

  public async set<K extends StorageKey>(key: K, value: StorageKeyReturnType[K]): Promise<any> {
    console.log(`[SETTINGS_SERVICE:set] ${key}, ${value}`)

    return this.storage.set(key, value)
  }

  public async delete<K extends StorageKey>(key: K): Promise<boolean> {
    try {
      await this.storage.remove(key)

      return true
    } catch (error) {
      return false
    }
  }
}
