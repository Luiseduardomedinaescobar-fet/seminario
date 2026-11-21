/**
 * interfaz.js — Todo lo que se ve en pantalla.
 *
 * Este módulo no guarda datos: solo lee el formulario, pinta la tabla,
 * muestra errores y mensajes. Los datos los entrega app.js.
 * Para evitar inyección de HTML, el texto del usuario siempre se inserta con textContent.
 */
const Interfaz = (() => {
  // Referencias a los elementos del HTML que se usan varias veces
  const el = {
    form: document.getElementById("form-libro"),
    id: document.getElementById("libro-id"),
    tituloFormulario: document.getElementById("titulo-formulario"),
    avisoEdicion: document.getElementById("aviso-edicion"),
    btnGuardar: document.getElementById("btn-guardar"),
    btnCancelar: document.getElementById("btn-cancelar"),
    genero: document.getElementById("genero"),
    campoPrestadoA: document.getElementById("campo-prestado-a"),
    filtroGenero: document.getElementById("filtro-genero"),
    cuerpoTabla: document.getElementById("cuerpo-tabla"),
    tabla: document.getElementById("tabla-libros"),
    contador: document.getElementById("contador"),
    estadoVacio: document.getElementById("estado-vacio"),
    estadoVacioTexto: document.getElementById("estado-vacio-texto"),
    btnEjemplos: document.getElementById("btn-ejemplos"),
    statTotal: document.getElementById("stat-total"),
    statDisponibles: document.getElementById("stat-disponibles"),
    statPrestados: document.getElementById("stat-prestados"),
    dialogo: document.getElementById("dialogo-eliminar"),
    dialogoLibro: document.getElementById("dialogo-libro"),
    notificaciones: document.getElementById("notificaciones"),
  };

  const CAMPOS = ["titulo", "autor", "anio", "genero", "isbn", "prestadoA"];

  // Íconos pequeños en SVG para los botones de la tabla
  const ICONOS = {
    editar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    eliminar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 11v6M14 11v6M7 7l1 13h8l1-13M9 7V4h6v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  // ---------------------------------------------------------------- Formulario

  /** Llena los <select> de género del formulario y del filtro. */
  function llenarGeneros(generos) {
    el.genero.replaceChildren(new Option("Selecciona…", ""), ...generos.map((g) => new Option(g, g)));
    el.filtroGenero.replaceChildren(new Option("Todos los géneros", "todos"), ...generos.map((g) => new Option(g, g)));
  }

  /** Devuelve un objeto con los valores actuales del formulario. */
  function leerFormulario() {
    const datos = Object.fromEntries(new FormData(el.form).entries());
    return {
      titulo: datos.titulo || "",
      autor: datos.autor || "",
      anio: datos.anio || "",
      genero: datos.genero || "",
      isbn: datos.isbn || "",
      estado: datos.estado || "disponible",
      prestadoA: datos.prestadoA || "",
    };
  }

  /** Muestra u oculta el campo "Prestado a" según el estado elegido. */
  function actualizarCampoPrestado() {
    const prestado = el.form.elements.estado.value === "prestado";
    el.campoPrestadoA.hidden = !prestado;
    if (!prestado) {
      el.form.elements.prestadoA.value = "";
      mostrarError("prestadoA", "");
    }
  }

  /** Pone el formulario en modo "editar" con los datos del libro elegido. */
  function iniciarEdicion(libro) {
    limpiarErrores();
    el.id.value = libro.id;
    CAMPOS.forEach((campo) => { el.form.elements[campo].value = libro[campo] ?? ""; });
    el.form.elements.estado.value = libro.estado;
    actualizarCampoPrestado();

    el.tituloFormulario.textContent = "Editar libro";
    el.btnGuardar.textContent = "Guardar cambios";
    el.btnCancelar.hidden = false;
    el.avisoEdicion.hidden = false;
    el.form.closest(".tarjeta").classList.add("formulario--editando");
    el.form.elements.titulo.focus();
    el.form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /** Limpia el formulario y lo devuelve al modo "agregar". */
  function reiniciarFormulario() {
    el.form.reset();
    el.id.value = "";
    limpiarErrores();
    actualizarCampoPrestado();
    el.tituloFormulario.textContent = "Agregar libro";
    el.btnGuardar.textContent = "Agregar libro";
    el.btnCancelar.hidden = true;
    el.avisoEdicion.hidden = true;
    el.form.closest(".tarjeta").classList.remove("formulario--editando");
  }

  /** Id del libro en edición ("" si estamos agregando uno nuevo). */
  function idEnEdicion() {
    return el.id.value;
  }

  function mostrarError(campo, mensaje) {
    const entrada = el.form.elements[campo];
    const parrafo = document.getElementById(`error-${campo}`);
    if (!entrada || !parrafo) return;
    parrafo.textContent = mensaje;
    entrada.setAttribute("aria-invalid", mensaje ? "true" : "false");
  }

  /** Pinta todos los errores y pone el foco en el primer campo con problema. */
  function mostrarErrores(errores) {
    limpiarErrores();
    Object.entries(errores).forEach(([campo, mensaje]) => mostrarError(campo, mensaje));
    const primero = CAMPOS.find((c) => errores[c]);
    if (primero) el.form.elements[primero].focus();
  }

  function limpiarErrores() {
    CAMPOS.forEach((campo) => mostrarError(campo, ""));
  }

  // ---------------------------------------------------------------- Listado

  /** Crea una fila <tr> para un libro. Cada celda lleva data-etiqueta para la vista móvil. */
  function crearFila(libro) {
    const fila = document.createElement("tr");
    fila.dataset.id = libro.id;

    // Celda de título (con el ISBN debajo si existe)
    const celdaTitulo = celda("Título");
    const titulo = document.createElement("strong");
    titulo.textContent = libro.titulo;
    celdaTitulo.append(titulo);
    if (libro.isbn) {
      const isbn = document.createElement("span");
      isbn.className = "tabla__detalle";
      isbn.textContent = `ISBN ${libro.isbn}`;
      celdaTitulo.append(isbn);
    }

    const celdaAutor = celda("Autor", libro.autor);
    const celdaAnio = celda("Año", String(libro.anio));
    const celdaGenero = celda("Género", libro.genero);

    // Etiqueta de color para el estado
    const celdaEstado = celda("Estado");
    const etiqueta = document.createElement("span");
    etiqueta.className = `etiqueta etiqueta--${libro.estado}`;
    etiqueta.textContent = libro.estado === "prestado" ? "Prestado" : "Disponible";
    celdaEstado.append(etiqueta);
    if (libro.estado === "prestado") {
      const persona = document.createElement("span");
      persona.className = "tabla__detalle";
      persona.textContent = `a ${libro.prestadoA}`;
      celdaEstado.append(persona);
    }

    // Botones de acción: el id va en data-id para saber sobre qué libro actuar
    const celdaAcciones = celda("Acciones");
    celdaAcciones.className = "tabla__acciones";
    celdaAcciones.append(
      botonAccion("editar", "Editar", libro),
      botonAccion("eliminar", "Eliminar", libro),
    );

    fila.append(celdaTitulo, celdaAutor, celdaAnio, celdaGenero, celdaEstado, celdaAcciones);
    return fila;
  }

  function celda(etiqueta, texto = "") {
    const td = document.createElement("td");
    td.dataset.etiqueta = etiqueta;
    td.textContent = texto;
    return td;
  }

  function botonAccion(accion, texto, libro) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = `boton-icono boton-icono--${accion}`;
    boton.dataset.accion = accion;
    boton.dataset.id = libro.id;
    boton.setAttribute("aria-label", `${texto} «${libro.titulo}»`);
    boton.title = texto;
    boton.innerHTML = ICONOS[accion]; // ícono fijo del código, no viene del usuario
    const rotulo = document.createElement("span");
    rotulo.textContent = texto;
    boton.append(rotulo);
    return boton;
  }

  /**
   * Pinta la lista de libros.
   * @param {Array}  visibles Libros que pasan los filtros (ya ordenados).
   * @param {number} total    Cantidad total de libros guardados.
   */
  function renderizarLista(visibles, total) {
    el.cuerpoTabla.replaceChildren(...visibles.map(crearFila));

    const hayLibros = total > 0;
    const hayResultados = visibles.length > 0;
    el.tabla.hidden = !hayResultados;
    el.estadoVacio.hidden = hayResultados;
    el.btnEjemplos.hidden = hayLibros;
    el.estadoVacioTexto.textContent = hayLibros
      ? "No hay libros que coincidan con la búsqueda o los filtros."
      : "Todavía no hay libros registrados. Agrega el primero con el formulario.";
    el.contador.textContent = `Mostrando ${visibles.length} de ${total}`;
  }

  /** Actualiza los números del encabezado. */
  function renderizarEstadisticas(libros) {
    const prestados = libros.filter((l) => l.estado === "prestado").length;
    el.statTotal.textContent = libros.length;
    el.statPrestados.textContent = prestados;
    el.statDisponibles.textContent = libros.length - prestados;
  }

  // ---------------------------------------------------------------- Mensajes

  /** Muestra un mensaje corto que desaparece solo. tipo: "exito" | "info" | "error" */
  function notificar(mensaje, tipo = "exito") {
    const aviso = document.createElement("div");
    aviso.className = `notificacion notificacion--${tipo}`;
    aviso.textContent = mensaje;
    el.notificaciones.append(aviso);
    setTimeout(() => aviso.classList.add("notificacion--saliendo"), 2600);
    setTimeout(() => aviso.remove(), 3000);
  }

  /** Abre el diálogo de confirmación y resuelve true si el usuario confirma. */
  function confirmarEliminacion(libro) {
    el.dialogoLibro.textContent = `«${libro.titulo}» de ${libro.autor}`;
    el.dialogo.returnValue = "";
    el.dialogo.showModal();
    return new Promise((resolver) => {
      el.dialogo.addEventListener("close", () => resolver(el.dialogo.returnValue === "confirmar"), { once: true });
    });
  }

  return {
    llenarGeneros,
    leerFormulario,
    actualizarCampoPrestado,
    iniciarEdicion,
    reiniciarFormulario,
    idEnEdicion,
    mostrarErrores,
    limpiarErrores,
    renderizarLista,
    renderizarEstadisticas,
    notificar,
    confirmarEliminacion,
  };
})();
