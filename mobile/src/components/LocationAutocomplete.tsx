import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Country, State, City } from 'country-state-city';

interface LocationAutocompleteProps {
  country: string;
  setCountry: (val: string) => void;
  state: string;
  setState: (val: string) => void;
  city: string;
  setCity: (val: string) => void;
}

export function LocationAutocomplete({
  country,
  setCountry,
  state,
  setState,
  city,
  setCity
}: LocationAutocompleteProps) {
  const [activeField, setActiveField] = useState<'country' | 'state' | 'city' | null>(null);
  
  const [countrySuggestions, setCountrySuggestions] = useState<any[]>([]);
  const [stateSuggestions, setStateSuggestions] = useState<any[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);

  // We keep track of the selected isoCodes to filter states and cities
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('');
  const [selectedStateCode, setSelectedStateCode] = useState<string>('');

  const allCountries = useRef(Country.getAllCountries());

  useEffect(() => {
    if (activeField === 'country') {
      if (!country) {
        setCountrySuggestions(allCountries.current);
      } else {
        setCountrySuggestions(
          allCountries.current.filter(c => c.name.toLowerCase().includes(country.toLowerCase()))
        );
      }
    }
  }, [country, activeField]);

  useEffect(() => {
    if (activeField === 'state') {
      if (!selectedCountryCode) {
        setStateSuggestions([]);
        return;
      }
      const states = State.getStatesOfCountry(selectedCountryCode);
      if (!state) {
        setStateSuggestions(states);
      } else {
        setStateSuggestions(
          states.filter(s => s.name.toLowerCase().includes(state.toLowerCase()))
        );
      }
    }
  }, [state, activeField, selectedCountryCode]);

  useEffect(() => {
    if (activeField === 'city') {
      if (!selectedCountryCode || !selectedStateCode) {
        setCitySuggestions([]);
        return;
      }
      const cities = City.getCitiesOfState(selectedCountryCode, selectedStateCode);
      if (!city) {
        setCitySuggestions(cities.slice(0, 50)); // cap at 50 to avoid lag
      } else {
        setCitySuggestions(
          cities.filter(c => c.name.toLowerCase().includes(city.toLowerCase())).slice(0, 50)
        );
      }
    }
  }, [city, activeField, selectedCountryCode, selectedStateCode]);

  const handleCountrySelect = (c: any) => {
    setCountry(c.name);
    setSelectedCountryCode(c.isoCode);
    setActiveField(null);
    Keyboard.dismiss();
    // Reset lower fields
    setState('');
    setSelectedStateCode('');
    setCity('');
  };

  const handleStateSelect = (s: any) => {
    setState(s.name);
    setSelectedStateCode(s.isoCode);
    setActiveField(null);
    Keyboard.dismiss();
    // Reset lower field
    setCity('');
  };

  const handleCitySelect = (c: any) => {
    setCity(c.name);
    setActiveField(null);
    Keyboard.dismiss();
  };

  return (
    <View className="mb-4 relative z-50">
      <Text className="text-rawbin-text font-nunito-bold text-xs uppercase ml-1 mb-2">Location</Text>
      
      {/* COUNTRY */}
      <View className="bg-rawbin-card rounded-t-[16px] px-4 py-3 border border-[rgba(0,0,0,0.06)] border-b-0 flex-row items-center shadow-inner relative z-50">
        <Ionicons name="earth-outline" size={20} color="#744107" />
        <TextInput 
          className="flex-1 ml-3 text-rawbin-text font-nunito-bold"
          placeholder="Country"
          placeholderTextColor="#a69d92"
          value={country}
          onChangeText={(txt) => {
            setCountry(txt);
            // If they type manually instead of selecting, we clear the strict code so states filter resets unless matched
            const matched = allCountries.current.find(c => c.name.toLowerCase() === txt.toLowerCase());
            setSelectedCountryCode(matched ? matched.isoCode : '');
          }}
          onFocus={() => setActiveField('country')}
        />
      </View>

      {/* STATE */}
      <View className="bg-rawbin-card px-4 py-3 border border-[rgba(0,0,0,0.06)] border-b-0 flex-row items-center shadow-inner relative z-40">
        <Ionicons name="map-outline" size={20} color="#744107" />
        <TextInput 
          className="flex-1 ml-3 text-rawbin-text font-nunito-bold"
          placeholder="State / Province"
          placeholderTextColor="#a69d92"
          value={state}
          onChangeText={(txt) => {
            setState(txt);
            if (selectedCountryCode) {
              const matched = State.getStatesOfCountry(selectedCountryCode).find(s => s.name.toLowerCase() === txt.toLowerCase());
              setSelectedStateCode(matched ? matched.isoCode : '');
            }
          }}
          onFocus={() => setActiveField('state')}
        />
      </View>

      {/* CITY */}
      <View className="bg-rawbin-card rounded-b-[16px] px-4 py-3 border border-[rgba(0,0,0,0.06)] flex-row items-center shadow-inner relative z-30">
        <Ionicons name="location-outline" size={20} color="#744107" />
        <TextInput 
          className="flex-1 ml-3 text-rawbin-text font-nunito-bold"
          placeholder="City"
          placeholderTextColor="#a69d92"
          value={city}
          onChangeText={setCity}
          onFocus={() => setActiveField('city')}
        />
      </View>

      {/* DROPDOWN OVERLAY (Absolutely positioned to overlap the rest of the form) */}
      {activeField && (
        <View className="absolute top-full left-0 right-0 bg-white border border-[rgba(0,0,0,0.06)] rounded-b-[16px] shadow-lg max-h-48 z-50">
          {activeField === 'country' && countrySuggestions.length > 0 && (
            <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
              {countrySuggestions.map((item) => (
                <TouchableOpacity key={item.isoCode} className="px-4 py-3 border-b border-[rgba(0,0,0,0.03)]" onPress={() => handleCountrySelect(item)}>
                  <Text className="text-rawbin-text font-nunito-bold">{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {activeField === 'state' && stateSuggestions.length > 0 && (
            <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
              {stateSuggestions.map((item) => (
                <TouchableOpacity key={item.isoCode} className="px-4 py-3 border-b border-[rgba(0,0,0,0.03)]" onPress={() => handleStateSelect(item)}>
                  <Text className="text-rawbin-text font-nunito-bold">{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {activeField === 'city' && citySuggestions.length > 0 && (
            <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
              {citySuggestions.map((item, index) => (
                <TouchableOpacity key={item.name + index} className="px-4 py-3 border-b border-[rgba(0,0,0,0.03)]" onPress={() => handleCitySelect(item)}>
                  <Text className="text-rawbin-text font-nunito-bold">{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          
          {/* Helpful prompts if arrays are empty */}
          {activeField === 'state' && !selectedCountryCode && (
             <Text className="px-4 py-3 text-rawbin-subtext font-nunito-bold italic text-xs">Please select a country first to see states.</Text>
          )}
          {activeField === 'city' && (!selectedCountryCode || !selectedStateCode) && (
             <Text className="px-4 py-3 text-rawbin-subtext font-nunito-bold italic text-xs">Please select a state first to see cities.</Text>
          )}
        </View>
      )}

    </View>
  );
}
