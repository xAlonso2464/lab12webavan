// app/api/authors/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Params = {
  params: { id: string };
};

// GET /api/authors/:id
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

    return NextResponse.json(author);
  } catch (error) {
    console.error('Error al obtener autor:', error);
    return NextResponse.json(
      { message: 'Error al obtener autor' },
      { status: 500 }
    );
  }
}

// PUT /api/authors/:id
export async function PUT(req: Request, { params }: Params) {
  const { id } = params;

  try {
    const body = await req.json();
    const { name, email, nationality, birthYear, bio } = body;

    const author = await prisma.author.update({
      where: { id },
      data: { name, email, nationality, birthYear, bio },
    });

    return NextResponse.json(author);
  } catch (error: any) {
    console.error('Error al actualizar autor:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Autor no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Error al actualizar autor' },
      { status: 500 }
    );
  }
}

// DELETE /api/authors/:id
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = params;

  try {
    await prisma.author.delete({ where: { id } });

    return NextResponse.json(
      { message: 'Autor eliminado correctamente' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error al eliminar autor:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Autor no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Error al eliminar autor' },
      { status: 500 }
    );
  }
}
