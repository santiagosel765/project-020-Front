
import { NextResponse } from 'next/server';
import { users } from '@/lib/data';
import type { User } from '@/lib/data';

// GET all users
export async function GET() {
  return NextResponse.json(users);
}

// POST a new user
export async function POST(request: Request) {
  try {
    const newUserPartial = await request.json();
    const newUser: User = {
      ...newUserPartial,
      id: `USR${Date.now()}`,
      avatar: 'https://placehold.co/100x100.png',
    };
    users.push(newUser);
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error creating user', error }, { status: 500 });
  }
}

// PUT (update) a user
export async function PUT(request: Request) {
   const { searchParams } = new URL(request.url);
   const userId = searchParams.get('id');

  if (!userId) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    const updatedUser = await request.json();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    users[userIndex] = { ...users[userIndex], ...updatedUser };
    return NextResponse.json(users[userIndex]);
  } catch (error) {
    return NextResponse.json({ message: 'Error updating user', error }, { status: 500 });
  }
}

// DELETE a user
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('id');

  if (!userId) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  users.splice(userIndex, 1);
  return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
}
