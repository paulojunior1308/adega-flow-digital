"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const i18next_1 = __importDefault(require("i18next"));
const i18next_fs_backend_1 = __importDefault(require("i18next-fs-backend"));
const env_1 = require("./env");
i18next_1.default
    .use(i18next_fs_backend_1.default)
    .init({
    lng: 'pt-BR',
    fallbackLng: 'pt-BR',
    debug: env_1.env.nodeEnv === 'development',
    backend: {
        loadPath: './locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
        escapeValue: false,
    },
});
exports.default = i18next_1.default;
