import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { WalletSelectPage } from '../wallet-select.page'

describe('WalletSelectPage', () => {
  let component: WalletSelectPage
  let fixture: ComponentFixture<WalletSelectPage>

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [WalletSelectPage],
        imports: [IonicModule.forRoot()]
      }).compileComponents()

      fixture = TestBed.createComponent(WalletSelectPage)
      component = fixture.componentInstance
      fixture.detectChanges()
    })
  )

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
