import { Router } from "express";
import authMiddleware from "../../shared/middleware/authMiddleware.js";
import dashboardService from "./dashboard.service.js";

const router = Router();

// Autenticar + verificar admin
router.use(authMiddleware.authenticateUser.bind(authMiddleware));
router.use(authMiddleware.requireAdmin.bind(authMiddleware));

/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     summary: Obtener estadísticas del dashboard de administrador
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas agregadas del sistema
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (no es admin)
 */
router.get("/", async (req, res) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    return res.json(stats);
  } catch (error) {
    console.error("Error en dashboard stats:", error);
    return res.status(500).json({
      error: { message: "Error al obtener estadísticas del dashboard" },
    });
  }
});

export default router;
