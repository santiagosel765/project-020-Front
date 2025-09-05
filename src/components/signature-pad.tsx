
"use client"

import React, { forwardRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';


export const SignaturePad = forwardRef<SignatureCanvas>((props, ref) => {
    const isMobile = useIsMobile();
    return (
      <div className='w-full h-48 rounded-lg border bg-background'>
        <SignatureCanvas
            ref={ref}
            penColor='black'
            canvasProps={{ 
                className: cn('w-full h-full rounded-lg', isMobile ? 'touch-auto' : 'touch-none')
            }}
        />
      </div>
    );
});

SignaturePad.displayName = 'SignaturePad';
