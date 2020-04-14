import { ChangeDetectorRef, Component, OnInit } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { ChromeMessagingService } from 'src/app/services/chrome-messaging.service'
import { Action, ExtensionMessageOutputPayload } from 'src/extension/Methods'

@Component({
  selector: 'app-add-ledger-connection',
  templateUrl: './add-ledger-connection.page.html',
  styleUrls: ['./add-ledger-connection.page.scss']
})
export class AddLedgerConnectionPage implements OnInit {
  public targetMethod: Action = Action.LEDGER_INIT
  public request: unknown | undefined

  public isLoading: boolean = true
  public success: boolean = false
  public error: string = ''

  constructor(
    private readonly modalController: ModalController,
    private readonly chromeMessagingService: ChromeMessagingService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public async ngOnInit(): Promise<void> {
    return this.connect()
  }

  public async connect(): Promise<void> {
    this.isLoading = true

    const response: ExtensionMessageOutputPayload<Action> = await this.chromeMessagingService.sendChromeMessage(
      this.targetMethod,
      {
        request: this.request
      }
    )
    console.log('LEDGER RESPONSE', response)

    this.isLoading = false
    if (response.error) {
    } else {
      this.success = true
      setTimeout(() => {
        return this.dismiss(true)
      }, 2000)
    }
    this.cdr.detectChanges()
  }

  public async dismiss(closeParent: boolean = false): Promise<void> {
    await this.modalController.dismiss(closeParent)
  }
}
