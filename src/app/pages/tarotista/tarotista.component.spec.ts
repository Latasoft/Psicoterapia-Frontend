import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarotistaComponent } from './tarotista.component';

describe('TarotistaComponent', () => {
  let component: TarotistaComponent;
  let fixture: ComponentFixture<TarotistaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarotistaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TarotistaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
