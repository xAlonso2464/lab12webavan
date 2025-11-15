// app/api/authors/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/authors - listar autores
export async function GET() {
  try {
    const authors = await prisma.author.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(authors);
  } catch (error) {
    console.error('Error al obtener autores:', error);
    return NextResponse.json(
      { message: 'Error al obtener autores' },
      { status: 500 }
    );
  }
}

// POST /api/authors - crear autor
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, nationality, birthYear, bio } = body;

    if (!name || !email) {
      return NextResponse.json(
        { message: 'name y email son obligatorios' },
        { status: 400 }
      );
    }

    const author = await prisma.author.create({
      data: {
        name,
        email,
        nationality,
        birthYear,
        bio,
      },
    });

    return NextResponse.json(author, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear autor:', error);

    // email duplicado
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'El email ya está registrado' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: 'Error al crear autor' },
      { status: 500 }
    );
  }
}
