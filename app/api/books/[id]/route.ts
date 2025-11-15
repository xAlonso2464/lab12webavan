// app/api/books/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/books/:id
export async function GET(_req: NextRequest, context: any) {
  const { id } = await context.params;

  try {
    const book = await prisma.book.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!book) {
      return NextResponse.json(
        { message: 'Libro no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error('Error al obtener libro:', error);
    return NextResponse.json(
      { message: 'Error al obtener libro' },
      { status: 500 }
    );
  }
}

// PUT /api/books/:id
export async function PUT(req: NextRequest, context: any) {
  const { id } = await context.params;

  try {
    const body = await req.json();
    const {
      title,
      description,
      isbn,
      publishedYear,
      genre,
      pages,
      authorId,
    } = body;

    const book = await prisma.book.update({
      where: { id },
      data: {
        title,
        description,
        isbn,
        publishedYear,
        genre,
        pages,
        authorId,
      },
    });

    return NextResponse.json(book);
  } catch (error: any) {
    console.error('Error al actualizar libro:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Libro no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Error al actualizar libro' },
      { status: 500 }
    );
  }
}

// DELETE /api/books/:id
export async function DELETE(_req: NextRequest, context: any) {
  const { id } = await context.params;

  try {
    await prisma.book.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Libro eliminado correctamente' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error al eliminar libro:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Libro no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Error al eliminar libro' },
      { status: 500 }
    );
  }
}
