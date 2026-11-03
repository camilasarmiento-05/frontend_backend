/**
 * Middleware que revisa los errores acumulados por express-validator.
 * Si hay errores responde 400 con UN SOLO mensaje (el primero, que sigue el mismo
 * orden de los campos del formulario del frontend); si no, continua (next).
 * Asi el usuario corrige un campo a la vez en lugar de ver todos los errores juntos.
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
import { validationResult } from "express-validator";

const validateFields = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const [primero] = errors.array();
    return res.status(400).json({ msg: "Error en la validacion", errors: [primero.msg] });
  }
  next();
};

export { validateFields };
