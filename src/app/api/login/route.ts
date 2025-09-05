
import { NextResponse } from 'next/server';
import { users } from '@/lib/data';

export async function POST(request: Request) {
  try {
    const { user, pass } = await request.json();

    // In a real scenario, we would use the provided credentials to authenticate.
    // For this prototype, we'll find the user by username to get their role.

    if (user === 'lsabbagh') {
      const adminUser = users.find(u => u.username === 'lsabbagh');
       return NextResponse.json({ 
        verified: true, 
        message: 'Inicio de sesión exitoso', 
        user: {
          role: adminUser?.role,
          name: adminUser?.name,
          email: adminUser?.email
        }
      });
    }

    const foundUser = users.find(u => u.username === user);
    
    if (foundUser) {
      // Here we would typically validate the password
      // For now, we assume any user in the list is valid
      return NextResponse.json({ 
        verified: true, 
        message: 'Inicio de sesión exitoso',
        user: {
          role: foundUser.role,
          name: foundUser.name,
          email: foundUser.email
        }
      });
    } else {
      return NextResponse.json({ verified: false, message: 'Credenciales inválidas.' }, { status: 401 });
    }

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ verified: false, message: 'Error en el servidor de autenticación.' }, { status: 500 });
  }
}
