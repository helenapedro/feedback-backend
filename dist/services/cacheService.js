"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCache = exports.getCache = exports.setCache = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const cache = new node_cache_1.default({ stdTTL: 100, checkperiod: 120 });
const setCache = (key, value, ttl = 100) => {
    cache.set(key, value, ttl);
};
exports.setCache = setCache;
const getCache = (key) => {
    return cache.get(key);
};
exports.getCache = getCache;
const clearCache = (key) => {
    cache.del(key);
};
exports.clearCache = clearCache;
