import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { Signer } from '@/services/documentsService';

const statusClass = (signed: boolean) =>
  signed
    ? 'bg-green-100 text-green-800 border-green-400'
    : 'bg-yellow-100 text-yellow-800 border-yellow-400';

type SignersPanelProps = {
  firmantes: Signer[];
  progress: number;
  className?: string;
  showHeader?: boolean;
};

export function SignersPanel({
  firmantes,
  progress,
  className,
  showHeader = true,
}: SignersPanelProps) {
  const rootClass = cn(showHeader ? 'space-y-4' : 'space-y-3', className);

  return (
    <div className={rootClass}>
      {showHeader ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Firmantes</h3>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      ) : (
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between font-medium">
            <span>Progreso</span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
      <ul className="space-y-3">
        {firmantes.map((f) => (
          <li key={`${f.id}-${f.responsabilidad}`} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={f.urlFoto ?? f.avatar ?? undefined}
                  alt={f.nombre}
                />
                <AvatarFallback>{f.iniciales}</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium">{f.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {[f.puesto, f.responsabilidad].filter(Boolean).join(' – ')}
                </p>
                {f.diasTranscurridos != null && (
                  <p className="text-xs text-muted-foreground">Días transcurridos: {f.diasTranscurridos}</p>
                )}
              </div>
            </div>
            <Badge className={cn('border', statusClass(f.estaFirmado))}>
              {f.estaFirmado ? 'FIRMADO' : 'PENDIENTE'}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
