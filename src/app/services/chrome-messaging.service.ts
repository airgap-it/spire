import { ExtensionMessage, ExtensionMessageTarget } from '@airgap/beacon-sdk/dist/types/ExtensionMessage'
import { Injectable } from '@angular/core'
import {
  Action,
  ActionInputTypesMap,
  ExtensionMessageInputPayload,
  ExtensionMessageOutputPayload
} from 'src/extension/Methods'

@Injectable({
  providedIn: 'root'
})
export class ChromeMessagingService {
  constructor() {}

  public sendChromeMessage<K extends Action>(
    action: K,
    payload: ActionInputTypesMap[K]
  ): Promise<ExtensionMessageOutputPayload<K>> {
    console.log('SENDING MESSAGE', action, payload)

    return new Promise(resolve => {
      const message: ExtensionMessage<ExtensionMessageInputPayload<K>> = {
        target: ExtensionMessageTarget.BACKGROUND,
        payload: {
          action,
          data: payload
        }
      }
      chrome.runtime.sendMessage(message, (response: ExtensionMessageOutputPayload<K>) => {
        console.log('GETTING RESPONSE', response)
        resolve(response)
      })
    })
  }
}
