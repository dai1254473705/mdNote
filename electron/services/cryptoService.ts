import crypto from 'crypto';
import { configService } from './configService';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits, standard for GCM
const KEY_LENGTH = 32; // 256 bits

export class CryptoService {

  /**
   * Generates a secure random key (hex string)
   */
  generateKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
  }

  /**
   * Encrypt content using AES-256-GCM.
   * Returns format: "iv:authTag:encryptedContent" (all hex/base64)
   */
  async encryptContent(content: string): Promise<string> {
    const secret = await configService.getSecret();
    if (!secret || !secret.key) {
      throw new Error('Encryption key not found. Please set up encryption first.');
    }

    const key = Buffer.from(secret.key, 'hex');
    if (key.length !== KEY_LENGTH) {
      throw new Error(`Invalid key length. Expected ${KEY_LENGTH} bytes.`);
    }

    // Generate fresh IV for every encryption to ensure semantic security
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt
    let encrypted = cipher.update(content, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Get Auth Tag (must be checked during decryption)
    const authTag = cipher.getAuthTag();

    // Format: IV(hex):AuthTag(hex):EncryptedData(base64)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt content using AES-256-GCM.
   */
  async decryptContent(encryptedPackage: string): Promise<string> {
    const secret = await configService.getSecret();
    if (!secret || !secret.key) {
      throw new Error('Encryption key not found');
    }

    const parts = encryptedPackage.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format. Expected IV:AuthTag:Content');
    }

    const [ivHex, authTagHex, encrypted] = parts;
    
    const key = Buffer.from(secret.key, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

export const cryptoService = new CryptoService();
