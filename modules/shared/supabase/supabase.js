import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Función utilitaria para subir archivos al bucket configurado.
 * Genera un nombre único con timestamp y retorna la metadata del archivo.
 */
export const uploadFile = async (file, folder) => {
  if (!file) throw new Error("Archivo no recibido");

  const fileName = `${Date.now()}_${file.originalname}`;
  const path = `${folder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(process.env.STORAGE_BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) throw error;

  return data;
};

/**
 * Se exporta supabase.storage como default para que los servicios
 * puedan usar bucket.from(BUCKET).upload(...) y bucket.from(BUCKET).getPublicUrl(...)
 * directamente con la API nativa del SDK de Supabase.
 */
export default supabase.storage;
