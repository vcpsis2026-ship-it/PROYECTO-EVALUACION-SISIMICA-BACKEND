import db from "../../../data/database.js";
import DatabaseTable from "../../../data/databaseTables.js";

const findAll = () =>
  db(`${DatabaseTable.inspecciones} as i`)
    .select(
      "i.*",
      "e.nombre_edificio",
      "e.direccion",
      "u.nombre as nombre_inspector",
      "ei.nombre as nombre_estado"
    )
    .leftJoin(`${DatabaseTable.edificios} as e`, "e.id_edificio", "i.id_edificio")
    .leftJoin(`${DatabaseTable.usuarios} as u`, "u.id_usuario", "i.id_usuario")
    .leftJoin(`${DatabaseTable.estadosInspeccion} as ei`, "ei.codigo", "i.estado")
    .orderBy("i.created_at", "desc");

const findById = (id) =>
  db(`${DatabaseTable.inspecciones} as i`)
    .select(
      "i.*",
      "e.nombre_edificio",
      "e.direccion",
      "u.nombre as nombre_inspector",
      "ei.nombre as nombre_estado"
    )
    .leftJoin(`${DatabaseTable.edificios} as e`, "e.id_edificio", "i.id_edificio")
    .leftJoin(`${DatabaseTable.usuarios} as u`, "u.id_usuario", "i.id_usuario")
    .leftJoin(`${DatabaseTable.estadosInspeccion} as ei`, "ei.codigo", "i.estado")
    .where("i.id_inspeccion", id)
    .first();

const findByEdificio = (idEdificio) =>
  db(`${DatabaseTable.inspecciones} as i`)
    .select(
      "i.*",
      "e.nombre_edificio",
      "e.direccion",
      "u.nombre as nombre_inspector",
      "ei.nombre as nombre_estado"
    )
    .leftJoin(`${DatabaseTable.edificios} as e`, "e.id_edificio", "i.id_edificio")
    .leftJoin(`${DatabaseTable.usuarios} as u`, "u.id_usuario", "i.id_usuario")
    .leftJoin(`${DatabaseTable.estadosInspeccion} as ei`, "ei.codigo", "i.estado")
    .where("i.id_edificio", idEdificio)
    .orderBy("i.created_at", "desc");

const insert = (trx, data) =>
  trx(DatabaseTable.inspecciones).insert(data).returning("*");

const update = (trx, id, data) =>
  trx(DatabaseTable.inspecciones).where({ id_inspeccion: id }).update(data).returning("*");

export default { findAll, findById, findByEdificio, insert, update };
