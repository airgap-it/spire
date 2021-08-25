import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { CollapsableJSONComponent } from './collapsable-json.component'

describe('SimulationPreviewComponent', () => {
  let component: CollapsableJSONComponent
  let fixture: ComponentFixture<CollapsableJSONComponent>

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [CollapsableJSONComponent],
        imports: [IonicModule.forRoot()]
      }).compileComponents()

      fixture = TestBed.createComponent(CollapsableJSONComponent)
      component = fixture.componentInstance
      fixture.detectChanges()
    })
  )

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
