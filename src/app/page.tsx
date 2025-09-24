'use client'

import { LoginForm } from '@/components/login-form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Image from 'next/image';

export default function Home() {


  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <Image
        src="/loginbg.jpeg"
        alt="Background"
        fill
        priority
        style={{ objectFit: "cover" }}
      />
      <div className="absolute inset-0 bg-black/50 -z-10"></div>
      <Card className="w-full max-w-md glassmorphism">
        <CardHeader className="text-center p-6">
          <Image
            src="/genesissign.png"
            alt="Génesis Sign Logotipo"
            width={200}
            height={80}
            className="mx-auto mb-4"
            style={{ height: "auto" }}
          />
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
