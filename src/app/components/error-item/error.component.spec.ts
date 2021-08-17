import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideMockStore } from '@ngrx/store/testing'
import { Actions } from '@ngrx/effects'
import { EMPTY } from 'rxjs'

import { initialState as appInitialState } from '../../app.reducer'
import { ErrorItemComponent } from './error.component'

describe('ErrorComponent', () => {
  let component: ErrorItemComponent
  let fixture: ComponentFixture<ErrorItemComponent>
  const initialState = { app: appInitialState }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideMockStore({ initialState }),
        { provide: Actions, useValue: EMPTY },
      ],
      declarations: [ErrorItemComponent],
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(ErrorItemComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
