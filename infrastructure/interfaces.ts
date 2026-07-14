import { AppConfig } from "@/config";

export interface AuthProvider {
  signUpWithPhone(
    phone: string,
    password: string
  ): Promise<{
    userId: string | null;
    error: Error | null;
  }>;
  getSession(): Promise<{
    userId: string | null;
    phone: string | null;
    role: string | null;
    verifiedAt: Date | null;
    error: Error | null;
  }>;
  signOut(): Promise<{ error: Error | null }>;
}

export interface PhotoStorage {
  upload(
    file: File | Blob,
    path: string
  ): Promise<{ path: string; error: Error | null }>;
  getPublicUrl(path: string): string;
  getPrivateUrl(
    path: string,
    expiresIn: number
  ): Promise<{ signedUrl: string; error: Error | null }>;
}

export interface OcrScanner {
  scanForPhonePatterns(
    imageBuffer: ArrayBuffer,
    regex: RegExp
  ): Promise<{ detected: boolean; phone: string | null }>;
}

export interface ConfigRepository {
  get<K extends keyof AppConfig>(key: K): Promise<AppConfig[K]>;
  getAll(): Promise<AppConfig>;
  set<K extends keyof AppConfig>(
    key: K,
    value: AppConfig[K],
    userId: string
  ): Promise<{ error: Error | null }>;
}

export interface AuditLogger {
  log(params: {
    actorUserId: string | null;
    action: string;
    targetType: string;
    targetId: string | null;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
  }): Promise<{ error: Error | null }>;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeoLocator {
  requestLocation(): Promise<{
    location: GeoLocation | null;
    error: Error | null;
  }>;
}

export interface DataGateway {
  // Users
  findUserById(id: string): Promise<unknown | null>;
  updateUser(
    id: string,
    updates: Record<string, unknown>
  ): Promise<{ error: Error | null }>;

  // Categories
  listApprovedCategories(): Promise<unknown[]>;

  // Suppliers
  findSupplierById(id: string): Promise<unknown | null>;
  insertSupplier(
    data: Record<string, unknown>
  ): Promise<{ id: string; error: Error | null }>;
  updateSupplier(
    id: string,
    data: Record<string, unknown>
  ): Promise<{ error: Error | null }>;

  // Contacts
  insertSupplierContact(
    data: Record<string, unknown>
  ): Promise<{ error: Error | null }>;
  findContactsBySupplier(supplierId: string): Promise<unknown[]>;

  // Photos
  insertPhoto(
    data: Record<string, unknown>
  ): Promise<{ id: string; error: Error | null }>;
  updatePhoto(
    id: string,
    data: Record<string, unknown>
  ): Promise<{ error: Error | null }>;

  // Listings
  insertListing(
    data: Record<string, unknown>
  ): Promise<{ id: string; error: Error | null }>;

  // Requests
  insertRequest(
    data: Record<string, unknown>
  ): Promise<{ id: string; error: Error | null }>;
  updateRequest(
    id: string,
    data: Record<string, unknown>
  ): Promise<{ error: Error | null }>;

  // Answers
  insertAnswer(
    data: Record<string, unknown>
  ): Promise<{ id: string; error: Error | null }>;
  updateAnswer(
    id: string,
    data: Record<string, unknown>
  ): Promise<{ error: Error | null }>;

  // Upvotes
  upsertRequestUpvote(
    requestId: string,
    userId: string
  ): Promise<{ error: Error | null }>;
  deleteRequestUpvote(
    requestId: string,
    userId: string
  ): Promise<{ error: Error | null }>;

  // Reputation
  upsertChampionReputation(
    data: Record<string, unknown>
  ): Promise<{ error: Error | null }>;
  insertReputationEvent(
    data: Record<string, unknown>
  ): Promise<{ error: Error | null }>;

  // Admin queue
  insertAdminQueueItem(
    data: Record<string, unknown>
  ): Promise<{ id: string; error: Error | null }>;
  updateAdminQueueItem(
    id: string,
    data: Record<string, unknown>
  ): Promise<{ error: Error | null }>;

  // Contact unlocks
  insertContactUnlock(
    userId: string,
    supplierId: string
  ): Promise<{ error: Error | null }>;
  countContactUnlocksToday(userId: string): Promise<number>;

  // Finder fee
  insertFinderFeeLedger(
    data: Record<string, unknown>
  ): Promise<{ error: Error | null }>;

  // Search
  searchSuppliers(params: {
    query?: string;
    categoryId?: string;
    area?: string;
    near?: GeoLocation;
    limit?: number;
  }): Promise<unknown[]>;
}
