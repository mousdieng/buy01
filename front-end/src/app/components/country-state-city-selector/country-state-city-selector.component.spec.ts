import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CountryStateCitySelectorComponent } from './country-state-city-selector.component';

describe('CountryStateCitySelectorComponent', () => {
  let component: CountryStateCitySelectorComponent;
  let fixture: ComponentFixture<CountryStateCitySelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountryStateCitySelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CountryStateCitySelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
