"use client";

import { useEffect, useState } from "react";

type CityItem = {
  id: number;
  name: string;
};

type Props = {
  cities: CityItem[];
  cityId: string;
  customCity: string;
  onCityIdChange: (value: string) => void;
  onCustomCityChange: (value: string) => void;
  label?: string;
  required?: boolean;
  selectId?: string;
  inputId?: string;
};

const CUSTOM_CITY_VALUE = "__custom__";

export function CityField({
  cities,
  cityId,
  customCity,
  onCityIdChange,
  onCustomCityChange,
  label = "Город",
  required = false,
  selectId = "city-select",
  inputId = "city-custom",
}: Props) {
  const [customMode, setCustomMode] = useState(
    !cityId && customCity.trim().length > 0,
  );

  useEffect(() => {
    if (cityId) {
      setCustomMode(false);
      return;
    }
    if (customCity.trim()) {
      setCustomMode(true);
    }
  }, [cityId, customCity]);

  return (
    <>
      <label className="label" htmlFor={selectId}>
        {label}
      </label>
      <select
        id={selectId}
        className="select"
        value={customMode ? CUSTOM_CITY_VALUE : cityId}
        onChange={(e) => {
          const value = e.target.value;
          if (value === CUSTOM_CITY_VALUE) {
            setCustomMode(true);
            onCityIdChange("");
            return;
          }
          setCustomMode(false);
          onCityIdChange(value);
          onCustomCityChange("");
        }}
        required={required && !customMode}
      >
        <option value="">Выберите город</option>
        {cities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}
          </option>
        ))}
        <option value={CUSTOM_CITY_VALUE}>Другого города нет в списке</option>
      </select>

      {customMode ? (
        <>
          <label className="label" htmlFor={inputId}>
            Новый город
          </label>
          <input
            id={inputId}
            className="input"
            value={customCity}
            onChange={(e) => {
              onCustomCityChange(e.target.value);
              if (cityId) onCityIdChange("");
            }}
            placeholder="Введите название города"
            required={required}
          />
          <p className="fileHint">
            Если города нет в списке, мы добавим его автоматически.
          </p>
        </>
      ) : null}
    </>
  );
}
