// Definición de las tres pantallas de listado (usuarios, aprendices, cursos).
// cols: l = título de la columna, v = cómo sacar el valor, badge = muestra Activo/Inactivo.
export const HOME = { key: "inicio", title: "Inicio", sub: "Resumen de tu centro de formación" };

export const VIEWS = {
  usuarios: {
    key: "usuarios", title: "Usuarios", sub: "Personas con acceso a la plataforma", noun: "usuario",
    url: "/usuarios", create: "/usuarios/register",
    fields: [
      { k: "nombre", l: "Nombre completo" },
      { k: "email", l: "Correo electrónico", t: "email" },
      { k: "password", l: "Contraseña (mínimo 6 caracteres)", t: "password" }
    ],
    cols: [
      { l: "Nombre", v: (r) => r.nombre }, { l: "Correo", v: (r) => r.email },
      { l: "Rol", v: (r) => r.rol }, { l: "Estado", badge: true }
    ]
  },
  aprendices: {
    key: "aprendices", title: "Aprendices", sub: "Personas en formación y su curso", noun: "aprendiz",
    url: "/aprendices", create: "/aprendices/register", update: "/aprendices/update/", edit: true,
    fields: [
      { k: "documento", l: "Documento" },
      { k: "nombre", l: "Nombre completo" },
      { k: "email", l: "Correo electrónico", t: "email" },
      { k: "curso", l: "Curso", t: "select" }
    ],
    cols: [
      { l: "Documento", v: (r) => r.documento }, { l: "Nombre", v: (r) => r.nombre },
      { l: "Correo", v: (r) => r.email }, { l: "Curso", v: (r) => r.curso?.nombre || "Sin curso" },
      { l: "Estado", badge: true }
    ]
  },
  cursos: {
    key: "cursos", title: "Cursos", sub: "Programas de formación disponibles", noun: "curso",
    url: "/cursos", create: "/cursos/register", update: "/cursos/update/", edit: true,
    fields: [
      { k: "codigo", l: "Código" },
      { k: "nombre", l: "Nombre del curso" },
      { k: "duracion", l: "Duración en horas", t: "number" }
    ],
    cols: [
      { l: "Código", v: (r) => r.codigo }, { l: "Nombre", v: (r) => r.nombre },
      { l: "Duración", v: (r) => r.duracion + " h" }, { l: "Estado", badge: true }
    ]
  }
};
