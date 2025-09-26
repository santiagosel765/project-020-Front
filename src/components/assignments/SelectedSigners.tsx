"use client";

import { X } from "lucide-react";

export type SelectedSigner = { id: number; nombre: string };

export default function SelectedSigners({
  selected,
  onRemove,
}: {
  selected: SelectedSigner[];
  onRemove: (id: number) => void;
}) {
  return (
    <div className="overflow-visible rounded-lg border bg-card p-3 sm:p-4">
      <p className="mb-2 text-sm font-medium">
        Firmantes seleccionados ({selected.length})
      </p>

      <ul className="flex flex-wrap gap-2">
        {selected.map((u) => (
          <li key={u.id} className="w-full sm:w-auto">
            <div className="flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 sm:rounded-full sm:px-3 sm:py-1">
              <span className="min-w-0 truncate text-sm" title={u.nombre}>
                {u.nombre}
              </span>
              <button
                type="button"
                onClick={() => onRemove(u.id)}
                aria-label={`Quitar ${u.nombre}`}
                className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition-colors hover:bg-destructive/10"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Quitar</span>
                <span className="sm:hidden">Quitar</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
