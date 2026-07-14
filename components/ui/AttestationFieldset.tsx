"use client";

const ATTESTATIONS: [string, string][] = [
  ["searched_google", "I searched Google and could not find this supplier"],
  ["searched_maps", "I searched Google Maps and could not find this supplier"],
  [
    "searched_b2b",
    "I searched IndiaMART/B2B directories and could not find this supplier",
  ],
  [
    "searched_social",
    "I searched WhatsApp/social media and could not find this supplier",
  ],
  ["asked_around", "I asked people I know and could not find this supplier"],
];

interface AttestationFieldsetProps {
  legend: string;
}

export function AttestationFieldset({ legend }: AttestationFieldsetProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-muted">{legend}</legend>
      {ATTESTATIONS.map(([key, label]) => (
        <label
          key={key}
          className="flex min-h-[44px] items-start gap-2 py-1.5 text-sm"
        >
          <input
            type="checkbox"
            name="unfindableAttestation"
            value={key}
            className="mt-0.5"
          />
          <span className="text-muted">{label}</span>
        </label>
      ))}
    </fieldset>
  );
}
