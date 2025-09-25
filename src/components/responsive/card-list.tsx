import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CardListAction
  extends Pick<ButtonProps, "variant" | "size"> {
  label: string;
  onClick: () => void;
  ariaLabel?: string;
}

export interface CardListItem {
  id?: React.Key;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode | CardListAction | CardListAction[];
}

export interface CardListProps<T = CardListItem> {
  items: T[];
  primary?: (item: T) => React.ReactNode;
  secondary?: (item: T) => React.ReactNode;
  meta?: (item: T) => React.ReactNode;
  actions?: (item: T) => React.ReactNode;
  className?: string;
  gridClassName?: string;
}

const isCardListItem = (value: unknown): value is CardListItem =>
  typeof value === "object" &&
  value !== null &&
  ("primary" in value ||
    "secondary" in value ||
    "meta" in value ||
    "actions" in value);

const isCardListAction = (value: unknown): value is CardListAction =>
  typeof value === "object" &&
  value !== null &&
  "label" in value &&
  "onClick" in value;

const renderActions = (actions: CardListItem["actions"]) => {
  if (!actions) return null;

  if (React.isValidElement(actions) || typeof actions !== "object") {
    return actions;
  }

  if (Array.isArray(actions)) {
    const validActions = actions.filter(isCardListAction);
    if (!validActions.length) return null;

    return (
      <div className="flex flex-wrap justify-end gap-2">
        {validActions.map((action, index) => (
          <Button
            key={`${action.label}-${index}`}
            size={action.size ?? "sm"}
            variant={action.variant}
            aria-label={action.ariaLabel ?? action.label}
            onClick={() => action.onClick()}
          >
            {action.label}
          </Button>
        ))}
      </div>
    );
  }

  if (isCardListAction(actions)) {
    return (
      <Button
        size={actions.size ?? "sm"}
        variant={actions.variant}
        aria-label={actions.ariaLabel ?? actions.label}
        onClick={() => actions.onClick()}
      >
        {actions.label}
      </Button>
    );
  }

  return actions as React.ReactNode;
};

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
        const cardItem = isCardListItem(item) ? item : undefined;

        return (
          <Card key={key} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="text-base font-semibold leading-none tracking-tight">
                    {primary ? primary(item) : cardItem?.primary}
                  </div>
                  {secondary || cardItem?.secondary ? (
                    <div className="text-sm text-muted-foreground">
                      {secondary ? secondary(item) : cardItem?.secondary}
                    </div>
                  ) : null}
                  {meta || cardItem?.meta ? (
                    <div className="text-sm">
                      {meta ? meta(item) : cardItem?.meta}
                    </div>
                  ) : null}
                </div>
                {actions || cardItem?.actions ? (
                  <div className="flex-shrink-0">
                    {actions ? actions(item) : renderActions(cardItem?.actions)}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
