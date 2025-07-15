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
type Meta = {};
type LockedType = [ciphertext: string, iv: string, authTag?: string];

function encodeDate(value: unknown): unknown {
  if (value instanceof Date) {
    return { value: value.toUTCString(), type: 'Date' };
  }
  if (Array.isArray(value)) {
    return value.map(encodeDate);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, encodeDate(val)]));
  }
  return value;
}

function decodeDate(value: unknown): unknown {
  if (
    value &&
    typeof value === 'object' &&
    'type' in value &&
    value.type === 'Date' &&
    'value' in value &&
    typeof value.value === 'string'
  ) {
    return new Date(value.value);
  }
  if (Array.isArray(value)) {
    return value.map(decodeDate);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, decodeDate(v)]));
  }
  return value;
}

/**
 * Encryption modifier. enables the use of {@link Encrypted} on table fields.
 *
 * These fields are stored encrypted in the database.
 */
export class EncryptionModifier extends TwoWayModifier<LockedType, [], Meta, Options> {
  readonly autolock = true;

  public override lock(_locked_value: LockedType | undefined, value: unknown): LockedType {
    const iv = randomBytes(this.options.ivSize || 16);
    const encoded = encodeDate(value);
    const cipher = createCipheriv(this.options.algorithm || 'aes-256-gcm', this.options.secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(encoded)), cipher.final()]).toString('base64');

    let authTag: string | undefined;
    try {
      authTag = 'getAuthTag' in cipher ? (<CipherCCM>cipher).getAuthTag().toString('base64') : undefined;
    } catch {
      // Ignore error if getAuthTag is not available
    }

    return [encrypted, iv.toString('base64'), authTag];
  }

  readonly autounlock = true;

  public override unlock([locked_value, iv_str, authTag]: LockedType) {
    const decipher = createDecipheriv(
      this.options.algorithm || 'aes-256-gcm',
      this.options.secretKey,
      Buffer.from(iv_str, 'base64'),
    );

    if ('setAuthTag' in decipher && authTag) {
      (<DecipherCCM>decipher).setAuthTag(Buffer.from(authTag, 'base64'));
    }

    const parsed = JSON.parse(
      Buffer.concat([decipher.update(Buffer.from(locked_value, 'base64')), decipher.final()]).toString('utf8'),
    ) as unknown;
    return decodeDate(parsed);
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
