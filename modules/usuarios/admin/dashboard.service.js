import db from "../../../data/database.js";
import DatabaseTable from "../../../data/databaseTables.js";

const getDashboardStats = async () => {
  const [
    edificiosCount,
    inspeccionesCount,
    usuariosPorRol,
    distribucion,
    topEdificios,
  ] = await Promise.all([
    // 1. Total de edificios
    db(DatabaseTable.edificios).count("id_edificio as total").first(),

    // 2. Total de inspecciones
    db(DatabaseTable.inspecciones).count("id_inspeccion as total").first(),

    // 3. Usuarios agrupados por rol
    db(DatabaseTable.usuarios)
      .select("r.codigo as rol")
      .count("* as total")
      .leftJoin(`${DatabaseTable.roles} as r`, "r.id", `${DatabaseTable.usuarios}.rol_id`)
      .whereIn("r.codigo", ["inspector", "ayudante"])
      .groupBy("r.codigo"),

    // 4. Distribución de puntuación final
    db(DatabaseTable.inspecciones)
      .select(
        db.raw("COUNT(CASE WHEN puntuacion_final < 80 THEN 1 END) as riesgo_alto"),
        db.raw("COUNT(CASE WHEN puntuacion_final >= 80 AND puntuacion_final <= 120 THEN 1 END) as riesgo_medio"),
        db.raw("COUNT(CASE WHEN puntuacion_final > 120 THEN 1 END) as riesgo_bajo")
      )
      .whereNotNull("puntuacion_final")
      .first(),

    // 5. Top 3 edificios con más inspecciones
    db(`${DatabaseTable.inspecciones} as i`)
      .select("e.nombre_edificio")
      .count("i.id_inspeccion as total_inspecciones")
      .leftJoin(`${DatabaseTable.edificios} as e`, "e.id_edificio", "i.id_edificio")
      .groupBy("i.id_edificio", "e.nombre_edificio")
      .orderBy("total_inspecciones", "desc")
      .limit(3),
  ]);

  // Parsear conteos de usuarios por rol
  const rolesMap = {};
  for (const row of usuariosPorRol) {
    rolesMap[row.rol] = parseInt(row.total, 10);
  }

  return {
    totalEdificios: parseInt(edificiosCount?.total ?? 0, 10),
    totalInspecciones: parseInt(inspeccionesCount?.total ?? 0, 10),
    totalInspectores: rolesMap["inspector"] ?? 0,
    totalAyudantes: rolesMap["ayudante"] ?? 0,
    distribucionPuntuacion: {
      riesgoAlto: parseInt(distribucion?.riesgo_alto ?? 0, 10),
      riesgoMedio: parseInt(distribucion?.riesgo_medio ?? 0, 10),
      riesgoBajo: parseInt(distribucion?.riesgo_bajo ?? 0, 10),
    },
    topEdificios: topEdificios.map((e) => ({
      nombre_edificio: e.nombre_edificio ?? "Sin nombre",
      total_inspecciones: parseInt(e.total_inspecciones, 10),
    })),
  };
};

export default { getDashboardStats };
