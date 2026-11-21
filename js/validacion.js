/**
 * validacion.js — Reglas que debe cumplir un libro antes de guardarse.
 *
 * validarLibro() recibe los datos del formulario y devuelve:
 *   { valido: true/false, errores: { campo: "mensaje" } }
 * La interfaz usa ese objeto para mostrar cada mensaje debajo de su campo.
 */
const Validacion = (() => {
  const ANIO_MINIMO = 1000;

  /** Quita guiones y espacios de un ISBN para revisar solo sus caracteres. */
  function limpiarIsbn(isbn) {
    return String(isbn || "").replace(/[-\s]/g, "").toUpperCase();
  }

  /** Un ISBN válido tiene 13 dígitos, o 10 caracteres donde el último puede ser X. */
  function isbnTieneFormato(isbn) {
    const limpio = limpiarIsbn(isbn);
    return /^\d{13}$/.test(limpio) || /^\d{9}[\dX]$/.test(limpio);
  }

  /** Compara textos sin importar mayúsculas, tildes ni espacios extra. */
  function textoComparable(texto) {
    return String(texto || "")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .trim().toLowerCase().replace(/\s+/g, " ");
  }

  /**
   * Valida los datos de un libro.
   * @param {object} datos          Valores del formulario.
   * @param {Array}  librosActuales Lista guardada (para detectar duplicados).
   * @param {string} idEnEdicion    Id del libro que se está editando (se excluye de la búsqueda de duplicados).
   */
  function validarLibro(datos, librosActuales = [], idEnEdicion = "") {
    const errores = {};
    const titulo = String(datos.titulo || "").trim();
    const autor = String(datos.autor || "").trim();
    const anioTexto = String(datos.anio ?? "").trim();
    const anio = Number(anioTexto);
    const anioActual = new Date().getFullYear();

    // Título y autor: obligatorios y con un largo razonable
    if (!titulo) errores.titulo = "Escribe el título del libro.";
    else if (titulo.length < 2) errores.titulo = "El título debe tener al menos 2 caracteres.";

    if (!autor) errores.autor = "Escribe el nombre del autor.";
    else if (autor.length < 2) errores.autor = "El autor debe tener al menos 2 caracteres.";

    // Año: número entero entre 1000 y el año actual
    if (!anioTexto) errores.anio = "Escribe el año de publicación.";
    else if (!Number.isInteger(anio) || anio < ANIO_MINIMO || anio > anioActual) {
      errores.anio = `El año debe ser un número entre ${ANIO_MINIMO} y ${anioActual}.`;
    }

    // Género: debe ser uno de la lista
    if (!Almacen.GENEROS.includes(datos.genero)) errores.genero = "Selecciona un género.";

    // ISBN: opcional, pero si se escribe debe tener formato válido
    if (String(datos.isbn || "").trim() && !isbnTieneFormato(datos.isbn)) {
      errores.isbn = "El ISBN debe tener 10 o 13 dígitos (el de 10 puede terminar en X).";
    }

    // Si el libro está prestado, hay que saber a quién
    if (datos.estado === "prestado" && !String(datos.prestadoA || "").trim()) {
      errores.prestadoA = "Indica a quién se prestó el libro.";
    }

    // Evita registrar dos veces el mismo título del mismo autor
    if (!errores.titulo && !errores.autor) {
      const repetido = librosActuales.some((libro) =>
        libro.id !== idEnEdicion &&
        textoComparable(libro.titulo) === textoComparable(titulo) &&
        textoComparable(libro.autor) === textoComparable(autor));
      if (repetido) errores.titulo = "Ya existe un libro con este título y este autor.";
    }

    return { valido: Object.keys(errores).length === 0, errores };
  }

  return { validarLibro, textoComparable };
})();
