// app/api/authors/[id]/books/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/authors/:id/books - libros de un autor
export async function GET(_req: NextRequest, context: any) {
  // En Next 16, context.params puede venir como Promise<{ id: string }>
  const { id } = await context.params;

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
