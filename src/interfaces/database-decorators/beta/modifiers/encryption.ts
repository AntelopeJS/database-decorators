import * as DatabaseDev from '@ajs/database/beta';
import { MixinSymbol, attachModifier, TwoWayModifier } from './common';
import { MakePropertyDecorator } from '@ajs/core/beta/decorators';
import { CipherCCM, DecipherCCM, createCipheriv, createDecipheriv, randomBytes } from 'crypto';

type Options = {
  /** Encryption algorithm (for supported algorithms refer to {@link createCipheriv}) */
  algorithm?: string;
  /** Encryption key. */
  secretKey: string;
  /** Initialization Vector size. */
  ivSize?: number;
};

type TypeMetadata = {
  type: 'date' | 'object' | 'array' | 'primitive';
  value: unknown;
};

type Meta = {};
type LockedType = [ciphertext: string, iv: string, authTag?: string, metadata?: string];

/**
 * Encryption modifier. enables the use of {@link Encrypted} on table fields.
 *
 * These fields are stored encrypted in the database.
 */
export class EncryptionModifier extends TwoWayModifier<LockedType, [], Meta, Options> {
  readonly autolock = true;

  private serializeWithMetadata(value: unknown): { data: unknown; metadata?: TypeMetadata } {
    if (value instanceof Date) {
      return {
        data: value.toISOString(),
        metadata: { type: 'date', value: value.toISOString() },
      };
    }

    if (Array.isArray(value)) {
      return {
        data: value.map((item) => this.serializeWithMetadata(item).data),
        metadata: { type: 'array', value: value },
      };
    }

    if (value !== null && typeof value === 'object') {
      const serializedObject: Record<string, unknown> = {};
      const metadata: Record<string, TypeMetadata> = {};

      for (const [key, val] of Object.entries(value)) {
        const serialized = this.serializeWithMetadata(val);
        serializedObject[key] = serialized.data;
        if (serialized.metadata) {
          metadata[key] = serialized.metadata;
        }
      }

      return {
        data: serializedObject,
        metadata: Object.keys(metadata).length > 0 ? { type: 'object', value: metadata } : undefined,
      };
    }

    return { data: value };
  }

  private deserializeWithMetadata(data: unknown, metadata?: TypeMetadata): unknown {
    if (!metadata) {
      return data;
    }

    switch (metadata.type) {
      case 'date':
        return new Date(data as string);
      case 'array':
        return Array.isArray(data) ? data.map((item) => this.deserializeWithMetadata(item)) : data;
      case 'object':
        if (
          typeof data === 'object' &&
          data !== null &&
          typeof metadata.value === 'object' &&
          metadata.value !== null
        ) {
          const result: Record<string, unknown> = {};
          const typeMetadata = metadata.value as Record<string, TypeMetadata>;

          for (const [key, value] of Object.entries(data)) {
            result[key] = this.deserializeWithMetadata(value, typeMetadata[key]);
          }

          return result;
        }
        return data;
      default:
        return data;
    }
  }

  public override lock(_locked_value: LockedType | undefined, value: unknown): LockedType {
    const iv = randomBytes(this.options.ivSize || 16);
    const cipher = createCipheriv(this.options.algorithm || 'aes-256-gcm', this.options.secretKey, iv);

    const serialized = this.serializeWithMetadata(value);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(serialized.data)), cipher.final()]).toString(
      'base64',
    );

    let authTag: string | undefined;
    try {
      authTag = 'getAuthTag' in cipher ? (<CipherCCM>cipher).getAuthTag().toString('base64') : undefined;
    } catch {
      // Ignore errors when getting auth tag
    }

    const metadata = serialized.metadata ? JSON.stringify(serialized.metadata) : undefined;
    return [encrypted, iv.toString('base64'), authTag, metadata];
  }

  readonly autounlock = true;

  public override unlock([locked_value, iv_str, authTag, metadata_str]: LockedType) {
    const decipher = createDecipheriv(
      this.options.algorithm || 'aes-256-gcm',
      this.options.secretKey,
      Buffer.from(iv_str, 'base64'),
    );

    if ('setAuthTag' in decipher && authTag) {
      (<DecipherCCM>decipher).setAuthTag(Buffer.from(authTag, 'base64'));
    }

    const decryptedData = JSON.parse(
      Buffer.concat([decipher.update(Buffer.from(locked_value, 'base64')), decipher.final()]).toString('utf8'),
    );

    const metadata = metadata_str ? (JSON.parse(metadata_str) as TypeMetadata) : undefined;
    return this.deserializeWithMetadata(decryptedData, metadata);
  }

  public override unlockrequest(data: DatabaseDev.ValueProxy.Proxy<LockedType>): DatabaseDev.ValueProxy.Proxy<unknown> {
    return data;
  }

  [MixinSymbol] = class {};
}

/**
 * Mark a Database Table class field as being encrypted.
 *
 * @note The Table class MUST incorporate the {@link EncryptionModifier} mixin.
 *
 * @param options Encryption options.
 */
export const Encrypted = MakePropertyDecorator((target, propertyKey, options: Options) => {
  attachModifier(target.constructor, EncryptionModifier, propertyKey, options);
});
