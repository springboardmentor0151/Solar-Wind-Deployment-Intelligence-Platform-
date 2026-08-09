import React from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function RecenterMap({ center }) {
    const map = useMap();
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
        map.setView(center, map.getZoom());
    }
    return null;
}

export default function MapComponent({ lat, lng }) {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    const hasValidCoords = !isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat !== 0 && parsedLng !== 0;
    const position = hasValidCoords ? [parsedLat, parsedLng] : [0, 0];

    return (
        <MapContainer 
            key={`${parsedLat}-${parsedLng}`} 
            center={position} 
            zoom={hasValidCoords ? 11 : 2} 
            style={{ height: "350px", width: "100%" }}
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {hasValidCoords && <Marker position={position} />}
            {hasValidCoords && <RecenterMap center={position} />}
        </MapContainer>
    );
}