"use client";

import { useActionState, useEffect, useState } from "react";
import {
  uploadSupplier,
  getApprovedCategories,
  UploadSupplierResult,
} from "@/features/suppliers/actions";
import { AttestationFieldset } from "@/components/ui/AttestationFieldset";

interface Category {
  id: string;
  name: string;
}

interface SupplierUploadFormProps {
  answeringRequestId?: string;
}

export function SupplierUploadForm({
  answeringRequestId,
}: SupplierUploadFormProps) {
  const [state, formAction, pending] = useActionState(
    uploadSupplier,
    null as UploadSupplierResult | null
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [suggestNew, setSuggestNew] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    getApprovedCategories().then((data) => setCategories(data as Category[]));
  }, []);

  const captureLocation = () => {
    setCapturing(true);
    setLocationError(null);

    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation is not supported by this browser.");
      setCapturing(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setCapturing(false);
      },
      () => {
        setLocationError(
          "Could not capture location. Please enable location services."
        );
        setCapturing(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <form action={formAction} className="space-y-4">
      {answeringRequestId && (
        <input
          type="hidden"
          name="answeringRequestId"
          value={answeringRequestId}
        />
      )}
      <input type="hidden" name="latitude" value={location?.latitude ?? ""} />
      <input type="hidden" name="longitude" value={location?.longitude ?? ""} />

      <div>
        <label
          htmlFor="name"
          className="label"
        >
          Supplier name
        </label>
        <input
          id="name"
          name="name"
          required
          className="input mt-1"
        />
      </div>

      <div>
        <label
          htmlFor="categoryId"
          className="label"
        >
          Category
        </label>
        {!suggestNew ? (
          <select
            id="categoryId"
            name="categoryId"
            required={!suggestNew}
            className="input mt-1"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        ) : (
          <>
            <input
              name="suggestedCategoryName"
              placeholder="Suggest a new category"
              required={suggestNew}
              className="input mt-1"
            />
            <input type="hidden" name="categoryId" value="__suggest__" />
          </>
        )}
        <button
          type="button"
          onClick={() => setSuggestNew((v) => !v)}
          className="mt-2 text-sm text-muted underline"
        >
          {suggestNew ? "Choose existing category" : "Suggest new category"}
        </button>
      </div>

      <div>
        <label
          htmlFor="area"
          className="label"
        >
          Area (Lahore neighborhood)
        </label>
        <input
          id="area"
          name="area"
          required
          placeholder="e.g. Gulberg, Model Town"
          className="input mt-1"
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="label"
        >
          Phone number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          placeholder="0300-1234567"
          className="input mt-1"
        />
        <p className="mt-1 text-xs text-muted">
          Captured for contact gating only — never displayed publicly.
        </p>
      </div>

      <div>
        <label
          htmlFor="photo"
          className="block text-sm font-medium text-muted"
        >
          Photo
        </label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/*"
          capture="environment"
          required
          className="mt-1 block w-full text-sm text-muted"
        />
      </div>

      <div>
        <button
          type="button"
          onClick={captureLocation}
          disabled={capturing}
          className="btn-outline disabled:opacity-50"
        >
          {capturing
            ? "Capturing…"
            : location
              ? "Location captured ✓"
              : "Capture location"}
        </button>
        {location && (
            <p className="mt-1 text-xs text-muted">
            {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          </p>
        )}
      </div>

      {locationError && (
        <p className="text-sm text-terra-ink">{locationError}</p>
      )}

      <AttestationFieldset legend="Unfindable attestation" />

      <div>
        <label
          htmlFor="howIKnow"
          className="label"
        >
          How I know them (optional)
        </label>
        <textarea
          id="howIKnow"
          name="howIKnow"
          rows={3}
          className="input mt-1"
        />
      </div>

      {state?.message && (
        <p
          className={`text-sm ${
            state.success
              ? "text-accent-ink"
              : "text-terra-ink"
          }`}
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !location}
        className="w-full btn-primary disabled:opacity-50"
      >
        {pending ? "Uploading…" : "Upload supplier"}
      </button>
    </form>
  );
}
