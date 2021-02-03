import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { AddWalletConnectionPage } from './add-wallet-connection.page'

describe('AddWalletConnectionPage', () => {
  let component: AddWalletConnectionPage
  let fixture: ComponentFixture<AddWalletConnectionPage>

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [AddWalletConnectionPage],
        imports: [IonicModule.forRoot()]
      }).compileComponents()

      fixture = TestBed.createComponent(AddWalletConnectionPage)
      component = fixture.componentInstance
      fixture.detectChanges()
    })
  )

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
