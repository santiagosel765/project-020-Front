import { LoginForm } from '@/components/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
       <Image
        src="/loginbg.jpeg"
        alt="Fondo de inicio de sesión"
        layout="fill"
        objectFit="cover"
        quality={100}
        className="-z-10"
      />
      <div className="absolute inset-0 bg-black/50 -z-10"></div>
      <Card className="w-full max-w-md glassmorphism">
        <CardHeader className="text-center p-6">
           <Image 
            src="/genesissign.png" 
            alt="Génesis Sign Logotipo"
            width={250}
            height={80}
            className="mx-auto mb-4"
            style={{ width: '250px', height: 'auto' }}
          />
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
