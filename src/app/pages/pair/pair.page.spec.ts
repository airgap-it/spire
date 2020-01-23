import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { PairPage } from './pair.page'

describe('PairPage', () => {
  let component: PairPage
  let fixture: ComponentFixture<PairPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PairPage],
      imports: [IonicModule.forRoot()]
    }).compileComponents()

    fixture = TestBed.createComponent(PairPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
