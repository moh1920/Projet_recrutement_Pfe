import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategorieDeSelectionComponent } from './categorie-de-selection.component';

describe('CategorieDeSelectionComponent', () => {
  let component: CategorieDeSelectionComponent;
  let fixture: ComponentFixture<CategorieDeSelectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CategorieDeSelectionComponent]
    });
    fixture = TestBed.createComponent(CategorieDeSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
