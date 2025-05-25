"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.morganConfig = void 0;
const morgan_1 = __importDefault(require("morgan"));
const logger_1 = __importDefault(require("./logger"));
exports.morganConfig = (0, morgan_1.default)('combined', {
    stream: {
        write: (message) => logger_1.default.info(message.trim()),
    },
});
