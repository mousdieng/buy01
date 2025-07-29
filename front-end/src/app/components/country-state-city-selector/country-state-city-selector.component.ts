import {Component, EventEmitter, forwardRef, Input, Output, OnInit} from '@angular/core';
import {Chip} from "primeng/chip";
import {DropdownModule} from "primeng/dropdown";
import {FormsModule, NG_VALUE_ACCESSOR} from "@angular/forms";
import {NgIf} from "@angular/common";
import {City, Country, State} from "country-state-city";
import {LocationSelection, ShippingAddress} from "../../types";

@Component({
  selector: 'app-country-state-city-selector',
  standalone: true,
  imports: [
    Chip,
    DropdownModule,
    FormsModule,
    NgIf
  ],
  templateUrl: './country-state-city-selector.component.html',
  styleUrl: './country-state-city-selector.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CountryStateCitySelectorComponent),
      multi: true
    }
  ]
})
export class CountryStateCitySelectorComponent implements OnInit {
  @Input() showLabels: boolean = true;
  @Input() showSelectedTags: boolean = true;
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() countryPlaceholder: string = '-- Select Your Country --';
  @Input() statePlaceholder: string = '-- Select Your State --';
  @Input() cityPlaceholder: string = '-- Select Your City --';
  @Input() showClearButtons: boolean = true;
  @Input() styleClass: string = '';
  @Input() panelStyleClass: string = '';

  @Output() countryChange = new EventEmitter<string>();
  @Output() stateChange = new EventEmitter<string>();
  @Output() cityChange = new EventEmitter<string>();
  @Output() selectionChange = new EventEmitter<Partial<LocationSelection>>();

  countries: any[] = [];
  states: any[] = [];
  cities: any[] = [];

  selectedCountry: any = null;
  selectedState: any = null;
  selectedCity: any = null;

  private onChange = (value: Partial<LocationSelection>) => {};
  private onTouched = () => {};

  ngOnInit(): void {
    this.countries = Country.getAllCountries().map(country => ({
      ...country,
      label: `${country.flag} ${country.name}`,
      value: country
    }));
  }

  onCountryChange(event: any): void {
    const selectedCountryData = event.value;

    if (selectedCountryData) {
      this.selectedCountry = selectedCountryData;
      this.loadStatesForCountry(selectedCountryData);
      this.countryChange.emit(this.selectedCountry.name);
    } else {
      this.selectedCountry = null;
      this.states = [];
    }

    this.selectedState = null;
    this.selectedCity = null;
    this.cities = [];

    this.emitValue();
  }

  onStateChange(event: any): void {
    const selectedStateData = event.value;

    if (selectedStateData && this.selectedCountry) {
      this.selectedState = selectedStateData;
      this.loadCitiesForState(this.selectedCountry, selectedStateData);
      this.stateChange.emit(this.selectedState.name);
    } else {
      this.selectedState = null;
      this.cities = [];
    }

    // Reset dependent selections
    this.selectedCity = null;

    this.emitValue();
  }

  onCityChange(event: any): void {
    const selectedCityData = event.value;

    if (selectedCityData) {
      this.selectedCity = selectedCityData;
      this.cityChange.emit(this.selectedCity.name);
    } else {
      this.selectedCity = null;
    }

    this.emitValue();
  }

  private loadStatesForCountry(country: any): void {
    this.states = State.getStatesOfCountry(country.isoCode).map(state => ({
      ...state,
      label: state.name,
      value: state
    }));
  }

  private loadCitiesForState(country: any, state: any): void {
    this.cities = City.getCitiesOfState(
        country.isoCode,
        state.isoCode
    ).map(city => ({
      ...city,
      label: city.name,
      value: city
    }));
  }

  clearCountry(): void {
    this.selectedCountry = null;
    this.selectedState = null;
    this.selectedCity = null;
    this.states = [];
    this.cities = [];
    this.emitValue();
  }

  clearState(): void {
    this.selectedState = null;
    this.selectedCity = null;
    this.cities = [];
    this.emitValue();
  }

  clearCity(): void {
    this.selectedCity = null;
    this.emitValue();
  }

  private emitValue(): void {
    const value: Partial<LocationSelection> = {
      country: { name: this.selectedCountry?.name || '', isoCode: this.selectedCountry?.isoCode},
      state: { name: this.selectedState?.name || '', isoCode: this.selectedState?.isoCode },
      city: { name: this.selectedCity?.name || '' }
    };

    const filteredValue: Partial<LocationSelection> = {};
    if (value.country) filteredValue.country = value.country;
    if (value.state) filteredValue.state = value.state;
    if (value.city) filteredValue.city = value.city;

    this.selectionChange.emit(filteredValue);
    this.onChange(filteredValue);
    this.onTouched();
  }
}