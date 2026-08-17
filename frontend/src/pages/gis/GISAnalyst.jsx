import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MapPin, Search, X, Plus, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Input from "../../components/ui/Input.jsx";
import Textarea from "../../components/ui/Textarea.jsx";
import Button from "../../components/ui/Button.jsx";
import { getGisSites, enrichCoordinates, reverseGeocode } from "../../api/gisApi.js";
import { createSite } from "../../api/siteApi.js";
import { getSiteEnvironment } from "../../api/environmentApi.js";
import { formatNumber } from "../../utils/formatters.js";
import { Link } from "react-router-dom";
import { extractErrorMessage } from "../../api/axiosClient.js";

// Default Leaflet marker icons don't resolve correctly under Vite's bundler
// without this explicit reassignment.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

const selectedLocationIcon = L.divIcon({
  className: "gis-selected-marker",
  html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#2563eb;border:3px solid white;box-shadow:0 1px 5px rgba(0,0,0,.35);transform:rotate(-45deg)"><span style="display:block;width:6px;height:6px;border-radius:50%;background:white;position:absolute;top:5px;left:5px"></span></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

function FitToFeatures({ features }) {
  const map = useMap();
  useEffect(() => {
    if (!features?.length) return;
    const bounds = L.latLngBounds(
      features.map((f) => [f.geometry.coordinates[1], f.geometry.coordinates[0]])
    );
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.2));
  }, [features, map]);
  return null;
}

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function MapRecenter({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location) map.flyTo(location, Math.max(map.getZoom(), 10), { duration: 0.6 });
  }, [location, map]);
  return null;
}

export default function GISAnalyst() {
  const queryClient = useQueryClient();
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [gisResult, setGisResult] = useState(null);
  const [gisError, setGisError] = useState(null);
  const [resolvedRegion, setResolvedRegion] = useState("");
  const [regionLoading, setRegionLoading] = useState(false);
  const [siteForm, setSiteForm] = useState({
    name: "",
    description: "",
    region: "",
    land_area: "",
    existing_infrastructure: "",
  });

  const { data: collection, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["gis-sites"],
    queryFn: getGisSites,
  });

  const { data: selectedSite, isLoading: siteLoading } = useQuery({
    queryKey: ["site", selectedSiteId],
    queryFn: () => getSite(selectedSiteId),
    enabled: Boolean(selectedSiteId),
  });

  const { data: selectedSiteEnvironment, isLoading: environmentLoading } = useQuery({
    queryKey: ["site-environment", selectedSiteId],
    queryFn: () => getSiteEnvironment(selectedSiteId),
    enabled: Boolean(selectedSiteId),
  });

  const createSiteMutation = useMutation({
    mutationFn: createSite,
    onSuccess: (site) => {
      toast.success("Pre-project site created — GIS enrichment complete");
      queryClient.invalidateQueries({ queryKey: ["gis-sites"] });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      setSelectedSiteId(site.id);
      setGisResult(site);
      setSelectedLocation([site.latitude, site.longitude]);
      setSiteForm({
        name: "",
        description: "",
        region: "",
        land_area: "",
        existing_infrastructure: "",
      });
    },
    onError: (mutationError) => toast.error(extractErrorMessage(mutationError)),
  });

  const features = collection?.features || [];

  const selectLocation = (lat, lng) => {
    const normalizedLat = Number(lat);
    const normalizedLng = Number(lng);
    if (!Number.isFinite(normalizedLat) || !Number.isFinite(normalizedLng)) return;
    if (normalizedLat < -90 || normalizedLat > 90 || normalizedLng < -180 || normalizedLng > 180) return;
    setSelectedLocation([normalizedLat, normalizedLng]);
    setLatitude(normalizedLat.toFixed(6));
    setLongitude(normalizedLng.toFixed(6));
    setGisResult(null);
    setGisError(null);
    setSelectedSiteId(null);
    setResolvedRegion("");
  };

  const analyzeLocation = async () => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      setGisError("Enter a valid latitude (-90 to 90) and longitude (-180 to 180).");
      return;
    }

    setGisError(null);
    setGisResult(null);
    setSelectedSiteId(null);
    setSelectedLocation([lat, lng]);
    setResolvedRegion("");
    setRegionLoading(true);

    try {
      // GIS enrichment remains authoritative from the Phase-7 backend.
      // Reverse geocoding is only used to identify the human-readable region
      // for the analyst and to pre-fill the pre-project Site form.
      const [result, location] = await Promise.all([
        enrichCoordinates({ latitude: lat, longitude: lng }),
        reverseGeocode({ latitude: lat, longitude: lng }),
      ]);

      setGisResult(result);
      setResolvedRegion(location.region || location.displayName || "");
      setSiteForm((current) => ({
        ...current,
        region: location.region || current.region,
      }));
    } catch (err) {
      // If GIS enrichment itself failed, show the backend error.
      // If only reverse geocoding failed, retain the GIS result and let the
      // analyst enter the region manually.
      if (err?.response || err?.isAxiosError) {
        setGisError(extractErrorMessage(err));
      } else {
        try {
          const result = await enrichCoordinates({ latitude: lat, longitude: lng });
          setGisResult(result);
          setGisError("Location analyzed, but the region name could not be resolved automatically. You can enter it manually.");
        } catch (backendErr) {
          setGisError(extractErrorMessage(backendErr));
        }
      }
    } finally {
      setRegionLoading(false);
    }
  };

  const createPreProjectSite = () => {
    if (!gisResult) return;
    if (!siteForm.name.trim()) {
      toast.error("Enter a site name before creating the pre-project site.");
      return;
    }

    const lat = selectedLocation?.[0] ?? Number(latitude);
    const lng = selectedLocation?.[1] ?? Number(longitude);

    createSiteMutation.mutate({
      name: siteForm.name.trim(),
      description: siteForm.description.trim() || undefined,
      latitude: lat,
      longitude: lng,
      region: siteForm.region.trim() || undefined,
      land_area: siteForm.land_area === "" ? undefined : Number(siteForm.land_area),
      existing_infrastructure:
        siteForm.existing_infrastructure.trim() || gisResult.existing_infrastructure || undefined,
      project_id: null,
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="GIS Analysis"
        description="Explore a location by clicking the map or entering coordinates, review GIS enrichment, then create a pre-project site for downstream planning."
      />

      <Card>
        <CardHeader>
          <CardTitle>Location Explorer</CardTitle>
          <p className="text-xs text-ink-faint">
            Click anywhere on the map to place a temporary analysis marker. Existing site markers remain separate.
          </p>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <Input
              label="Latitude"
              type="number"
              step="any"
              value={latitude}
              min="-90"
              max="90"
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="21.1458"
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              value={longitude}
              min="-180"
              max="180"
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="79.0882"
            />
            <Button type="button" size="sm" onClick={analyzeLocation} isLoading={false}>
              <Search className="h-4 w-4" /> Analyze location
            </Button>
          </div>
          {gisError && <p className="text-xs text-danger-600">{gisError}</p>}
          {selectedLocation && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs">
              <span className="flex items-center gap-2 font-medium text-ink">
                <MapPin className="h-4 w-4 text-brand-700" />
                Selected: {selectedLocation[0].toFixed(6)}, {selectedLocation[1].toFixed(6)}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedLocation(null);
                  setLatitude("");
                  setLongitude("");
                  setGisResult(null);
                  setGisError(null);
                  setResolvedRegion("");
                  setRegionLoading(false);
                }}
                className="text-ink-faint hover:text-ink"
              >
                Clear selection
              </button>
            </div>
          )}
          {(regionLoading || resolvedRegion) && (
            <div className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-faint">Detected region</span>
                <span className="text-right font-semibold text-ink">
                  {regionLoading ? "Determining location..." : resolvedRegion}
                </span>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      )}
      {isError && <ErrorState error={error} onRetry={refetch} />}

      {collection && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="h-[560px] overflow-hidden lg:col-span-2">
            <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onSelect={selectLocation} />
              <MapRecenter location={selectedLocation} />
              {!selectedLocation && <FitToFeatures features={features} />}

              {features.map((feature) => {
                const [lng, lat] = feature.geometry.coordinates;
                return (
                  <Marker
                    key={feature.id}
                    position={[lat, lng]}
                    eventHandlers={{ click: () => setSelectedSiteId(feature.id) }}
                  >
                    <Popup>
                      <div className="text-xs">
                        <p className="font-semibold">{feature.properties?.popup?.title}</p>
                        <p className="text-ink-faint">{lat.toFixed(4)}, {lng.toFixed(4)}</p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {selectedLocation && (
                <Marker position={selectedLocation} icon={selectedLocationIcon}>
                  <Popup>
                    <div className="text-xs">
                      <p className="font-semibold">Selected analysis location</p>
                      <p>{selectedLocation[0].toFixed(6)}, {selectedLocation[1].toFixed(6)}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>GIS Enrichment</CardTitle>
                {selectedSiteId && (
                  <button
                    onClick={() => setSelectedSiteId(null)}
                    className="rounded-md p-1 text-ink-faint hover:bg-surface-muted"
                    aria-label="Clear site selection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </CardHeader>
              <CardBody className="max-h-[490px] overflow-y-auto">
                {!gisResult && !selectedSiteId && (
                  <p className="text-sm text-ink-faint">
                    Select a location and click <strong>Analyze location</strong>, or select an existing site marker.
                  </p>
                )}

                {selectedSiteId && siteLoading && <div className="flex justify-center py-8"><Spinner /></div>}

                {selectedSite && (
                  <GisDetails site={selectedSite} />
                )}

                {gisResult && !selectedSiteId && (
                  <GisDetails site={gisResult} />
                )}
              </CardBody>
            </Card>

            {gisResult && !selectedSiteId && (
              <Card>
                <CardHeader>
                  <CardTitle>Create Pre-Project Site</CardTitle>
                  <p className="text-xs text-ink-faint">This site will be created with project_id = null.</p>
                </CardHeader>
                <CardBody className="space-y-3">
                  <Input
                    label="Site name"
                    value={siteForm.name}
                    onChange={(e) => setSiteForm((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Nagpur Renewable Candidate Site"
                  />
                  <Input
                    label="Region"
                    value={siteForm.region}
                    hint={resolvedRegion ? "Automatically detected from the selected coordinates." : undefined}
                    onChange={(e) => setSiteForm((s) => ({ ...s, region: e.target.value }))}
                    placeholder="Nagpur, Maharashtra"
                  />
                  <Input
                    label="Land area (hectares)"
                    type="number"
                    step="any"
                    value={siteForm.land_area}
                    onChange={(e) => setSiteForm((s) => ({ ...s, land_area: e.target.value }))}
                    placeholder="Optional"
                  />
                  <Textarea
                    label="Description"
                    value={siteForm.description}
                    onChange={(e) => setSiteForm((s) => ({ ...s, description: e.target.value }))}
                    placeholder="Site identified during GIS spatial exploration"
                  />
                  <Textarea
                    label="Existing infrastructure"
                    value={siteForm.existing_infrastructure}
                    onChange={(e) => setSiteForm((s) => ({ ...s, existing_infrastructure: e.target.value }))}
                    placeholder="Optional — defaults to GIS-enriched infrastructure"
                  />
                  <Button
                    type="button"
                    className="w-full"
                    onClick={createPreProjectSite}
                    isLoading={createSiteMutation.isPending}
                  >
                    <Plus className="h-4 w-4" /> Create pre-project site
                  </Button>
                </CardBody>
              </Card>
            )}

            {selectedSiteId && selectedSiteEnvironment && (
              <EnvironmentSummary data={selectedSiteEnvironment} loading={environmentLoading} />
            )}
            {selectedSiteId && environmentLoading && (
              <Card><CardBody><div className="flex justify-center py-6"><Spinner /></div></CardBody></Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GisDetails({ site }) {
  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="font-semibold text-ink">{site.name || "Selected location"}</p>
        {site.land_use && <Badge tone="info" className="mt-1">{site.land_use}</Badge>}
      </div>
      <Detail label="Latitude" value={fmtRaw(site.latitude)} />
      <Detail label="Longitude" value={fmtRaw(site.longitude)} />
      <Detail label="Elevation" value={fmtM(site.elevation)} />
      <Detail label="Land slope" value={fmtRaw(site.land_slope)} />
      <Detail label="Vegetation index" value={fmtRaw(site.vegetation_index)} />
      <Detail label="Road distance" value={fmtM(site.road_distance)} />
      <Detail label="Substation distance" value={fmtM(site.nearest_substation_distance)} />
      <Detail label="Transmission line distance" value={fmtM(site.nearest_transmission_line_distance)} />
      <Detail label="Water body distance" value={fmtM(site.water_body_distance)} />
      <Detail label="Protected area distance" value={fmtM(site.protected_area_distance)} />
      {site.existing_infrastructure && (
        <div className="rounded-md bg-surface-muted p-2 text-xs text-ink-subtle">
          <span className="font-medium text-ink">Infrastructure:</span> {site.existing_infrastructure}
        </div>
      )}
      {site.id && (
        <Link to={`/sites/${site.id}`} className="mt-2 inline-block text-xs font-medium text-brand-700 hover:underline">
          Open full site page →
        </Link>
      )}
    </div>
  );
}

function EnvironmentSummary({ data, loading }) {
  if (loading) return null;
  const weather = data?.weather || {};
  const solar = data?.solar || {};
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Environmental snapshot</CardTitle>
      </CardHeader>
      <CardBody className="space-y-2 text-sm">
        <Detail label="Temperature" value={weather.temperature != null ? `${weather.temperature} °C` : "—"} />
        <Detail label="Humidity" value={weather.humidity != null ? `${weather.humidity}%` : "—"} />
        <Detail label="Rainfall" value={weather.rainfall != null ? `${weather.rainfall} mm` : "—"} />
        <Detail label="Wind speed" value={weather.wind_speed != null ? `${weather.wind_speed} m/s` : "—"} />
        <Detail label="GHI" value={solar.ghi != null ? formatNumber(solar.ghi, { maximumFractionDigits: 2 }) : "—"} />
        <Detail label="DNI" value={solar.dni != null ? formatNumber(solar.dni, { maximumFractionDigits: 2 }) : "—"} />
        <Detail label="DHI" value={solar.dhi != null ? formatNumber(solar.dhi, { maximumFractionDigits: 2 }) : "—"} />
      </CardBody>
    </Card>
  );
}

function fmtM(v) {
  return v != null ? `${formatNumber(v)} km` : "—";
}

function fmtRaw(v) {
  return v != null ? formatNumber(v, { maximumFractionDigits: 4 }) : "—";
}

function Detail({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-1.5 last:border-0">
      <span className="text-ink-faint">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}
