// app/api/books/search/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const search = searchParams.get('search') || undefined;
  const genre = searchParams.get('genre') || undefined;
  const authorName = searchParams.get('authorName') || undefined;

  const pageParam = searchParams.get('page') || '1';
  const limitParam = searchParams.get('limit') || '10';
  const sortByParam = searchParams.get('sortBy') || 'createdAt';
  const orderParam = searchParams.get('order') || 'desc';

  const page = Math.max(1, Number(pageParam) || 1);

  const rawLimit = Number(limitParam) || 10;
  const limit = Math.min(50, Math.max(1, rawLimit));

  const allowedSortBy = ['title', 'publishedYear', 'createdAt'] as const;
  const sortBy = allowedSortBy.includes(sortByParam as any)
    ? (sortByParam as (typeof allowedSortBy)[number])
    : 'createdAt';

  const order: 'asc' | 'desc' = orderParam === 'asc' ? 'asc' : 'desc';

  const where: any = {};

  if (search) {
    where.title = {
      contains: search,
      mode: 'insensitive',
    };
  }

  if (genre) {
    where.genre = genre;
  }

  if (authorName) {
    where.author = {
      name: {
        contains: authorName,
        mode: 'insensitive',
      },
    };
  }

  try {
    const [total, data] = await Promise.all([
      prisma.book.count({ where }),
      prisma.book.findMany({
        where,
        include: { author: true },
        orderBy: { [sortBy]: order } as any,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error en búsqueda de libros:', error);
    return NextResponse.json(
      { message: 'Error en búsqueda de libros' },
      { status: 500 }
    );
  }
}
