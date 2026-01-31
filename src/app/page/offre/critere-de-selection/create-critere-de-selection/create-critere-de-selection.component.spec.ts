import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCritereDeSelectionComponent } from './create-critere-de-selection.component';

describe('CreateCritereDeSelectionComponent', () => {
  let component: CreateCritereDeSelectionComponent;
  let fixture: ComponentFixture<CreateCritereDeSelectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CreateCritereDeSelectionComponent]
    });
    fixture = TestBed.createComponent(CreateCritereDeSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
