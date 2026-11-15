/// <reference types="vite/client" />
interface ImportMetaEnv {
    readonly VITE_SKYCROP_API_URL: string;
    readonly VITE_GEOCODING_URL: string;
    readonly VITE_MAP_TILE_URL: string;
    readonly VITE_PRIME_UI_LICENSE_KEY: string;
    readonly VITE_SKYCROP_DIAGNOSES_ENDPOINT_PATH: string;
    readonly VITE_SKYCROP_PLOTS_ENDPOINT_PATH: string;
    readonly VITE_SKYCROP_CROPS_ENDPOINT_PATH: string;
    readonly VITE_SKYCROP_DRONES_ENDPOINT_PATH: string;
    readonly VITE_SKYCROP_FLIGHTS_ENDPOINT_PATH: string;
    readonly VITE_SKYCROP_FLIGHT_ROUTES_ENDPOINT_PATH: string;
    readonly VITE_SKYCROP_AERIAL_IMAGES_ENDPOINT_PATH: string;
    readonly VITE_SKYCROP_REPORTS_ENDPOINT_PATH: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
