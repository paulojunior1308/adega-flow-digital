"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const memory_cache_1 = __importDefault(require("memory-cache"));
const cache = (duration) => {
    return (req, res, next) => {
        const key = '__express__' + req.originalUrl || req.url;
        const cachedBody = memory_cache_1.default.get(key);
        if (cachedBody) {
            res.send(cachedBody);
            return;
        }
        res.sendResponse = res.send;
        res.send = (body) => {
            memory_cache_1.default.put(key, body, duration * 1000);
            return res.sendResponse(body);
        };
        next();
    };
};
exports.default = cache;
