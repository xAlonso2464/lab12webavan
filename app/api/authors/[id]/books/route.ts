// app/api/authors/[id]/books/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Params = {
  params: { id: string };
};

// GET /api/authors/:id/books
export async function GET(_req: Request, { params }: Params) {
  const { id } = params;

  try {
    const books = await prisma.book.findMany({
      where: { authorId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(books);
  } catch (error) {
    console.error('Error al obtener libros del autor:', error);
    return NextResponse.json(
      { message: 'Error al obtener libros del autor' },
      { status: 500 }
    );
  }
}
