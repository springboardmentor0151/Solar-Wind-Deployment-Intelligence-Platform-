import { useEffect, useRef, useState } from "react";
import { searchPlaces } from "../../services/geocodingService";

export default function LocationSearchBar({ onPlaceSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Debounce so we don't hammer Nominatim on every keystroke — also
    // keeps us comfortably within their ~1 req/sec usage policy.
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const places = await searchPlaces(query);
        setResults(places);
        setShowResults(true);
      } catch (err) {
        console.error(err);
        setError("Search failed. Please try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Close the dropdown when clicking outside it.
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (place) => {
    setQuery(place.displayName);
    setShowResults(false);
    onPlaceSelect(place);
  };

  return (
    <div ref={containerRef} className="location-map-search">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setShowResults(true)}
        placeholder="Search for a city, state, or country..."
        className="location-map-search-input"
      />

      {loading && <div className="location-map-search-status">Searching...</div>}
      {error && <div className="location-map-search-status location-map-search-error">{error}</div>}

      {showResults && results.length > 0 && (
        <ul className="location-map-search-results">
          {results.map((place, index) => (
            <li
              key={index}
              className="location-map-search-result-item"
              onClick={() => handleSelect(place)}
            >
              {place.displayName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
