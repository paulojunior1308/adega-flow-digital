"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketInstance = exports.setSocketInstance = void 0;
let io = null;
const setSocketInstance = (instance) => {
    io = instance;
};
exports.setSocketInstance = setSocketInstance;
const getSocketInstance = () => io;
exports.getSocketInstance = getSocketInstance;
