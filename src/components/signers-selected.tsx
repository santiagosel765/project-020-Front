import { Button } from "@/components/ui/button";

interface SelectedSigner {
  id: string | number;
  name: string;
}

interface SignersSelectedProps {
  signers: SelectedSigner[];
  onRemove: (id: SelectedSigner["id"]) => void;
  className?: string;
}

export function SignersSelected({ signers, onRemove, className }: SignersSelectedProps) {
  return (
    <div className={className}>
      <h4 className="text-sm font-medium">
        Firmantes Seleccionados ({signers.length})
      </h4>
      {signers.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {signers.map((signer) => (
            <div
              key={signer.id}
              className="flex items-center gap-2 rounded-full border border-input bg-muted/60 px-3 py-1 text-sm"
            >
              <span className="max-w-[180px] truncate font-medium" title={signer.name}>
                {signer.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => onRemove(signer.id)}
                aria-label={`Quitar a ${signer.name}`}
              >
                Quitar
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
