import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { AddLedgerConnectionPage } from './add-ledger-connection.page'

describe('AddLedgerConnectionPage', () => {
  let component: AddLedgerConnectionPage
  let fixture: ComponentFixture<AddLedgerConnectionPage>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AddLedgerConnectionPage],
      imports: [IonicModule.forRoot()]
    }).compileComponents()

    fixture = TestBed.createComponent(AddLedgerConnectionPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
