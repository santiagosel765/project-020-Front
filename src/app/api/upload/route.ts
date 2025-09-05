
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import formidable from 'formidable';

// Disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), '/public/files');

async function ensureUploadDirExists() {    
    try {
        await fs.access(uploadDir);
    } catch (error) {
        await fs.mkdir(uploadDir, { recursive: true });
    }
}

export async function POST(request: Request) {
  await ensureUploadDirExists();

  const form = formidable({
    uploadDir: uploadDir,
    keepExtensions: true,
    filename: (name, ext, part) => {
      // Create a unique filename
      return `document-${Date.now()}${ext}`;
    }
  });

  try {
    const [fields, files] = await form.parse(request as any);
    
    const file = files.file?.[0];

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    // The file path should be relative to the public directory to be served statically
    const filePath = `/files/${file.newFilename}`;

    return NextResponse.json({ success: true, filePath: filePath });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Error processing file upload' }, { status: 500 });
  }
}
