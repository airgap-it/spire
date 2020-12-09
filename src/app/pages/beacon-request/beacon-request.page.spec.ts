import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { BeaconRequestPage } from './beacon-request.page'

describe('BeaconRequestPage', () => {
  let component: BeaconRequestPage
  let fixture: ComponentFixture<BeaconRequestPage>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [BeaconRequestPage],
      imports: [IonicModule.forRoot()]
    }).compileComponents()

    fixture = TestBed.createComponent(BeaconRequestPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
