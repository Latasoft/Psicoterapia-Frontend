import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminTallerComponent } from './admin-taller.component';

describe('AdminTallerComponent', () => {
  let component: AdminTallerComponent;
  let fixture: ComponentFixture<AdminTallerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTallerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminTallerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
