/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import * as encryption from '../../../src/utils/encryption';
import bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('encryption', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('encryptPassword', () => {
    it('should hash password using bcrypt', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword';

      (bcrypt.hash as any).mockResolvedValue(hashedPassword);

      const result = await encryption.encryptPassword(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 8);
    });

    it('should use salt rounds of 8', async () => {
      const password = 'anotherPassword';
      (bcrypt.hash as any).mockResolvedValue('hashed');

      await encryption.encryptPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 8);
    });

    it('should handle empty password', async () => {
      const password = '';
      const hashedPassword = 'hashedEmpty';

      (bcrypt.hash as any).mockResolvedValue(hashedPassword);

      const result = await encryption.encryptPassword(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 8);
    });
  });

  describe('isPasswordMatch', () => {
    it('should return true when passwords match', async () => {
      const password = 'testPassword';
      const hashedPassword = 'hashedPassword';

      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await encryption.isPasswordMatch(password, hashedPassword);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should return false when passwords do not match', async () => {
      const password = 'testPassword';
      const hashedPassword = 'differentHash';

      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await encryption.isPasswordMatch(password, hashedPassword);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should handle empty password comparison', async () => {
      const password = '';
      const hashedPassword = 'hashedPassword';

      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await encryption.isPasswordMatch(password, hashedPassword);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should correctly compare with bcrypt hashed passwords', async () => {
      const password = 'mySecretPassword';
      const hashedPassword = '$2a$08$someHashedValue';

      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await encryption.isPasswordMatch(password, hashedPassword);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });
  });
});
