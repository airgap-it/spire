import { Injectable } from '@angular/core'

export enum SettingsKey {
  COMMUNICATION_PRIVATE_SEED = 'COMMUNICATION_PRIVATE_SEED',
  COMMUNICATION_WALLET_PUBKEYS = 'COMMUNICATION_WALLET_PUBKEYS',
  LOCAL_MNEMONIC = 'LOCAL_MNEMONIC'
}

interface SettingsKeyReturnType {
  [SettingsKey.COMMUNICATION_PRIVATE_SEED]: string | undefined
  [SettingsKey.COMMUNICATION_WALLET_PUBKEYS]: string[]
  [SettingsKey.LOCAL_MNEMONIC]: string | undefined
}

type SettingsKeyReturnDefaults = { [key in SettingsKey]: SettingsKeyReturnType[key] }

const defaultValues: SettingsKeyReturnDefaults = {
  [SettingsKey.COMMUNICATION_PRIVATE_SEED]: undefined,
  [SettingsKey.COMMUNICATION_WALLET_PUBKEYS]: [],
  [SettingsKey.LOCAL_MNEMONIC]: undefined
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
            chrome.storage.local.get(null, (result) => {
              resolve(result[key])
            });
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
  public async get<K extends SettingsKey>(key: K): Promise<SettingsKeyReturnType[K]> {
    const value: SettingsKeyReturnType[K] = (await this.storage.get(key)) || defaultValues[key]
    console.log(`[SETTINGS_SERVICE:get] ${key}, returned: ${value}`)

    return value
  }

  public async set<K extends SettingsKey>(key: K, value: SettingsKeyReturnType[K]): Promise<any> {
    console.log(`[SETTINGS_SERVICE:set] ${key}, ${value}`)

    return this.storage.set(key, value)
  }

  public async delete<K extends SettingsKey>(key: K): Promise<boolean> {
    try {
      await this.storage.remove(key)

      return true
    } catch (error) {
      return false
    }
  }
}
