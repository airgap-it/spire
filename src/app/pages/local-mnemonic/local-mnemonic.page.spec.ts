import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { LocalMnemonicPage } from './local-mnemonic.page'

describe('ListPage', () => {
  let component: LocalMnemonicPage
  let fixture: ComponentFixture<LocalMnemonicPage>
  let listPage: HTMLElement

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LocalMnemonicPage],
      imports: [IonicModule.forRoot()]
    }).compileComponents()

    fixture = TestBed.createComponent(LocalMnemonicPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have a list of 10 elements', () => {
    listPage = fixture.nativeElement
    const items = listPage.querySelectorAll('ion-item')
    expect(items.length).toEqual(10)
  })
})
