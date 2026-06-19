import jwt from "jsonwebtoken";
import AnomalyCode from "../../../anomaly.js";
import db from "../../../data/database.js";
import DatabaseTable from "../../../data/databaseTables.js";

class AuthMiddleware {
  constructor() {
    this.accessSecret = process.env.JWT_ACCESS_SECRET;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET;
  }

  issueTokens(payload) {
    return jwt.sign(payload, this.accessSecret, { expiresIn: "40m" });
  }

  authenticateUser(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      const token =
        authHeader && authHeader.startsWith("Bearer ")
          ? authHeader.split(" ")[1]
          : null;

      if (!token) {
        return res.status(401).send({
          error: {
            code: AnomalyCode.unauthorized,
            message: "No autorizado: token no proporcionado o mal formado",
          },
        });
      }
      const decoded = jwt.verify(token, this.accessSecret);
      req.user = decoded;
      return next();
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return res.status(401).send({
          error: {
            code: AnomalyCode.unauthorized,
            message: "No autorizado: token expirado",
          },
        });
      }
      if (err instanceof jwt.JsonWebTokenError) {
        return res.status(401).send({
          error: {
            code: AnomalyCode.unauthorized,
            message: "No autorizado: token inválido",
          },
        });
      }
      return res.status(401).send({
        error: {
          code: AnomalyCode.unauthorized,
          message: "No autorizado: error de autenticación",
        },
      });
    }
  }

  async requireAdmin(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).send({
          error: { code: AnomalyCode.unauthorized, message: "No autenticado" },
        });
      }

      // Consultar el rol del usuario haciendo JOIN con la tabla roles
      // ya que la columna usuarios.rol_id es una FK a roles.id
      const user = await db(DatabaseTable.usuarios)
        .select("r.codigo as rol_codigo")
        .leftJoin(`${DatabaseTable.roles} as r`, "r.id", `${DatabaseTable.usuarios}.rol_id`)
        .where(`${DatabaseTable.usuarios}.id_usuario`, req.user.id)
        .first();

      if (!user) {
        return res.status(401).send({
          error: { code: AnomalyCode.unauthorized, message: "Usuario no encontrado" },
        });
      }

      if (user.rol_codigo !== "administrador") {
        return res.status(403).send({
          error: {
            code: AnomalyCode.forbidden,
            message: "Acceso denegado. Se requieren permisos de administrador",
          },
        });
      }

      next();
    } catch (error) {
      console.error("Error en requireAdmin:", error);
      return res.status(500).send({
        error: { code: AnomalyCode.internalServerError, message: "Error de autorización" },
      });
    }
  }

  refreshToken(req, res) {
    try {
      const { refreshToken: rtk } = req.body;
      if (!rtk) {
        return res.status(401).json({
          error: {
            code: AnomalyCode.unauthorized,
            message: "Falta el refresh token en el cuerpo de la petición",
          },
        });
      }

      const payload = jwt.verify(rtk, this.refreshSecret);
      const newPayload = { id: payload.id, username: payload.username };
      const tokens = this.issueTokens(newPayload);
      return res.json(tokens);
    } catch (err) {
      return res.status(401).json({
        error: {
          code: AnomalyCode.unauthorized,
          message: "Refresh token inválido o expirado",
        },
      });
    }
  }
}

const authMiddleware = new AuthMiddleware();
export default authMiddleware;
