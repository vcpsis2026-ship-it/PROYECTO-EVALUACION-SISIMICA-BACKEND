import db from "../../../data/database.js";
import * as utils from "../../../utils.js";
import AnomalyCode from "../../../anomaly.js";
import bucket from "../../shared/supabase/supabase.js";
import { UpdateUsuarioSchema, UpdateRolSchema } from "./usuarios.schema.js";
import usuariosRepository from "./usuarios.repository.js";

const getAll = (activo = null) => usuariosRepository.findAll(activo);

const getByRole = (rol) => usuariosRepository.findByRole(rol);

const getById = async (id, soloActivos = true) => {
  const user = await usuariosRepository.findById(id, soloActivos);
  if (!user) throw new utils.CustomError(AnomalyCode.userDoesNotExist, "Usuario no encontrado");
  return user;
};

const update = async (id, body, file) => {
  const current = await getById(id, false); // Permitir editar inactivos
  const parsed = UpdateUsuarioSchema.parse(body);

  const data = {
    nombre: parsed.nombre?.trim() || current.nombre,
    email: parsed.email?.trim() || current.email,
    cedula: parsed.cedula?.trim() || current.cedula,
    telefono: parsed.telefono?.trim() || current.telefono,
    direccion: parsed.direccion?.trim() || current.direccion,
  };

  if (parsed.password) {
    const { password_hash } = await usuariosRepository.findPasswordHash(id);
    const valid = await utils.verifyPassword(parsed.currentPassword, password_hash);
    if (!valid) throw new utils.CustomError(AnomalyCode.wrongPassword, "La contraseña actual es incorrecta");
    data.password_hash = await utils.hashPassword(parsed.password);
  }

  if (file && file.buffer) {
    const fileName = `users/${Date.now()}-${file.originalname}`;
    const { data: uploaded, error } = await bucket
      .from(process.env.STORAGE_BUCKET)
      .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = bucket.from(process.env.STORAGE_BUCKET).getPublicUrl(fileName);
    data.foto_perfil_url = publicUrl;
  }

  const trx = await db.transaction();
  try {
    const [user] = await usuariosRepository.update(trx, id, data);
    await trx.commit();
    return user;
  } catch (error) {
    await trx.rollback();
    throw new utils.CustomError(AnomalyCode.dataBaseError, error.message);
  }
};

const updateRol = async (id, body) => {
  const { rol } = UpdateRolSchema.parse(body);
  await getById(id, false);

  const trx = await db.transaction();
  try {
    const [user] = await usuariosRepository.updateRol(trx, id, rol);
    await trx.commit();
    return user;
  } catch (error) {
    await trx.rollback();
    throw new utils.CustomError(AnomalyCode.dataBaseError, error.message);
  }
};

const updateEstado = async (id, activo) => {
  await getById(id, false); // Verificar que existe, incluso si está inactivo

  const trx = await db.transaction();
  try {
    const [user] = await usuariosRepository.updateEstado(trx, id, activo);
    await trx.commit();
    return user;
  } catch (error) {
    await trx.rollback();
    throw new utils.CustomError(AnomalyCode.dataBaseError, error.message);
  }
};

export default { getAll, getByRole, getById, update, updateRol, updateEstado };
