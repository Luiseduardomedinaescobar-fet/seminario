/**
 * app.js — Punto de entrada. Conecta los eventos de la página con el CRUD.
 *
 * Flujo general:
 *   1. El usuario hace algo (envía el formulario, pulsa Editar o Eliminar, escribe en el buscador).
 *   2. app.js valida (Validacion) y guarda o borra (Almacen).
 *   3. app.js vuelve a pintar la pantalla (Interfaz) con los datos actualizados.
 */
(() => {
  const form = document.getElementById("form-libro");
  const cuerpoTabla = document.getElementById("cuerpo-tabla");
  const filtros = {
    buscar: document.getElementById("buscar"),
    estado: document.getElementById("filtro-estado"),
    genero: document.getElementById("filtro-genero"),
    orden: document.getElementById("orden"),
  };

  // ---------------------------------------------------------------- READ: filtrar, ordenar y pintar

  /** Aplica búsqueda, filtros y orden sobre la lista completa. */
  function filtrarYOrdenar(libros) {
    const texto = Validacion.textoComparable(filtros.buscar.value);
    const estado = filtros.estado.value;
    const genero = filtros.genero.value;

    const visibles = libros.filter((libro) => {
      const coincideTexto = !texto || [libro.titulo, libro.autor, libro.isbn]
        .some((valor) => Validacion.textoComparable(valor).includes(texto));
      const coincideEstado = estado === "todos" || libro.estado === estado;
      const coincideGenero = genero === "todos" || libro.genero === genero;
      return coincideTexto && coincideEstado && coincideGenero;
    });

    const comparar = (a, b) => a.localeCompare(b, "es", { sensitivity: "base" });
    const criterios = {
      recientes: (a, b) => b.creadoEn.localeCompare(a.creadoEn),
      titulo: (a, b) => comparar(a.titulo, b.titulo),
      autor: (a, b) => comparar(a.autor, b.autor),
      "anio-asc": (a, b) => a.anio - b.anio,
      "anio-desc": (a, b) => b.anio - a.anio,
    };
    return visibles.sort(criterios[filtros.orden.value] || criterios.recientes);
  }

  /** Vuelve a pintar la lista y las estadísticas con lo que hay guardado. */
  function refrescar() {
    const libros = Almacen.obtenerLibros();
    Interfaz.renderizarEstadisticas(libros);
    Interfaz.renderizarLista(filtrarYOrdenar(libros), libros.length);
  }

  // ---------------------------------------------------------------- CREATE y UPDATE: envío del formulario

  function alEnviarFormulario(evento) {
    evento.preventDefault();
    const datos = Interfaz.leerFormulario();
    const id = Interfaz.idEnEdicion();
    const { valido, errores } = Validacion.validarLibro(datos, Almacen.obtenerLibros(), id);

    if (!valido) {
      Interfaz.mostrarErrores(errores);
      Interfaz.notificar("Revisa los campos marcados.", "error");
      return;
    }

    if (id) {
      // UPDATE: hay un id en el formulario, así que se edita ese libro
      const actualizado = Almacen.actualizarLibro(id, datos);
      if (actualizado) Interfaz.notificar(`Se actualizó «${actualizado.titulo}».`);
      else Interfaz.notificar("El libro ya no existe.", "error");
    } else {
      // CREATE: no hay id, así que es un libro nuevo
      const nuevo = Almacen.crearLibro(datos);
      Interfaz.notificar(`Se agregó «${nuevo.titulo}».`);
    }

    Interfaz.reiniciarFormulario();
    refrescar();
  }

  // ---------------------------------------------------------------- UPDATE y DELETE: botones de la tabla

  /** Un solo "escuchador" en la tabla atiende todos los botones (delegación de eventos). */
  async function alPulsarEnTabla(evento) {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return;

    const libro = Almacen.obtenerLibro(boton.dataset.id);
    if (!libro) {
      Interfaz.notificar("No se encontró el libro.", "error");
      refrescar();
      return;
    }

    if (boton.dataset.accion === "editar") {
      Interfaz.iniciarEdicion(libro);
      return;
    }

    if (boton.dataset.accion === "eliminar") {
      const confirmado = await Interfaz.confirmarEliminacion(libro);
      if (!confirmado) return;

      Almacen.eliminarLibro(libro.id);
      // Si justo se estaba editando ese libro, se limpia el formulario
      if (Interfaz.idEnEdicion() === libro.id) Interfaz.reiniciarFormulario();
      Interfaz.notificar(`Se eliminó «${libro.titulo}».`, "info");
      refrescar();
    }
  }

  // ---------------------------------------------------------------- Inicio

  function iniciar() {
    Interfaz.llenarGeneros(Almacen.GENEROS);
    Interfaz.reiniciarFormulario();

    form.addEventListener("submit", alEnviarFormulario);
    form.addEventListener("change", (e) => { if (e.target.name === "estado") Interfaz.actualizarCampoPrestado(); });
    document.getElementById("btn-cancelar").addEventListener("click", () => {
      Interfaz.reiniciarFormulario();
      Interfaz.notificar("Edición cancelada.", "info");
    });
    cuerpoTabla.addEventListener("click", alPulsarEnTabla);

    // Cualquier cambio en el buscador, filtros u orden vuelve a pintar la lista
    filtros.buscar.addEventListener("input", refrescar);
    [filtros.estado, filtros.genero, filtros.orden].forEach((s) => s.addEventListener("change", refrescar));

    document.getElementById("btn-ejemplos").addEventListener("click", () => {
      Almacen.cargarEjemplos();
      Interfaz.notificar("Se cargaron 5 libros de ejemplo.", "info");
      refrescar();
    });

    refrescar();
  }

  iniciar();
})();
