import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import db from "../../../data/database.js";
import DatabaseTable from "../../../data/databaseTables.js";
import * as utils from "../../../utils.js";
import AnomalyCode from "../../../anomaly.js";
import bucket from "../../shared/supabase/supabase.js";
import { sendResetEmail } from "../../shared/services/emailService.js";
import { LoginSchema, RegisterSchema, ProfilePictureSchema } from "./auth.schema.js";
import authRepository from "./auth.repository.js";

const login = async (body) => {
  const { email, password } = LoginSchema.parse(body);

  const user = await authRepository.findByEmail(email);
  if (!user) {
    throw new utils.CustomError(AnomalyCode.userDoesNotExist, "El usuario no existe");
  }

  const isMatch = await utils.verifyPassword(password, user.password_hash);
  if (!isMatch) {
    throw new utils.CustomError(AnomalyCode.wrongPassword, "Credenciales inválidas");
  }

  const token = jwt.sign(
    { id: user.id_usuario, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "1h" }
  );

  return { user, token };
};

const register = async (body, file) => {
  const parsedData = RegisterSchema.parse(body);

  let foto_perfil_url = "";
  if (file && file.buffer) {
    ProfilePictureSchema.parse({ foto_perfil: file });
    const fileName = `users/${Date.now()}-${file.originalname}`;
    const { data, error } = await bucket
      .from(process.env.STORAGE_BUCKET)
      .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = bucket.from(process.env.STORAGE_BUCKET).getPublicUrl(fileName);
    foto_perfil_url = publicUrl;
  }

  // Resolver rol_id ANTES de construir el objeto de inserción
  const rolCodigo = parsedData.rol ?? "ayudante";
  const rolObj = await db(DatabaseTable.roles).where({ codigo: rolCodigo }).first();
  if (!rolObj) throw new utils.CustomError(AnomalyCode.dataBaseError, `Rol '${rolCodigo}' no encontrado`);

  // Construir objeto limpio para el INSERT (con UUID generado manualmente)
  const insertData = {
    id_usuario:      crypto.randomUUID(),
    nombre:          parsedData.nombre,
    email:           parsedData.email,
    cedula:          parsedData.cedula,
    telefono:        parsedData.telefono,
    password_hash:   await utils.hashPassword(parsedData.password),
    foto_perfil_url: foto_perfil_url,
    rol_id:          rolObj.id,
    activo:          true,
  };

  const trx = await db.transaction();
  try {
    const [user] = await authRepository.insertUsuario(trx, insertData);
    await trx.commit();
    return user;
  } catch (error) {
    await trx.rollback();
    throw new utils.CustomError(AnomalyCode.dataBaseError, error.message);
  }
};

const forgotPassword = async (email) => {
  const user = await authRepository.findByEmail(email);
  if (!user) throw new utils.CustomError(AnomalyCode.userDoesNotExist, "Usuario no encontrado");

  const token = crypto.randomBytes(3).toString("hex").toUpperCase();
  const expiracion = new Date(Date.now() + 15 * 60 * 1000);

  await authRepository.insertToken(user.id_usuario, token, expiracion);
  await sendResetEmail(email, token);
};

const resetPassword = async (token, newPassword) => {
  const registro = await authRepository.findValidToken(token);
  if (!registro) throw new utils.CustomError(AnomalyCode.unauthorized, "Token inválido o expirado");

  const hash = await bcrypt.hash(newPassword, 10);
  await authRepository.updatePassword(registro.id_usuario, hash);
  await authRepository.markTokenUsed(token);
};

export default { login, register, forgotPassword, resetPassword };
