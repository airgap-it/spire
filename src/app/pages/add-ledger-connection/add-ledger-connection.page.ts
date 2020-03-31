import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { SigningMethodService, SigningMethod } from 'src/app/services/signing-method.service';
import { ModalController } from '@ionic/angular';
import { Methods } from 'src/extension/Methods';

@Component({
	selector: 'app-add-ledger-connection',
	templateUrl: './add-ledger-connection.page.html',
	styleUrls: ['./add-ledger-connection.page.scss'],
})
export class AddLedgerConnectionPage implements OnInit {
	public isLoading: boolean = true
	public address: string = ''
	public error: string = ''

	constructor(private readonly modalController: ModalController, private readonly signingMethodService: SigningMethodService, private readonly cdr: ChangeDetectorRef) { }

	ngOnInit() {
		this.connect()
	}

	public async connect(): Promise<void> {
		this.isLoading = true

		chrome.runtime.sendMessage({ method: 'toBackground', type: Methods.LEDGER_INIT }, response => {
			console.log('LEDGER RESPONSE', response)
			this.isLoading = false
			if (response.error) {

			} else {
				this.address = response.address
				this.signingMethodService.setSigningMethod(SigningMethod.LEDGER)
				setTimeout(() => {
					this.dismiss(true)
				}, 1000)
			}
			this.cdr.detectChanges()
		})
	}

	public async dismiss(closeParent = false): Promise<void> {
		await this.modalController.dismiss(closeParent)
	}

}
