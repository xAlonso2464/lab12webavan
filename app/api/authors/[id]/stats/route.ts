// app/api/authors/[id]/stats/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Params = {
  params: { id: string };
};

export async function GET(_req: Request, { params }: Params) {
  const { id } = params;

  try {
    const author = await prisma.author.findUnique({
      where: { id },
      include: { books: true },
    });

    if (!author) {
      return NextResponse.json(
        { message: 'Autor no encontrado' },
        { status: 404 }
      );
    }

    const books = author.books;

    if (books.length === 0) {
      return NextResponse.json({
        authorId: author.id,
        authorName: author.name,
        totalBooks: 0,
        firstBook: null,
        latestBook: null,
        averagePages: 0,
        genres: [],
        longestBook: null,
        shortestBook: null,
      });
    }

    const totalBooks = books.length;

    // Libros con año
    const booksWithYear = books.filter(
      (b) => b.publishedYear !== null && b.publishedYear !== undefined
    );
    const sortedByYear = [...booksWithYear].sort(
      (a, b) => (a.publishedYear ?? 0) - (b.publishedYear ?? 0)
    );

    const firstBook = sortedByYear[0]
      ? {
          title: sortedByYear[0].title,
          year: sortedByYear[0].publishedYear,
        }
      : null;

    const latestBook = sortedByYear[sortedByYear.length - 1]
      ? {
          title: sortedByYear[sortedByYear.length - 1].title,
          year: sortedByYear[sortedByYear.length - 1].publishedYear,
        }
      : null;

    // Páginas
    const booksWithPages = books.filter(
      (b) => b.pages !== null && b.pages !== undefined
    );

    let averagePages = 0;
    let longestBook: { title: string; pages: number | null } | null = null;
    let shortestBook: { title: string; pages: number | null } | null = null;

    if (booksWithPages.length > 0) {
      const totalPages = booksWithPages.reduce(
        (sum, b) => sum + (b.pages ?? 0),
        0
      );
      averagePages = Math.round(totalPages / booksWithPages.length);

      const sortedByPages = [...booksWithPages].sort(
        (a, b) => (a.pages ?? 0) - (b.pages ?? 0)
      );

      shortestBook = {
        title: sortedByPages[0].title,
        pages: sortedByPages[0].pages ?? null,
      };

      const last = sortedByPages[sortedByPages.length - 1];
      longestBook = {
        title: last.title,
        pages: last.pages ?? null,
      };
    }

    // Géneros únicos
    const genres = Array.from(
      new Set(
        books
          .map((b) => b.genre)
          .filter((g): g is string => typeof g === 'string')
      )
    );

    return NextResponse.json({
      authorId: author.id,
      authorName: author.name,
      totalBooks,
      firstBook,
      latestBook,
      averagePages,
      genres,
      longestBook,
      shortestBook,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del autor:', error);
    return NextResponse.json(
      { message: 'Error al obtener estadísticas del autor' },
      { status: 500 }
    );
  }
}
