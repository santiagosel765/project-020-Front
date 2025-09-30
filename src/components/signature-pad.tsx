
"use client";

import React, { forwardRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import type { SignatureCanvasProps } from 'react-signature-canvas';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export const SignaturePad = forwardRef<SignatureCanvas, SignatureCanvasProps>((props, ref) => {
  const isMobile = useIsMobile();
  const { canvasProps, penColor = 'black', ...rest } = props;

  return (
    <div className="h-48 w-full rounded-lg border bg-background">
      <SignatureCanvas
        ref={ref}
        penColor={penColor}
        {...rest}
        canvasProps={{
          ...canvasProps,
          className: cn(
            'w-full h-full rounded-lg',
            isMobile ? 'touch-auto' : 'touch-none',
            canvasProps?.className,
          ),
        }}
      />
    </div>
  );
});

SignaturePad.displayName = 'SignaturePad';
