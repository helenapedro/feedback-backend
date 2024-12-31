import { expect } from 'chai';
import { setCache, getCache, clearCache } from '../../src/services/cacheService';

describe('Cache Service', () => {
  it('should set and retrieve a value from the cache', () => {
    setCache('testKey', 'testValue');
    const value = getCache('testKey');
    expect(value).to.equal('testValue');
  });

  it('should delete a value from the cache', () => {
    setCache('testKey', 'testValue');
    clearCache('testKey');
    const value = getCache('testKey');
    expect(value).to.be.undefined;
  });
});
