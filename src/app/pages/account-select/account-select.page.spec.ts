import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { AccountSelectPage } from './account-select.page'

describe('AccountSelectPage', () => {
  let component: AccountSelectPage
  let fixture: ComponentFixture<AccountSelectPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AccountSelectPage],
      imports: [IonicModule.forRoot()]
    }).compileComponents()

    fixture = TestBed.createComponent(AccountSelectPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
