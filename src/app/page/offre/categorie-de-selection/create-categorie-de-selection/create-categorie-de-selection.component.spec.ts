import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCategorieDeSelectionComponent } from './create-categorie-de-selection.component';

describe('CreateCategorieDeSelectionComponent', () => {
  let component: CreateCategorieDeSelectionComponent;
  let fixture: ComponentFixture<CreateCategorieDeSelectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CreateCategorieDeSelectionComponent]
    });
    fixture = TestBed.createComponent(CreateCategorieDeSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
