import React from 'react';
import { AsyncPaginate } from 'react-select-async-paginate';

export default function RegionSearch({ onSelect }) {
    const loadOptions = async (inputValue) => {
        if (!inputValue || inputValue.trim() === "") {
            return { options: [], hasMore: false };
        }
        
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(inputValue)}&format=json&addressdetails=1&limit=5`
            );
            const data = await response.json();
            
            if (!Array.isArray(data)) {
                return { options: [], hasMore: false };
            }

            const options = data.map(item => ({
                label: String(item.display_name || "Unknown location"),
                value: String(item.display_name || ""),
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon), 
                lon: parseFloat(item.lon)
            }));

            return {
                options: options,
                hasMore: false,
            };
        } catch (err) {
            console.error("Region search error:", err);
            return { options: [], hasMore: false };
        }
    };

    return (
        <AsyncPaginate
            placeholder="Search for a region..."
            loadOptions={loadOptions}
            onChange={(option) => {
                if (option) {
                    onSelect({
                        label: option.label,
                        lat: option.lat,
                        lng: option.lng || option.lon
                    });
                } else {
                    onSelect(null);
                }
            }}
            formatOptionLabel={(option) => typeof option.label === 'string' ? option.label : JSON.stringify(option.label)}
            isClearable
        />
    );
}