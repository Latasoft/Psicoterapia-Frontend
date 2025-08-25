import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCitasComponent } from './admin-citas.component';

describe('AdminCitasComponent', () => {
  let component: AdminCitasComponent;
  let fixture: ComponentFixture<AdminCitasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCitasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCitasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
