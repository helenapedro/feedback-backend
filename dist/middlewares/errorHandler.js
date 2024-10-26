"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = __importDefault(require("../helpers/logger"));
const errorHandler = (err, req, res, next) => {
    logger_1.default.error(err.stack);
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(500).json(Object.assign({ message: 'Internal Server Error' }, (isProduction ? {} : { error: err.message })));
};
exports.errorHandler = errorHandler;
