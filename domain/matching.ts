export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface MatchableSupplier {
  name: string;
  area: string;
  phone: string;
  geopoint?: GeoPoint | null;
}

export type MergeDecision = "auto-merge" | "fuzzy-flag" | "distinct";

function stripNonDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizePhone(phone: string): string {
  const digits = stripNonDigits(phone);

  if (digits.length < 8) {
    return phone; // too short to normalize — return original
  }

  if (digits.startsWith("0092")) {
    return `+92${digits.slice(4)}`;
  }

  // Pakistan mobile in international form, e.g. 923001234567 => +923001234567
  if (digits.startsWith("92") && digits.length === 12) {
    return `+${digits}`;
  }

  // Local mobile form, e.g. 03001234567 => +923001234567
  if (digits.startsWith("03") && digits.length === 11) {
    return `+92${digits.slice(1)}`;
  }

  return `+${digits}`;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [
    i,
  ]);

  for (let j = 1; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function similarityRatio(a: string, b: string): number {
  const longer = Math.max(a.length, b.length);
  if (longer === 0) return 1;
  const distance = levenshtein(a, b);
  return (longer - distance) / longer;
}

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]/g, "")
    .trim();
}

function nameSimilarity(a: string, b: string): number {
  return similarityRatio(normalizeName(a), normalizeName(b));
}

function areaSimilarity(a: string, b: string): number {
  return normalizeName(a) === normalizeName(b) ? 1 : 0;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;

  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export const matchingPolicy = {
  isExactPhoneMatch(a: string, b: string): boolean {
    return normalizePhone(a) === normalizePhone(b);
  },

  isFuzzyMatch(
    a: MatchableSupplier,
    b: MatchableSupplier,
    options: { nameThreshold?: number; maxDistanceMeters?: number } = {}
  ): boolean {
    const nameThreshold = options.nameThreshold ?? 0.8;
    const maxDistanceMeters = options.maxDistanceMeters ?? 100;

    if (nameSimilarity(a.name, b.name) < nameThreshold) return false;
    if (areaSimilarity(a.area, b.area) < 1) return false;

    if (!a.geopoint || !b.geopoint) return true; // fuzzy if name + area match

    return haversineMeters(a.geopoint, b.geopoint) <= maxDistanceMeters;
  },

  shouldAutoMergeToFuzzy(
    a: MatchableSupplier,
    b: MatchableSupplier
  ): MergeDecision {
    if (this.isExactPhoneMatch(a.phone, b.phone)) return "auto-merge";
    if (this.isFuzzyMatch(a, b)) return "fuzzy-flag";
    return "distinct";
  },
};
