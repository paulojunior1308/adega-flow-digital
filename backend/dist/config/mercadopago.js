"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mercadopago_1 = __importDefault(require("mercadopago"));
const env_1 = require("./env");
mercadopago_1.default.config.access_token = env_1.env.MP_ACCESS_TOKEN;
exports.default = mercadopago_1.default;
