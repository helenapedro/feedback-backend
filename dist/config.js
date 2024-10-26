"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitConfig = void 0;
exports.rateLimitConfig = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes',
};
