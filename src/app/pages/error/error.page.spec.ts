import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { ErrorPage } from './error.page'

describe('ErrorPage', () => {
  let component: ErrorPage
  let fixture: ComponentFixture<ErrorPage>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ErrorPage],
      imports: [IonicModule.forRoot()]
    }).compileComponents()

    fixture = TestBed.createComponent(ErrorPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
