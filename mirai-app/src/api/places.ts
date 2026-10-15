import { request } from './client';

export type PlaceSuggestion = {
  placeId: string;
  /** "Jaipur" */
  name: string;
  /** "Rajasthan, India" */
  region: string;
  /** "Jaipur, Rajasthan, India" */
  description: string;
};

export type PlaceDetails = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  /** UTC offset in hours (IST = 5.5); null when unknown */
  tzone: number | null;
};

/** GET /places/autocomplete (Google Places through the backend) */
export const searchPlaces = (q: string, session: string) =>
  request<{ places: PlaceSuggestion[] }>('/places/autocomplete', { query: { q, session } }).then(r => r.places);

/** GET /places/:placeId: coordinates of a picked suggestion */
export const getPlace = (placeId: string, session: string) =>
  request<{ place: PlaceDetails }>(`/places/${encodeURIComponent(placeId)}`, { query: { session } }).then(r => r.place);
