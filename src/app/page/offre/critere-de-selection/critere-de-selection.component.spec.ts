import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CritereDeSelectionComponent } from './critere-de-selection.component';

describe('CritereDeSelectionComponent', () => {
  let component: CritereDeSelectionComponent;
  let fixture: ComponentFixture<CritereDeSelectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CritereDeSelectionComponent]
    });
    fixture = TestBed.createComponent(CritereDeSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
