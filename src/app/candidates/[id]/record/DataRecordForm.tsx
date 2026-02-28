"use client";

import { useMemo, useState } from "react";

type Provenance = {
  fieldName: string;
  source: "EXTRACTED" | "INFERRED" | "USER_EDITED";
  lastModifiedAt: string | null;
} | null;

type RecordData = {
  recordId: string;
  version: number;
  fields: Record<string, unknown>;
  provenances: {
    fullName: Provenance;
    title: Provenance;
    email: Provenance;
    phone: Provenance;
  };
};

export function DataRecordForm(props: { candidateId: string; initial: RecordData }) {
  const [version, setVersion] = useState(props.initial.version);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const initialFields = props.initial.fields;
  const [fullName, setFullName] = useState(String(initialFields.fullName ?? ""));
  const [title, setTitle] = useState(String(initialFields.title ?? ""));
  const [email, setEmail] = useState(String(initialFields.email ?? ""));
  const [phone, setPhone] = useState(String(initialFields.phone ?? ""));

  const prov = props.initial.provenances;

  const badge = useMemo(() => {
    const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs";
    return {
      EXTRACTED: base + " bg-blue-500/15 text-blue-700 dark:text-blue-300",
      INFERRED: base + " bg-purple-500/15 text-purple-700 dark:text-purple-300",
      USER_EDITED: base + " bg-green-500/15 text-green-700 dark:text-green-300",
    } as const;
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/candidates/${props.candidateId}/record`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullName, title, email, phone }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Failed to save.");
      } else {
        setVersion(json.data.version);
        setSaved(true);
        setTimeout(() => setSaved(false), 1200);
      }
    } catch {
      setError("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  type FieldKey = keyof RecordData["provenances"];

  function FieldRow(args: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    fieldKey: FieldKey;
  }) {
    const p = prov[args.fieldKey];
    return (
      <label className="block">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">{args.label}</span>
          {p ? (
            <span className={badge[p.source]}>{p.source}</span>
          ) : (
            <span className="text-xs text-black/50 dark:text-white/50">—</span>
          )}
        </div>
        <input
          value={args.value}
          onChange={(e) => args.onChange(e.target.value)}
          className="mt-1 w-full rounded-md border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm"
        />
      </label>
    );
  }

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
      <div className="p-4 border-b border-black/10 dark:border-white/15 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Data Record</div>
          <div className="text-xs text-black/60 dark:text-white/60">
            Record: {props.initial.recordId} • Version: {version}
          </div>
        </div>
        <button
          type="button"
          onClick={() => save()}
          disabled={saving}
          className="rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-2 text-sm font-medium disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="p-4 space-y-4">
        {error ? (
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        ) : null}
        {saved ? (
          <div className="text-sm text-green-700 dark:text-green-300">Saved.</div>
        ) : null}

        <FieldRow
          label="Full name"
          value={fullName}
          onChange={setFullName}
          fieldKey="fullName"
        />
        <FieldRow label="Title" value={title} onChange={setTitle} fieldKey="title" />
        <FieldRow label="Email" value={email} onChange={setEmail} fieldKey="email" />
        <FieldRow label="Phone" value={phone} onChange={setPhone} fieldKey="phone" />
      </div>
    </div>
  );
}

