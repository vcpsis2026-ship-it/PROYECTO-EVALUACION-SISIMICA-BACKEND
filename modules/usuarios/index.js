import { Router } from "express";
import authRouter from "./auth/auth.router.js";
import usuariosRouter from "./usuarios/usuarios.router.js";
import rolesRouter from "./roles/roles.router.js";
import permisosRouter from "./permisos/permisos.router.js";
import dashboardRouter from "./admin/dashboard.router.js";

const usuariosModule = Router();

usuariosModule.use("/auth", authRouter);
usuariosModule.use("/usuarios", usuariosRouter);
usuariosModule.use("/roles", rolesRouter);
usuariosModule.use("/permisos", permisosRouter);
usuariosModule.use("/admin/dashboard", dashboardRouter);

export default usuariosModule;
