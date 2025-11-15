// app/books/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Author = {
  id: string;
  name: string;
};

type Book = {
  id: string;
  title: string;
  description?: string | null;
  isbn: string;
  publishedYear?: number | null;
  genre?: string | null;
  pages?: number | null;
  authorId: string;
  author: Author;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export default function BooksPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [genres, setGenres] = useState<string[]>([]);

  const [books, setBooks] = useState<Book[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [sortBy, setSortBy] =
    useState<'title' | 'publishedYear' | 'createdAt'>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form crear libro
  const [newBook, setNewBook] = useState({
    title: '',
    description: '',
    isbn: '',
    publishedYear: '',
    genre: '',
    pages: '',
    authorId: '',
  });

  // Form editar libro
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editBookForm, setEditBookForm] = useState({
    title: '',
    description: '',
    isbn: '',
    publishedYear: '',
    genre: '',
    pages: '',
    authorId: '',
  });

  const totalResults = useMemo(
    () => pagination?.total ?? books.length,
    [pagination, books]
  );

  // Cargar autores y géneros iniciales
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [authorsRes, allBooksRes] = await Promise.all([
          fetch('/api/authors'),
          fetch('/api/books'),
        ]);

        const authorsData: Author[] = await authorsRes.json();
        const allBooks: any[] = await allBooksRes.json();

        setAuthors(authorsData);

        const g = Array.from(
          new Set(
            allBooks
              .map((b) => b.genre)
              .filter((x: any): x is string => typeof x === 'string')
          )
        );
        setGenres(g);
      } catch (error) {
        console.error('Error cargando metadatos', error);
      }
    };

    loadMeta();
  }, []);

  // Buscar libros según filtros
  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (genre) params.set('genre', genre);
        if (authorFilter) params.set('authorName', authorFilter);
        params.set('page', String(page));
        params.set('limit', String(limit));
        params.set('sortBy', sortBy);
        params.set('order', order);

        const res = await fetch(`/api/books/search?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.message || 'Error al buscar libros');
        }

        const json = await res.json();
        setBooks(json.data as Book[]);
        setPagination(json.pagination as Pagination);
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.error(error);
        setErrorMsg(error.message);
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => controller.abort();
  }, [search, genre, authorFilter, sortBy, order, page, limit]);

  const resetFilters = () => {
    setSearch('');
    setGenre('');
    setAuthorFilter('');
    setSortBy('createdAt');
    setOrder('desc');
    setPage(1);
    setLimit(10);
  };

  // Crear libro
  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
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
        authorId: newBook.authorId,
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

      // recargar lista con los mismos filtros
      setNewBook({
        title: '',
        description: '',
        isbn: '',
        publishedYear: '',
        genre: '',
        pages: '',
        authorId: '',
      });

      // refrescar
      setPage(1);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message);
    }
  };

  // Empezar edición
  const startEditBook = (book: Book) => {
    setEditingBook(book);
    setEditBookForm({
      title: book.title ?? '',
      description: book.description ?? '',
      isbn: book.isbn ?? '',
      publishedYear: book.publishedYear?.toString() ?? '',
      genre: book.genre ?? '',
      pages: book.pages?.toString() ?? '',
      authorId: book.authorId,
    });
  };

  // Guardar edición
  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;

    setErrorMsg(null);

    try {
      const body = {
        title: editBookForm.title,
        description: editBookForm.description || undefined,
        isbn: editBookForm.isbn,
        publishedYear: editBookForm.publishedYear
          ? Number(editBookForm.publishedYear)
          : undefined,
        genre: editBookForm.genre || undefined,
        pages: editBookForm.pages
          ? Number(editBookForm.pages)
          : undefined,
        authorId: editBookForm.authorId,
      };

      const res = await fetch(`/api/books/${editingBook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Error al actualizar libro');
      }

      setEditingBook(null);
      // fuerza recarga
      setPage(1);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message);
    }
  };

  // Eliminar libro
  const deleteBook = async (id: string) => {
    const ok = confirm('¿Seguro que deseas eliminar este libro?');
    if (!ok) return;

    setErrorMsg(null);

    try {
      const res = await fetch(`/api/books/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Error al eliminar libro');
      }

      // refrescar
      setPage(1);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Libros</h1>
            <p className="text-slate-400">
              Búsqueda, filtros, paginación y CRUD.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-md border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
          >
            ← Volver al dashboard
          </Link>
        </header>

        {errorMsg && (
          <div className="rounded-md border border-red-500 bg-red-950/40 px-4 py-2 text-sm text-red-200">
            {errorMsg}
          </div>
        )}

        {/* Form crear libro */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-4">
          <h2 className="text-xl font-semibold">Crear libro</h2>
          <form
            onSubmit={handleCreateBook}
            className="grid gap-3 md:grid-cols-3"
          >
            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300">Título *</label>
              <input
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                value={newBook.title}
                required
                onChange={(e) =>
                  setNewBook((v) => ({ ...v, title: e.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300">ISBN *</label>
              <input
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                value={newBook.isbn}
                required
                onChange={(e) =>
                  setNewBook((v) => ({ ...v, isbn: e.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300">
                Autor *
              </label>
              <select
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                value={newBook.authorId}
                required
                onChange={(e) =>
                  setNewBook((v) => ({ ...v, authorId: e.target.value }))
                }
              >
                <option value="">Seleccionar autor</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300">
                Año de publicación
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
              <label className="text-sm text-slate-300">Género</label>
              <input
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                value={newBook.genre}
                onChange={(e) =>
                  setNewBook((v) => ({ ...v, genre: e.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300">Páginas</label>
              <input
                type="number"
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                value={newBook.pages}
                onChange={(e) =>
                  setNewBook((v) => ({ ...v, pages: e.target.value }))
                }
              />
            </div>

            <div className="md:col-span-3 flex flex-col gap-1">
              <label className="text-sm text-slate-300">Descripción</label>
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

        {/* Filtros y búsqueda */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">Buscar libros</h2>
            <button
              onClick={resetFilters}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Limpiar filtros
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm text-slate-300">
                Búsqueda por título
              </label>
              <input
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300">Género</label>
              <select
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                value={genre}
                onChange={(e) => {
                  setGenre(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Todos</option>
                {genres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300">Autor</label>
              <select
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                value={authorFilter}
                onChange={(e) => {
                  setAuthorFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Todos</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm text-slate-300">Ordenar por</label>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as any)
                  }
                >
                  <option value="createdAt">Fecha creación</option>
                  <option value="title">Título</option>
                  <option value="publishedYear">Año publicación</option>
                </select>
                <select
                  className="w-28 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                  value={order}
                  onChange={(e) =>
                    setOrder(e.target.value as 'asc' | 'desc')
                  }
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300">Resultados</label>
              <select
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Total encontrados: <strong>{totalResults}</strong>
            </span>
            {loading && <span>Cargando...</span>}
          </div>
        </section>

        {/* Lista de libros */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-4">
          <h2 className="text-xl font-semibold">Resultados</h2>

          {books.length === 0 ? (
            <p className="text-sm text-slate-400">
              No se encontraron libros con los filtros actuales.
            </p>
          ) : (
            <div className="space-y-2">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="flex flex-col gap-2 rounded-md border border-slate-800 bg-slate-950/60 p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium">{book.title}</p>
                    <p className="text-xs text-slate-400">
                      {book.author?.name} •{' '}
                      {book.genre || 'Sin género'}{' '}
                      {book.publishedYear && `• ${book.publishedYear}`}
                    </p>
                    {book.pages && (
                      <p className="text-xs text-slate-500">
                        {book.pages} páginas
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => startEditBook(book)}
                      className="rounded-md border border-slate-700 px-2 py-1 hover:bg-slate-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteBook(book.id)}
                      className="rounded-md border border-red-600 px-2 py-1 text-red-100 hover:bg-red-900/60"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-xs text-slate-300">
              <div>
                Página {pagination.page} de {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  disabled={!pagination.hasPrev}
                  onClick={() =>
                    setPage((p) => Math.max(1, p - 1))
                  }
                  className="rounded-md border border-slate-700 px-2 py-1 disabled:opacity-40"
                >
                  ← Anterior
                </button>
                <button
                  disabled={!pagination.hasNext}
                  onClick={() =>
                    setPage((p) =>
                      pagination.hasNext ? p + 1 : p
                    )
                  }
                  className="rounded-md border border-slate-700 px-2 py-1 disabled:opacity-40"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Form editar libro */}
        {editingBook && (
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Editar libro: {editingBook.title}
              </h2>
              <button
                onClick={() => setEditingBook(null)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
            </div>

            <form
              onSubmit={handleUpdateBook}
              className="grid gap-3 md:grid-cols-3"
            >
              <div className="flex flex-col gap-1">
                <label className="text-sm text-slate-300">Título</label>
                <input
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                  value={editBookForm.title}
                  onChange={(e) =>
                    setEditBookForm((v) => ({
                      ...v,
                      title: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-slate-300">ISBN</label>
                <input
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                  value={editBookForm.isbn}
                  onChange={(e) =>
                    setEditBookForm((v) => ({
                      ...v,
                      isbn: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-slate-300">
                  Autor
                </label>
                <select
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                  value={editBookForm.authorId}
                  onChange={(e) =>
                    setEditBookForm((v) => ({
                      ...v,
                      authorId: e.target.value,
                    }))
                  }
                >
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-slate-300">
                  Año publicación
                </label>
                <input
                  type="number"
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                  value={editBookForm.publishedYear}
                  onChange={(e) =>
                    setEditBookForm((v) => ({
                      ...v,
                      publishedYear: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-slate-300">Género</label>
                <input
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                  value={editBookForm.genre}
                  onChange={(e) =>
                    setEditBookForm((v) => ({
                      ...v,
                      genre: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-slate-300">Páginas</label>
                <input
                  type="number"
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                  value={editBookForm.pages}
                  onChange={(e) =>
                    setEditBookForm((v) => ({
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
                  value={editBookForm.description}
                  onChange={(e) =>
                    setEditBookForm((v) => ({
                      ...v,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-medium hover:bg-amber-500 md:col-span-3"
              >
                Guardar cambios
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
