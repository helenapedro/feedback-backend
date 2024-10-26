"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorLogger = exports.requestLogger = void 0;
const express_winston_1 = __importDefault(require("express-winston"));
const logger_1 = __importDefault(require("../helpers/logger"));
exports.requestLogger = express_winston_1.default.logger({
    winstonInstance: logger_1.default,
    msg: "{{req.method}} {{req.url}} {{res.statusCode}} - {{res.responseTime}}ms",
    meta: true,
});
exports.errorLogger = express_winston_1.default.errorLogger({
    winstonInstance: logger_1.default,
});
