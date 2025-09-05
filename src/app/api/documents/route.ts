
import { NextResponse } from 'next/server';
import { documents } from '@/lib/data';
import type { Document } from '@/lib/data';

// GET all documents or a single document by ID
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const document = documents.find(d => d.id === id);
    if (document) {
      return NextResponse.json(document);
    }
    return NextResponse.json({ message: 'Document not found' }, { status: 404 });
  }

  return NextResponse.json(documents);
}

// POST a new document
export async function POST(request: Request) {
  try {
    const newDocPartial = await request.json();
    const newDoc: Document = {
      ...newDocPartial,
      id: `DOC${Date.now()}`,
    };
    documents.unshift(newDoc); // Add to the beginning of the array
    return NextResponse.json(newDoc, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error creating document', error }, { status: 500 });
  }
}
