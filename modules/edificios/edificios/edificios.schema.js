import { z } from "zod";

export const EdificioSchema = z.object({
  nombre_edificio: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres"),
  direccion: z.string().trim().min(5, "La dirección debe tener al menos 5 caracteres"),
  ciudad: z.string().trim().min(2, "La ciudad debe tener al menos 2 caracteres"),
  codigo_postal: z.string().trim().regex(/^\d{4,6}$/, "El código postal debe tener entre 4 y 6 dígitos"),
  uso_principal: z.string().trim().min(1, "El uso del edificio es requerido"),
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
  numero_pisos: z.number().int().positive(),
  area_total_piso: z.number().positive(),
  anio_construccion: z.number().int().min(1800).max(new Date().getFullYear()),
  anio_codigo: z.number().int().min(1800).max(new Date().getFullYear()),
  ampliacion: z.boolean(),
  anio_ampliacion: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  ocupacion: z.string().trim().min(1, "La ocupación es requerida"),
  historico: z.boolean(),
  albergue: z.boolean(),
  gubernamental: z.boolean(),
  unidades: z.number().int().nonnegative(),
  otras_identificaciones: z.string().trim().optional(),
  comentarios: z.string().trim().optional(),
  foto_edificio: z
    .any()
    .optional()
    .nullable()
    .refine(
      (f) => !f || (f.buffer && ["image/jpeg", "image/png"].includes(f.mimetype)),
      "La foto debe ser JPG o PNG"
    ),
  grafico_edificio: z
    .any()
    .optional()
    .nullable()
    .refine(
      (f) => !f || (f.buffer && ["image/jpeg", "image/png"].includes(f.mimetype)),
      "El gráfico debe ser JPG o PNG"
    ),
  foto_edificio_url: z.string().url().optional().nullable(),
  grafico_edificio_url: z.string().url().optional().nullable(),
});

export const UpdateEdificioSchema = EdificioSchema.partial();
