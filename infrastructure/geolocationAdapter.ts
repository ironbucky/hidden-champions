import { GeoLocator, GeoLocation } from "./interfaces";

export class BrowserGeolocationAdapter implements GeoLocator {
  requestLocation(): Promise<{
    location: GeoLocation | null;
    error: Error | null;
  }> {
    return new Promise((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        resolve({
          location: null,
          error: new Error("Geolocation is not available"),
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            },
            error: null,
          });
        },
        (error) => {
          resolve({
            location: null,
            error: new Error(error.message),
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }
}

export const geolocationAdapter = new BrowserGeolocationAdapter();
