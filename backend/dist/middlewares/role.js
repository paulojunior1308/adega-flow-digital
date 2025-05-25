"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = authorizeRoles;
const errorHandler_1 = require("../config/errorHandler");
function authorizeRoles(...roles) {
    return (req, res, next) => {
        var _a;
        const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        console.log('ROLE CHECK:', { userRole, roles });
        if (!userRole) {
            throw new errorHandler_1.AppError('Usuário não autenticado', 401);
        }
        if (!roles.includes(userRole)) {
            throw new errorHandler_1.AppError('Acesso negado. Você não tem permissão para acessar este recurso.', 403);
        }
        next();
    };
}
