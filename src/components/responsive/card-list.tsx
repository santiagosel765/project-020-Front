import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface CardListProps<T> {
  items: T[];
  primary: (item: T) => React.ReactNode;
  secondary?: (item: T) => React.ReactNode;
  meta?: (item: T) => React.ReactNode;
  actions?: (item: T) => React.ReactNode;
  className?: string;
  gridClassName?: string;
}

export function CardList<T>({
  items,
  primary,
  secondary,
  meta,
  actions,
  className,
  gridClassName,
}: CardListProps<T>) {
  if (!items.length) {
    return null;
  }

  const containerClassName = gridClassName
    ? cn(gridClassName, className)
    : cn("space-y-3", className);

  return (
    <div className={containerClassName}>
      {items.map((item, index) => {
        const key =
          typeof item === "object" && item !== null && "id" in item
            ? (item as { id?: React.Key }).id ?? index
            : index;

        return (
          <Card key={key} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="text-base font-semibold leading-none tracking-tight">
                    {primary(item)}
                  </div>
                  {secondary ? (
                    <div className="text-sm text-muted-foreground">
                      {secondary(item)}
                    </div>
                  ) : null}
                  {meta ? <div className="text-sm">{meta(item)}</div> : null}
                </div>
                {actions ? (
                  <div className="flex-shrink-0">{actions(item)}</div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
