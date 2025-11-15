// app/api/books/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/books  (con filtro opcional por género)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const genre = searchParams.get('genre') || undefined;

  try {
    const books = await prisma.book.findMany({
      where: { genre },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(books);
  } catch (error) {
    console.error('Error al obtener libros:', error);
    return NextResponse.json(
      { message: 'Error al obtener libros' },
      { status: 500 }
    );
  }
}

// POST /api/books - crear libro
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      isbn,
      publishedYear,
      genre,
      pages,
      authorId,
    } = body;

    if (!title || !isbn || !authorId) {
      return NextResponse.json(
        { message: 'title, isbn y authorId son obligatorios' },
        { status: 400 }
      );
    }

    const book = await prisma.book.create({
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

    return NextResponse.json(book, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear libro:', error);

    if (error.code === 'P2003') {
      return NextResponse.json(
        { message: 'authorId no es válido' },
        { status: 400 }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'El ISBN ya está registrado' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: 'Error al crear libro' },
      { status: 500 }
    );
  }
}
