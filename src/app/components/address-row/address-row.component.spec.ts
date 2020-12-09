import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { AddressRowComponent } from './address-row.component'

describe('AddressRowComponent', () => {
  let component: AddressRowComponent
  let fixture: ComponentFixture<AddressRowComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AddressRowComponent],
      imports: [IonicModule.forRoot()]
    }).compileComponents()

    fixture = TestBed.createComponent(AddressRowComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
