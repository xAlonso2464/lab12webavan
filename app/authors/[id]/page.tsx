// app/authors/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type Author = {
  id: string;
  name: string;
  email: string;
  nationality?: string | null;
  birthYear?: number | null;
  bio?: string | null;
};

type Book = {
  id: string;
  title: string;
  publishedYear?: number | null;
  genre?: string | null;
  pages?: number | null;
};

type AuthorStats = {
  authorId: string;
  authorName: string;
  totalBooks: number;
  firstBook: { title: string; year: number | null } | null;
  latestBook: { title: string; year: number | null } | null;
  averagePages: number;
  genres: string[];
  longestBook: { title: string; pages: number | null } | null;
  shortestBook: { title: string; pages: number | null } | null;
};

export default function AuthorDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as string;

  const [author, setAuthor] = useState<Author | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [stats, setStats] = useState<AuthorStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form editar autor
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    nationality: '',
    birthYear: '',
    bio: '',
  });

  // Form agregar libro a este autor
  const [newBook, setNewBook] = useState({
    title: '',
    description: '',
    isbn: '',
    publishedYear: '',
    genre: '',
    pages: '',
  });

  // Cargar datos del autor
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const [authorRes, statsRes] = await Promise.all([
          fetch(`/api/authors/${id}`),
          fetch(`/api/authors/${id}/stats`),
        ]);

        if (!authorRes.ok) {
          const data = await authorRes.json().catch(() => null);
          throw new Error(data?.message || 'Error cargando autor');
        }

        const authorJson = await authorRes.json();
        const authorData: Author = {
          id: authorJson.id,
          name: authorJson.name,
          email: authorJson.email,
          nationality: authorJson.nationality,
          birthYear: authorJson.birthYear,
          bio: authorJson.bio,
        };

        setAuthor(authorData);
        setBooks(authorJson.books || []);

        setEditForm({
          name: authorData.name ?? '',
          email: authorData.email ?? '',
          nationality: authorData.nationality ?? '',
          birthYear: authorData.birthYear?.toString() ?? '',
          bio: authorData.bio ?? '',
        });

        if (!statsRes.ok) {
          const data = await statsRes.json().catch(() => null);
          throw new Error(data?.message || 'Error cargando estadísticas');
        }

        const statsJson: AuthorStats = await statsRes.json();
        setStats(statsJson);
      } catch (error: any) {
        console.error(error);
        setErrorMsg(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  const handleUpdateAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author) return;

    setErrorMsg(null);

    try {
      const body = {
        name: editForm.name,
        email: editForm.email,
        nationality: editForm.nationality || undefined,
        birthYear: editForm.birthYear
          ? Number(editForm.birthYear)
          : undefined,
        bio: editForm.bio || undefined,
      };

      const res = await fetch(`/api/authors/${author.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Error al actualizar autor');
      }

      const updated = await res.json();
      setAuthor(updated);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message);
    }
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author) return;

    setErrorMsg(null);

    try {
      const body = {
        title: newBook.title,
        description: newBook.description || undefined,
        isbn: newBook.isbn,
        publishedYear: newBook.publishedYear
          ? Number(newBook.publishedYear)
          : undefined,
        genre: newBook.genre || undefined,
        pages: newBook.pages ? Number(newBook.pages) : undefined,
        authorId: author.id,
      };

      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Error al crear libro');
      }

      // recargar datos del autor y stats
      setNewBook({
        title: '',
        description: '',
        isbn: '',
        publishedYear: '',
        genre: '',
        pages: '',
      });

      const [authorRes, statsRes] = await Promise.all([
        fetch(`/api/authors/${id}`),
        fetch(`/api/authors/${id}/stats`),
      ]);

      const authorJson = await authorRes.json();
      setBooks(authorJson.books || []);

      const statsJson: AuthorStats = await statsRes.json();
      setStats(statsJson);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Detalle de autor
            </h1>
            {author && (
              <p className="text-slate-400">{author.name}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="rounded-md border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
            >
              ← Dashboard
            </Link>
            <Link
              href="/books"
              className="rounded-md border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
            >
              Buscar libros
            </Link>
          </div>
        </header>

        {errorMsg && (
          <div className="rounded-md border border-red-500 bg-red-950/40 px-4 py-2 text-sm text-red-200">
            {errorMsg}
          </div>
        )}

        {loading && (
          <p className="text-sm text-slate-400">Cargando...</p>
        )}

        {!loading && author && (
          <>
            {/* Info autor y estadísticas */}
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-2">
                <h2 className="text-xl font-semibold">Información</h2>
                <p className="text-sm">
                  <span className="font-medium">Nombre: </span>
                  {author.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Email: </span>
                  {author.email}
                </p>
                {author.nationality && (
                  <p className="text-sm">
                    <span className="font-medium">
                      Nacionalidad:{' '}
                    </span>
                    {author.nationality}
                  </p>
                )}
                {author.birthYear && (
                  <p className="text-sm">
                    <span className="font-medium">
                      Año de nacimiento:{' '}
                    </span>
                    {author.birthYear}
                  </p>
                )}
                {author.bio && (
                  <p className="text-sm text-slate-300">
                    <span className="font-medium">Bio: </span>
                    {author.bio}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-2">
                <h2 className="text-xl font-semibold">
                  Estadísticas
                </h2>
                {!stats ? (
                  <p className="text-sm text-slate-400">
                    Sin estadísticas.
                  </p>
                ) : (
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">
                        Total libros:{' '}
                      </span>
                      {stats.totalBooks}
                    </p>
                    {stats.firstBook && (
                      <p>
                        <span className="font-medium">
                          Primer libro:{' '}
                        </span>
                        {stats.firstBook.title} (
                        {stats.firstBook.year ?? '–'})
                      </p>
                    )}
                    {stats.latestBook && (
                      <p>
                        <span className="font-medium">
                          Último libro:{' '}
                        </span>
                        {stats.latestBook.title} (
                        {stats.latestBook.year ?? '–'})
                      </p>
                    )}
                    <p>
                      <span className="font-medium">
                        Promedio de páginas:{' '}
                      </span>
                      {stats.averagePages}
                    </p>
                    {stats.genres.length > 0 && (
                      <p>
                        <span className="font-medium">
                          Géneros:{' '}
                        </span>
                        {stats.genres.join(', ')}
                      </p>
                    )}
                    {stats.longestBook && (
                      <p>
                        <span className="font-medium">
                          Libro más largo:{' '}
                        </span>
                        {stats.longestBook.title} (
                        {stats.longestBook.pages ?? '–'} págs)
                      </p>
                    )}
                    {stats.shortestBook && (
                      <p>
                        <span className="font-medium">
                          Libro más corto:{' '}
                        </span>
                        {stats.shortestBook.title} (
                        {stats.shortestBook.pages ?? '–'} págs)
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Lista de libros */}
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-4">
              <h2 className="text-xl font-semibold">
                Libros de este autor
              </h2>

              {books.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Aún no hay libros registrados para este autor.
                </p>
              ) : (
                <div className="space-y-2">
                  {books.map((book) => (
                    <div
                      key={book.id}
                      className="rounded-md border border-slate-800 bg-slate-950/60 p-3"
                    >
                      <p className="font-medium">{book.title}</p>
                      <p className="text-xs text-slate-400">
                        {book.genre || 'Sin género'}{' '}
                        {book.publishedYear &&
                          `• ${book.publishedYear}`}{' '}
                        {book.pages && `• ${book.pages} págs`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Editar autor */}
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-4">
              <h2 className="text-xl font-semibold">Editar autor</h2>
              <form
                onSubmit={handleUpdateAuthor}
                className="grid gap-3 md:grid-cols-2"
              >
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-slate-300">
                    Nombre
                  </label>
                  <input
                    className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((v) => ({
                        ...v,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-slate-300">
                    Email
                  </label>
                  <input
                    type="email"
                    className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((v) => ({
                        ...v,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-slate-300">
                    Nacionalidad
                  </label>
                  <input
                    className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                    value={editForm.nationality}
                    onChange={(e) =>
                      setEditForm((v) => ({
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
                    value={editForm.birthYear}
                    onChange={(e) =>
                      setEditForm((v) => ({
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
                    value={editForm.bio}
                    onChange={(e) =>
                      setEditForm((v) => ({
                        ...v,
                        bio: e.target.value,
                      }))
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="mt-2 inline-flex items-center justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-medium hover:bg-amber-500 md:col-span-2"
                >
                  Guardar cambios
                </button>
              </form>
            </section>

            {/* Agregar libro a este autor */}
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-4">
              <h2 className="text-xl font-semibold">
                Agregar libro a este autor
              </h2>
              <form
                onSubmit={handleCreateBook}
                className="grid gap-3 md:grid-cols-3"
              >
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-slate-300">
                    Título *
                  </label>
                  <input
                    className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                    value={newBook.title}
                    required
                    onChange={(e) =>
                      setNewBook((v) => ({
                        ...v,
                        title: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-slate-300">
                    ISBN *
                  </label>
                  <input
                    className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                    value={newBook.isbn}
                    required
                    onChange={(e) =>
                      setNewBook((v) => ({
                        ...v,
                        isbn: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-slate-300">
                    Año publicación
                  </label>
                  <input
                    type="number"
                    className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                    value={newBook.publishedYear}
                    onChange={(e) =>
                      setNewBook((v) => ({
                        ...v,
                        publishedYear: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-slate-300">
                    Género
                  </label>
                  <input
                    className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                    value={newBook.genre}
                    onChange={(e) =>
                      setNewBook((v) => ({
                        ...v,
                        genre: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-slate-300">
                    Páginas
                  </label>
                  <input
                    type="number"
                    className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                    value={newBook.pages}
                    onChange={(e) =>
                      setNewBook((v) => ({
                        ...v,
                        pages: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="md:col-span-3 flex flex-col gap-1">
                  <label className="text-sm text-slate-300">
                    Descripción
                  </label>
                  <textarea
                    className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                    rows={2}
                    value={newBook.description}
                    onChange={(e) =>
                      setNewBook((v) => ({
                        ...v,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="mt-2 inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500 md:col-span-3"
                >
                  Crear libro
                </button>
              </form>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
