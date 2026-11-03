import Aprendiz from "../models/Aprendiz.js";
import Curso from "../models/Curso.js";

const aprendizCtrl = {};

// Registrar un nuevo aprendiz
aprendizCtrl.registerAprendiz = async (req, res) => {
  const { documento, nombre, email, curso } = req.body;
  try {
    const newAprendiz = new Aprendiz({
      documento: documento.trim(),
      nombre: nombre.toUpperCase().trim(),
      email: email.toLowerCase().trim(),
      curso,
    });
    await newAprendiz.save();
    res.json({ msg: "Aprendiz registrado correctamente" });
  } catch (error) {
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

const escapeRegex = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Listar aprendices. populate("curso") reemplaza el id por el documento completo del curso.
//
// Sin "page" devuelve el arreglo completo (lo usa el inicio para sus contadores).
// Con "page" devuelve paginado: GET /api/aprendices?page=1&limit=10&q=texto
//   -> { docs, total, page, pages, limit }
aprendizCtrl.getAprendices = async (req, res) => {
  const { status, page, limit, q } = req.query;
  try {
    const filtro = status ? { status } : {};

    if (page === undefined) {
      const aprendices = await Aprendiz.find(filtro).populate("curso").sort({ createdAt: -1 });
      return res.json(aprendices);
    }

    // Busqueda por documento, nombre, correo o curso (nombre/codigo).
    const texto = String(q || "").trim();
    if (texto) {
      const regex = new RegExp(escapeRegex(texto), "i");
      const cursos = await Curso.find({ $or: [{ nombre: regex }, { codigo: regex }] }).select("_id");
      filtro.$or = [
        { documento: regex },
        { nombre: regex },
        { email: regex },
        { curso: { $in: cursos.map((c) => c._id) } },
      ];
    }

    const porPagina = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const total = await Aprendiz.countDocuments(filtro);
    const pages = Math.max(Math.ceil(total / porPagina), 1);
    const actual = Math.min(Math.max(parseInt(page, 10) || 1, 1), pages);

    const docs = await Aprendiz.find(filtro)
      .populate("curso")
      .sort({ createdAt: -1, _id: -1 })
      .skip((actual - 1) * porPagina)
      .limit(porPagina);

    res.json({ docs, total, page: actual, pages, limit: porPagina });
  } catch (error) {
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// Obtener un aprendiz por id
aprendizCtrl.getAprendizId = async (req, res) => {
  const { id } = req.params;
  try {
    const aprendiz = await Aprendiz.findById(id).populate("curso");
    res.json(aprendiz);
  } catch (error) {
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// Listar los aprendices de un curso (ejemplo de consulta por relacion)
aprendizCtrl.getAprendicesByCurso = async (req, res) => {
  const { curso } = req.params;
  try {
    const aprendices = await Aprendiz.find({ curso, status: 0 }).populate("curso");
    res.json(aprendices);
  } catch (error) {
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// Actualizar un aprendiz
aprendizCtrl.updateAprendiz = async (req, res) => {
  const { id } = req.params;
  const { documento, nombre, email, curso } = req.body;
  try {
    await Aprendiz.findByIdAndUpdate(id, {
      documento: documento.trim(),
      nombre: nombre.toUpperCase().trim(),
      email: email.toLowerCase().trim(),
      curso,
    });
    res.json({ msg: "Aprendiz actualizado correctamente" });
  } catch (error) {
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// Activar aprendiz (status 0)
aprendizCtrl.activeAprendiz = async (req, res) => {
  const { id } = req.params;
  try {
    await Aprendiz.findByIdAndUpdate(id, { status: 0 });
    res.json({ msg: "Aprendiz activado correctamente" });
  } catch (error) {
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

// Desactivar aprendiz (status 1)
aprendizCtrl.inactiveAprendiz = async (req, res) => {
  const { id } = req.params;
  try {
    await Aprendiz.findByIdAndUpdate(id, { status: 1 });
    res.json({ msg: "Aprendiz desactivado correctamente" });
  } catch (error) {
    res.status(400).json({ msg: "No fue posible terminar la operacion" });
  }
};

export { aprendizCtrl };
