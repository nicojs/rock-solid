import { httpClient } from './http-client';

let mapsApiPromise: Promise<void> | null = null;
let cachedApiKey: string | null | undefined;

export function loadGoogleMapsApi(apiKey: string): Promise<void> {
  if (mapsApiPromise) return mapsApiPromise;
  mapsApiPromise = new Promise<void>((resolve, reject) => {
    const callbackName = '__googleMapsReady';
    (window as unknown as Record<string, unknown>)[callbackName] = resolve;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,marker,places&language=nl&callback=${callbackName}&loading=async`;
    script.async = true;
    script.onerror = () => {
      mapsApiPromise = null;
      reject(new Error('Google Maps script kon niet geladen worden'));
    };
    document.head.appendChild(script);
  });
  return mapsApiPromise;
}

export async function getApiKey(): Promise<string | null> {
  if (cachedApiKey !== undefined) return cachedApiKey;
  try {
    const res = await httpClient.fetch('/api/config');
    const config = (await res.json()) as { googleMapsApiKey: string | null };
    cachedApiKey = config.googleMapsApiKey;
  } catch {
    cachedApiKey = null;
  }
  return cachedApiKey;
}

export async function ensureGoogleMapsLoaded(): Promise<boolean> {
  const apiKey = await getApiKey();
  if (!apiKey) return false;
  try {
    await loadGoogleMapsApi(apiKey);
    return true;
  } catch {
    return false;
  }
}
