import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagoKlapComponent } from './pago-klap.component';

describe('PagoKlapComponent', () => {
  let component: PagoKlapComponent;
  let fixture: ComponentFixture<PagoKlapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagoKlapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PagoKlapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
