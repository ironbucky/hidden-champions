"use client";

import { useActionState, useEffect, useState } from "react";
import {
  postRequest,
  getApprovedCategories,
  searchSimilarRequests,
  PostRequestResult,
} from "@/features/requests/actions";
import { AttestationFieldset } from "@/components/ui/AttestationFieldset";

interface Category {
  id: string;
  name: string;
}

interface SimilarRequest {
  id: string;
  what: string;
  upvotes: number;
  categories?: { name: string } | null;
}

export function RequestForm() {
  const [state, formAction, pending] = useActionState(
    postRequest,
    null as PostRequestResult | null
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [whatText, setWhatText] = useState("");
  const [similarRequests, setSimilarRequests] = useState<SimilarRequest[]>([]);

  useEffect(() => {
    getApprovedCategories().then((data) => setCategories(data as Category[]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const query = whatText.trim();

    const timer = setTimeout(() => {
      if (query.length < 3) {
        if (!cancelled) setSimilarRequests([]);
        return;
      }
      searchSimilarRequests(query).then((data) => {
        if (!cancelled) {
          setSimilarRequests((data as unknown as SimilarRequest[]) ?? []);
        }
      });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [whatText]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="what"
          className="label"
        >
          What do you need?
        </label>
        <input
          id="what"
          name="what"
          required
          value={whatText}
          onChange={(e) => setWhatText(e.target.value)}
          placeholder='e.g. "Thin copper sheet supplier in Lahore"'
          className="input mt-1"
        />
        <p className="mt-1 text-xs text-muted">
          Be specific about what you&apos;re looking for.
        </p>

        {similarRequests.length > 0 && (
          <div className="mt-3 rounded-input border border-amber-bd bg-amber-bg p-3">
            <p className="text-xs font-medium text-amber-fg">
              Someone already needs something similar — upvote instead?
            </p>
            <ul className="mt-2 space-y-1">
              {similarRequests.map((req) => (
                <li key={req.id}>
                  <a
                    href={`/requests/${req.id}`}
                    className="text-sm text-amber-fg underline"
                  >
                    {req.what} ({req.upvotes}{" "}
                    {req.upvotes === 1 ? "upvote" : "upvotes"})
                    {req.categories?.name ? ` · ${req.categories.name}` : ""}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="categoryId"
          className="label"
        >
          Category
        </label>
        <select
          id="categoryId"
          name="categoryId"
          required
          className="input mt-1"
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
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
          placeholder="e.g. Gulberg, Model Town, Ichhra"
          className="input mt-1"
        />
      </div>

      <AttestationFieldset legend="Where have you already searched? (check all that apply)" />

      <div>
        <label
          htmlFor="notes"
          className="label"
        >
          Additional notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Quantity, urgency, specs, or any other details"
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
        disabled={pending}
        className="w-full btn-primary disabled:opacity-50"
      >
        {pending ? "Posting…" : "Post request"}
      </button>
    </form>
  );
}
