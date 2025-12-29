import { describe, expect, it } from '@jest/globals';
import exclude from '@/utils/exclude';

describe('exclude', () => {
  it('should exclude specified keys from object', () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 };
    const result = exclude(obj, ['b', 'd']);

    expect(result).toEqual({ a: 1, c: 3 });
  });

  it('should return same object when keys array is empty', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = exclude(obj, []);

    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('should ignore keys that do not exist in object', () => {
    const obj = { a: 1, b: 2 };
    const result = exclude(obj, ['c', 'd'] as any);

    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('should mutate the original object', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = exclude(obj, ['b']);

    expect(result).toBe(obj); // Same reference
    expect(obj).toEqual({ a: 1, c: 3 });
  });

  it('should handle nested objects', () => {
    const obj = {
      a: 1,
      b: { nested: 'value' },
      c: 3
    };
    const result = exclude(obj, ['b']);

    expect(result).toEqual({ a: 1, c: 3 });
  });

  it('should handle objects with undefined values', () => {
    const obj = { a: 1, b: undefined, c: 3 };
    const result = exclude(obj, ['b']);

    expect(result).toEqual({ a: 1, c: 3 });
  });

  it('should handle objects with null values', () => {
    const obj = { a: 1, b: null, c: 3 };
    const result = exclude(obj, ['b']);

    expect(result).toEqual({ a: 1, c: 3 });
  });

  it('should handle excluding all keys', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = exclude(obj, ['a', 'b', 'c']);

    expect(result).toEqual({});
  });

  it('should handle array values', () => {
    const obj = { a: [1, 2, 3], b: 'test', c: 4 };
    const result = exclude(obj, ['b']);

    expect(result).toEqual({ a: [1, 2, 3], c: 4 });
  });
});
