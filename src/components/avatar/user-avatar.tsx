"use client";

import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/avatar";

const SIZE_MAP = {
  sm: { wrapper: "h-10 w-10", text: "text-base" },
  md: { wrapper: "h-12 w-12", text: "text-lg" },
  lg: { wrapper: "h-20 w-20", text: "text-3xl" },
  xl: { wrapper: "h-24 w-24", text: "text-4xl" },
} as const;

export type UserAvatarSize = keyof typeof SIZE_MAP;

export interface UserAvatarProps extends React.ComponentPropsWithoutRef<typeof Avatar> {
  url?: string | null;
  name?: string | null;
  size?: UserAvatarSize;
}

export function UserAvatar({
  url,
  name,
  size = "md",
  className,
  ...props
}: UserAvatarProps) {
  const { wrapper, text } = SIZE_MAP[size] ?? SIZE_MAP.md;
  const fallback = initials(name ?? "");

  return (
    <Avatar className={cn(wrapper, className)} {...props}>
      <AvatarImage src={url ?? undefined} alt={name ?? "Usuario"} data-ai-hint="person avatar" />
      <AvatarFallback className={cn(text)}>{fallback}</AvatarFallback>
    </Avatar>
  );
}
