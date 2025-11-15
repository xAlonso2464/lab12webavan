// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Author = {
  id: string;
  name: string;
  email: string;
  nationality?: string | null;
  birthYear?: number | null;
  bio?: string | null;
  createdAt: string;
  updatedAt: string;
};

type Book = {
  id: string;
};

export default function HomePage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [totalBooks, setTotalBooks] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Form crear autor
  const [newAuthor, setNewAuthor] = useState({
    name: '',
    email: '',
    nationality: '',
    birthYear: '',
    bio: '',
  });

  // Form editar autor
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAuthor, setEditAuthor] = useState({
    name: '',
    email: '',
    nationality: '',
    birthYear: '',
    bio: '',
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar autores y libros
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [authorsRes, booksRes] = await Promise.all([
          fetch('/api/authors'),
          fetch('/api/books'),
        ]);

        const authorsData: Author[] = await authorsRes.json();
        const booksData: Book[] = await booksRes.json();

        setAuthors(authorsData);
        setTotalBooks(booksData.length);
      } catch (error) {
        console.error('Error cargando datos iniciales', error);
        setErrorMsg('Error cargando datos iniciales');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Crear autor
  const handleCreateAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaving(true);

    try {
      const body = {
        name: newAuthor.name,
        email: newAuthor.email,
        nationality: newAuthor.nationality || undefined,
        birthYear: newAuthor.birthYear
          ? Number(newAuthor.birthYear)
          : undefined,
        bio: newAuthor.bio || undefined,
      };

      const res = await fetch('/api/authors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Error al crear autor');
      }

      const created: Author = await res.json();
      setAuthors((prev) => [created, ...prev]);

      setNewAuthor({
        name: '',
        email: '',
        nationality: '',
        birthYear: '',
        bio: '',
      });
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Preparar edición
  const startEdit = (author: Author) => {
    setEditingId(author.id);
    setEditAuthor({
      name: author.name ?? '',
      email: author.email ?? '',
      nationality: author.nationality ?? '',
      birthYear: author.birthYear?.toString() ?? '',
      bio: author.bio ?? '',
    });
  };

  // Guardar edición
  const handleUpdateAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      const body = {
        name: editAuthor.name,
        email: editAuthor.email,
        nationality: editAuthor.nationality || undefined,
        birthYear: editAuthor.birthYear
          ? Number(editAuthor.birthYear)
          : undefined,
        bio: editAuthor.bio || undefined,
      };

      const res = await fetch(`/api/authors/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Error al actualizar autor');
      }

      const updated: Author = await res.json();

      setAuthors((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );

      setEditingId(null);
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Eliminar autor
  const deleteAuthor = async (id: string) => {
    const ok = confirm('¿Seguro que deseas eliminar este autor?');
    if (!ok) return;

    setErrorMsg(null);

    try {
      const res = await fetch(`/api/authors/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Error al eliminar autor');
      }

      setAuthors((prev) => prev.filter((a) => a.id !== id));
    } catch (error: any) {
      setErrorMsg(error.message);
    }
  };

  const totalAuthors = authors.length;
  const averageBooksPerAuthor =
    totalAuthors > 0 ? (totalBooks / totalAuthors).toFixed(1) : '0';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Biblioteca</h1>
            <p className="text-slate-400">
              Next.js + Prisma + Supabase – Autores y Libros
            </p>
          </div>

          <nav className="flex gap-2">
            <Link
              href="/books"
              className="rounded-md border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
            >
              Buscar libros
            </Link>
          </nav>
        </header>

        {/* Estadísticas generales */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Total autores</p>
            <p className="mt-1 text-2xl font-semibold">{totalAuthors}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Total libros</p>
            <p className="mt-1 text-2xl font-semibold">{totalBooks}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">
              Promedio libros por autor
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {averageBooksPerAuthor}
            </p>
          </div>
        </section>

        {errorMsg && (
          <div className="rounded-md border border-red-500 bg-red-950/40 px-4 py-2 text-sm text-red-200">
            {errorMsg}
          </div>
        )}

        {/* Crear autor */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-4">
          <h2 className="text-xl font-semibold">Crear autor</h2>
          <form
            onSubmit={handleCreateAuthor}
            className="grid gap-3 md:grid-cols-2"
          >
            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300">Nombre *</label>
              <input
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                value={newAuthor.name}
                required
                onChange={(e) =>
                  setNewAuthor((v) => ({ ...v, name: e.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300">Email *</label>
              <input
                type="email"
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                value={newAuthor.email}
                required
                onChange={(e) =>
                  setNewAuthor((v) => ({ ...v, email: e.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300">Nacionalidad</label>
              <input
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                value={newAuthor.nationality}
                onChange={(e) =>
                  setNewAuthor((v) => ({
                    ...v,
                    nationality: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300">
                Año de nacimiento
              </label>
              <input
                type="number"
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                value={newAuthor.birthYear}
                onChange={(e) =>
                  setNewAuthor((v) => ({
                    ...v,
                    birthYear: e.target.value,
                  }))
                }
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="text-sm text-slate-300">Bio</label>
              <textarea
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                rows={2}
                value={newAuthor.bio}
                onChange={(e) =>
                  setNewAuthor((v) => ({ ...v, bio: e.target.value }))
                }
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-2 inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 md:col-span-2"
            >
              {saving ? 'Guardando...' : 'Crear autor'}
            </button>
          </form>
        </section>

        {/* Listado de autores */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Autores</h2>
            {loading && (
              <span className="text-xs text-slate-400">Cargando...</span>
            )}
          </div>

          {authors.length === 0 ? (
            <p className="text-sm text-slate-400">
              Todavía no hay autores creados.
            </p>
          ) : (
            <div className="space-y-2">
              {authors.map((author) => (
                <div
                  key={author.id}
                  className="flex flex-col gap-2 rounded-md border border-slate-800 bg-slate-950/60 p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium">{author.name}</p>
                    <p className="text-xs text-slate-400">{author.email}</p>
                    {author.nationality && (
                      <p className="text-xs text-slate-400">
                        {author.nationality}{' '}
                        {author.birthYear && `• ${author.birthYear}`}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => startEdit(author)}
                      className="rounded-md border border-slate-700 px-2 py-1 hover:bg-slate-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteAuthor(author.id)}
                      className="rounded-md border border-red-600 px-2 py-1 text-red-100 hover:bg-red-900/60"
                    >
                      Eliminar
                    </button>
                    <Link
                      href={`/authors/${author.id}`}
                      className="rounded-md border border-emerald-600 px-2 py-1 text-emerald-100 hover:bg-emerald-900/40"
                    >
                      Ver libros
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Form editar autor */}
        {editingId && (
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Editar autor</h2>
              <button
                onClick={() => setEditingId(null)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
            </div>

            <form
              onSubmit={handleUpdateAuthor}
              className="grid gap-3 md:grid-cols-2"
            >
              <div className="flex flex-col gap-1">
                <label className="text-sm text-slate-300">Nombre *</label>
                <input
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                  value={editAuthor.name}
                  required
                  onChange={(e) =>
                    setEditAuthor((v) => ({ ...v, name: e.target.value }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-slate-300">Email *</label>
                <input
                  type="email"
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                  value={editAuthor.email}
                  required
                  onChange={(e) =>
                    setEditAuthor((v) => ({ ...v, email: e.target.value }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-slate-300">Nacionalidad</label>
                <input
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                  value={editAuthor.nationality}
                  onChange={(e) =>
                    setEditAuthor((v) => ({
                      ...v,
                      nationality: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-slate-300">
                  Año de nacimiento
                </label>
                <input
                  type="number"
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                  value={editAuthor.birthYear}
                  onChange={(e) =>
                    setEditAuthor((v) => ({
                      ...v,
                      birthYear: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="text-sm text-slate-300">Bio</label>
                <textarea
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                  rows={2}
                  value={editAuthor.bio}
                  onChange={(e) =>
                    setEditAuthor((v) => ({ ...v, bio: e.target.value }))
                  }
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-2 inline-flex items-center justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-medium hover:bg-amber-500 disabled:opacity-50 md:col-span-2"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
