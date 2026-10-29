/// <reference types="vite/client" />
interface ImportMetaEnv {
    readonly VITE_SKYCROP_API_URL: string;
    readonly VITE_GEOCODING_URL: string;
    readonly VITE_MAP_TILE_URL: string;
    readonly VITE_PRIME_UI_LICENSE_KEY: string;
    readonly VITE_SKYCROP_DIAGNOSES_ENDPOINT_PATH: string;
    readonly VITE_SKYCROP_PLOTS_ENDPOINT_PATH: string;
    readonly VITE_SKYCROP_CROPS_ENDPOINT_PATH: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
