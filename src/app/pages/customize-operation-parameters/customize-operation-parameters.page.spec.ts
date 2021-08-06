import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { CustomizeOperationParametersPage } from './customize-operation-parameters.page';

describe('CustomizeOperationParametersPage', () => {
  let component: CustomizeOperationParametersPage;
  let fixture: ComponentFixture<CustomizeOperationParametersPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomizeOperationParametersPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomizeOperationParametersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
