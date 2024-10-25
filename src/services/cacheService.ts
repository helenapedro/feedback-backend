import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 100, checkperiod: 120 }); 

export const setCache = (key: string, value: any,  ttl: number = 100) => {
  cache.set(key, value, ttl);
};

export const getCache = (key: string) => {
  return cache.get(key);
};

export const clearCache = (key: string) => {
  cache.del(key);
};
