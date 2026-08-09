import { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import api from "../../services/api";

// ---------- Custom Icons ----------

const solarIcon = new L.Icon({
    iconUrl: "/markers/solar.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -40],
    shadowSize: [41, 41],
});

const windIcon = new L.Icon({
    iconUrl: "/markers/wind.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -40],
    shadowSize: [41, 41],
});

function SiteMap() {
    const [sites, setSites] = useState([]);

    useEffect(() => {
        fetchSites();
    }, []);

    const fetchSites = async () => {
        try {
            const response = await api.get("/sites/");
            setSites(response.data);
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <MapContainer
            center={[20.2961, 85.8245]}
            zoom={7}
            scrollWheelZoom={true}
            className="h-[500px] w-full rounded-2xl"
        >
            <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {sites.map((site) => (
                <Marker
                    key={site.id}
                    position={[site.latitude, site.longitude]}
                    icon={
                        site.energy_type === "Solar"
                            ? solarIcon
                            : windIcon
                    }
                >
                    <Popup>
                        <div className="space-y-2">
                            <h3 className="font-bold text-lg">
                                {site.site_name}
                            </h3>

                            <p>
                                <strong>Energy:</strong>{" "}
                                {site.energy_type}
                            </p>

                            <p>
                                <strong>Status:</strong>{" "}
                                {site.status}
                            </p>

                            <p>
                                <strong>Location:</strong>
                                <br />
                                {site.district}, {site.state}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}

export default SiteMap;