import { Component, Input } from '@angular/core'
import { ToastController } from '@ionic/angular'
import { CopyService } from 'src/app/services/copy/copy.service'

@Component({
  selector: 'collapsable-json',
  templateUrl: './collapsable-json.component.html',
  styleUrls: ['./collapsable-json.component.scss']
})
export class CollapsableJSONComponent {
  @Input()
  public json: any | undefined

  constructor(private readonly copyService: CopyService, private readonly toastController: ToastController) {}

  copyToClipboard() {
    this.copyService.copyToClipboard(JSON.stringify(this.json))
    this.showToast()
  }

  async showToast() {
    const toast = await this.toastController.create({
      message: 'Copied to clipboard',
      duration: 2000
    })
    return toast.present()
  }
}
