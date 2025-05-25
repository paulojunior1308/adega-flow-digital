"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeRequest = void 0;
const class_sanitizer_1 = require("class-sanitizer");
const sanitizeRequest = (req, res, next) => {
    if (req.body) {
        (0, class_sanitizer_1.sanitize)(req.body);
    }
    if (req.query) {
        (0, class_sanitizer_1.sanitize)(req.query);
    }
    if (req.params) {
        (0, class_sanitizer_1.sanitize)(req.params);
    }
    next();
};
exports.sanitizeRequest = sanitizeRequest;
