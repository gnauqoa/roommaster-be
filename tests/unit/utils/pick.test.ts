import { describe, expect, it } from '@jest/globals';
import pick from '@/utils/pick';

describe('pick', () => {
  it('should pick specified keys from object', () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 };
    const result = pick(obj, ['a', 'c']);

    expect(result).toEqual({ a: 1, c: 3 });
  });

  it('should return empty object when keys array is empty', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = pick(obj, []);

    expect(result).toEqual({});
  });

  it('should ignore keys that do not exist in object', () => {
    const obj = { a: 1, b: 2 };
    const result = pick(obj, ['a', 'c', 'd']);

    expect(result).toEqual({ a: 1 });
  });

  it('should handle nested objects', () => {
    const obj = {
      a: 1,
      b: { nested: 'value' },
      c: 3
    };
    const result = pick(obj, ['b', 'c']);

    expect(result).toEqual({ b: { nested: 'value' }, c: 3 });
  });

  it('should handle objects with undefined values', () => {
    const obj = { a: 1, b: undefined, c: 3 };
    const result = pick(obj, ['a', 'b']);

    expect(result).toEqual({ a: 1, b: undefined });
  });

  it('should handle objects with null values', () => {
    const obj = { a: 1, b: null, c: 3 };
    const result = pick(obj, ['a', 'b', 'c']);

    expect(result).toEqual({ a: 1, b: null, c: 3 });
  });

  it('should return empty object when source object is empty', () => {
    const obj = {};
    const result = pick(obj, ['a', 'b']);

    expect(result).toEqual({});
  });

  it('should handle array values', () => {
    const obj = { a: [1, 2, 3], b: 'test', c: 4 };
    const result = pick(obj, ['a', 'c']);

    expect(result).toEqual({ a: [1, 2, 3], c: 4 });
  });

  it('should only pick own properties, not inherited ones', () => {
    const parent = { inherited: 'value' };
    const obj = Object.create(parent);
    obj.own = 'ownValue';

    const result = pick(obj, ['own', 'inherited']);

    expect(result).toEqual({ own: 'ownValue' });
    expect(result.inherited).toBeUndefined();
  });
});
