import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
export const setCache = (key, value, ttl = 100) => {
    cache.set(key, value, ttl);
};
export const getCache = (key) => {
    return cache.get(key);
};
export const clearCache = (key) => {
    cache.del(key);
};
