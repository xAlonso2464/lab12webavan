// app/api/authors/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/authors/:id
export async function GET(_req: NextRequest, context: any) {
  const { id } = await context.params; // puede ser Promise<{ id: string }>

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

// PUT /api/authors/:id - actualizar autor
export async function PUT(req: NextRequest, context: any) {
  const { id } = await context.params;

  try {
    const body = await req.json();
    const { name, email, nationality, birthYear, bio } = body;

    if (!name || !email) {
      return NextResponse.json(
        { message: 'name y email son obligatorios' },
        { status: 400 }
      );
    }

    const author = await prisma.author.update({
      where: { id },
      data: {
        name,
        email,
        nationality: nationality ?? null,
        birthYear: birthYear ?? null,
        bio: bio ?? null,
      },
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

    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'El email ya está registrado' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: 'Error al actualizar autor' },
      { status: 500 }
    );
  }
}

// DELETE /api/authors/:id
export async function DELETE(_req: NextRequest, context: any) {
  const { id } = await context.params;

  try {
    await prisma.author.delete({
      where: { id },
    });

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
