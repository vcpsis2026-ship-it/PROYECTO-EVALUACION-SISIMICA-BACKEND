import { Router } from "express";
import multer from "multer";
import authMiddleware from "../../shared/middleware/authMiddleware.js";
import usuariosController from "./usuarios.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware.authenticateUser.bind(authMiddleware));

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Gestión de usuarios del sistema
 */

/**
 * @swagger
 * /api/v1/usuarios:
 *   get:
 *     summary: Obtener todos los usuarios (filtro opcional por estado activo)
 *     tags: [Usuarios]
 *     parameters:
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por usuarios activos (true) o inactivos (false). Si no se envía, trae todos.
 *     responses:
 *       200:
 *         description: Lista de usuarios activos
 *       401:
 *         description: No autorizado
 */
router.get("/", usuariosController.getAll);

/**
 * @swagger
 * /api/v1/usuarios/byRol/{rol}:
 *   get:
 *     summary: Obtener usuarios por rol
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: rol
 *         required: true
 *         schema:
 *           type: string
 *           enum: [admin, inspector, ayudante]
 *         example: inspector
 *     responses:
 *       200:
 *         description: Lista de usuarios con ese rol
 *       401:
 *         description: No autorizado
 */
router.get("/byRol/:rol", usuariosController.getByRole);

/**
 * @swagger
 * /api/v1/usuarios/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del usuario
 *       404:
 *         description: Usuario no encontrado
 */
router.get("/:id", usuariosController.getById);

/**
 * @swagger
 * /api/v1/usuarios/{id}:
 *   put:
 *     summary: Actualizar datos de un usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               cedula:
 *                 type: string
 *               telefono:
 *                 type: string
 *               direccion:
 *                 type: string
 *               currentPassword:
 *                 type: string
 *               password:
 *                 type: string
 *               foto_perfil:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Usuario no encontrado
 */
router.put("/:id", upload.single("foto_perfil"), usuariosController.update);

/**
 * @swagger
 * /api/v1/usuarios/{id}/rol:
 *   patch:
 *     summary: Cambiar rol de un usuario (solo administradores)
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rol]
 *             properties:
 *               rol:
 *                 type: string
 *                 enum: [admin, inspector, ayudante]
 *     responses:
 *       200:
 *         description: Rol actualizado
 *       403:
 *         description: Acceso denegado
 */
router.patch(
  "/:id/rol",
  authMiddleware.requireAdmin.bind(authMiddleware),
  usuariosController.updateRol
);

/**
 * @swagger
 * /api/v1/usuarios/{id}:
 *   patch:
 *     summary: Editar parcialmente a un usuario (solo administradores)
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               telefono:
 *                 type: string
 *               direccion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado
 */
router.patch(
  "/:id",
  authMiddleware.requireAdmin.bind(authMiddleware),
  upload.single("foto_perfil"),
  usuariosController.update
);

/**
 * @swagger
 * /api/v1/usuarios/{id}/estado:
 *   patch:
 *     summary: Activar o desactivar a un usuario (solo administradores)
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [activo]
 *             properties:
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.patch(
  "/:id/estado",
  authMiddleware.requireAdmin.bind(authMiddleware),
  usuariosController.updateEstado
);

export default router;
