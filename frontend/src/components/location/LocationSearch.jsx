import { useCallback, useEffect, useState } from "react";
import { Search, MapPin } from "lucide-react";

export default function LocationSearch({
    onLocationSelect,
}) {

    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const searchLocation = useCallback(async () => {

        if (query.length < 3) return;

        try {

            setLoading(true);

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
            );

            const data = await response.json();

            setResults(data);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    }, [query]);

    useEffect(() => {

        if (query.length < 3) {
            setResults([]);
            return;
        }

        const timer = setTimeout(() => {
            searchLocation();
        }, 500);

        return () => clearTimeout(timer);

    }, [query, searchLocation]);

    const selectLocation = (location) => {

        setQuery(location.display_name);
        setResults([]);

        if (onLocationSelect) {

            onLocationSelect({
                latitude: Number(location.lat),
                longitude: Number(location.lon),
                name: location.display_name,
            });

        }

    };

    return (

        <div className="relative">

            <div className="relative">

                <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                    type="text"
                    placeholder="Search any location..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 py-3 pl-11 pr-4 text-white outline-none focus:border-cyan-500"
                />

            </div>

            {loading && (

                <div className="mt-3 text-cyan-400">
                    Searching...
                </div>

            )}

            {results.length > 0 && (

                <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 shadow-xl overflow-hidden">

                    {results.map((item) => (

                        <button
                            key={item.place_id}
                            onClick={() => selectLocation(item)}
                            className="flex w-full items-start gap-3 border-b border-slate-800 p-4 text-left hover:bg-slate-800"
                        >

                            <MapPin
                                className="mt-1 text-cyan-400"
                                size={18}
                            />

                            <span className="text-sm text-white">
                                {item.display_name}
                            </span>

                        </button>

                    ))}

                </div>

            )}

        </div>

    );

}
