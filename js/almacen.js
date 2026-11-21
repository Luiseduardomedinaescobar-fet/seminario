/**
 * almacen.js — Capa de datos de BiblioCRUD.
 *
 * Aquí viven las cuatro operaciones del CRUD (crear, leer, actualizar, eliminar).
 * Los libros se guardan en el localStorage del navegador como un arreglo en formato JSON,
 * así que los datos se conservan aunque se cierre o recargue la página.
 *
 * Ningún otro archivo toca localStorage directamente: todo pasa por este módulo.
 */
const Almacen = (() => {
  // Nombre de la "llave" donde se guarda la lista dentro de localStorage
  const CLAVE = "bibliocrud.libros";

  // Géneros permitidos (se usan en el formulario, en los filtros y en la validación)
  const GENEROS = [
    "Novela", "Cuento", "Poesía", "Ciencia", "Tecnología",
    "Historia", "Filosofía", "Infantil", "Otro",
  ];

  /** Genera un identificador único para cada libro. */
  function generarId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    // Respaldo para navegadores antiguos: fecha actual + número aleatorio
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  /** Lee el arreglo completo desde localStorage. Si no hay nada o está dañado, devuelve []. */
  function leerTodo() {
    try {
      const texto = localStorage.getItem(CLAVE);
      const datos = texto ? JSON.parse(texto) : [];
      return Array.isArray(datos) ? datos : [];
    } catch (error) {
      console.error("No se pudo leer la biblioteca guardada:", error);
      return [];
    }
  }

  /** Sobrescribe el arreglo completo en localStorage. */
  function guardarTodo(libros) {
    localStorage.setItem(CLAVE, JSON.stringify(libros));
  }

  /**
   * Deja los datos del formulario en un formato uniforme:
   * quita espacios sobrantes, convierte el año a número y borra "prestadoA" si el libro está disponible.
   */
  function normalizar(datos) {
    const estado = datos.estado === "prestado" ? "prestado" : "disponible";
    return {
      titulo: String(datos.titulo || "").trim(),
      autor: String(datos.autor || "").trim(),
      anio: Number(datos.anio),
      genero: String(datos.genero || "").trim(),
      isbn: String(datos.isbn || "").trim(),
      estado,
      prestadoA: estado === "prestado" ? String(datos.prestadoA || "").trim() : "",
    };
  }

  // ---------------------------------------------------------------- READ
  /** Devuelve una copia de todos los libros (para no modificar el original por accidente). */
  function obtenerLibros() {
    return leerTodo().map((libro) => ({ ...libro }));
  }

  /** Busca un libro por su id. Devuelve null si no existe. */
  function obtenerLibro(id) {
    const libro = leerTodo().find((l) => l.id === id);
    return libro ? { ...libro } : null;
  }

  // ---------------------------------------------------------------- CREATE
  /** Agrega un libro nuevo y lo devuelve ya con id y fechas. */
  function crearLibro(datos) {
    const libros = leerTodo();
    const ahora = new Date().toISOString();
    const nuevo = { id: generarId(), ...normalizar(datos), creadoEn: ahora, actualizadoEn: ahora };
    libros.push(nuevo);
    guardarTodo(libros);
    return { ...nuevo };
  }

  // ---------------------------------------------------------------- UPDATE
  /** Reemplaza los datos de un libro existente. Devuelve el libro actualizado o null si no existe. */
  function actualizarLibro(id, datos) {
    const libros = leerTodo();
    const posicion = libros.findIndex((l) => l.id === id);
    if (posicion === -1) return null;

    const actualizado = {
      ...libros[posicion],            // conserva id y fecha de creación
      ...normalizar(datos),           // aplica los datos nuevos
      actualizadoEn: new Date().toISOString(),
    };
    libros[posicion] = actualizado;
    guardarTodo(libros);
    return { ...actualizado };
  }

  // ---------------------------------------------------------------- DELETE
  /** Elimina un libro por id. Devuelve true si lo encontró y lo borró. */
  function eliminarLibro(id) {
    const libros = leerTodo();
    const restantes = libros.filter((l) => l.id !== id);
    if (restantes.length === libros.length) return false;
    guardarTodo(restantes);
    return true;
  }

  /** Carga unos libros de muestra para probar la app rápidamente. */
  function cargarEjemplos() {
    const ejemplos = [
      { titulo: "Cien años de soledad", autor: "Gabriel García Márquez", anio: 1967, genero: "Novela", isbn: "978-0307474728", estado: "prestado", prestadoA: "Laura Gómez" },
      { titulo: "La vorágine", autor: "José Eustasio Rivera", anio: 1924, genero: "Novela", isbn: "", estado: "disponible" },
      { titulo: "El principito", autor: "Antoine de Saint-Exupéry", anio: 1943, genero: "Infantil", isbn: "978-0156012195", estado: "disponible" },
      { titulo: "Clean Code", autor: "Robert C. Martin", anio: 2008, genero: "Tecnología", isbn: "978-0132350884", estado: "disponible" },
      { titulo: "Breves respuestas a las grandes preguntas", autor: "Stephen Hawking", anio: 2018, genero: "Ciencia", isbn: "", estado: "prestado", prestadoA: "Andrés Perdomo" },
    ];
    ejemplos.forEach((libro) => crearLibro(libro));
  }

  // Solo se expone lo necesario; el resto queda privado dentro del módulo
  return {
    GENEROS,
    obtenerLibros,
    obtenerLibro,
    crearLibro,
    actualizarLibro,
    eliminarLibro,
    cargarEjemplos,
  };
})();
