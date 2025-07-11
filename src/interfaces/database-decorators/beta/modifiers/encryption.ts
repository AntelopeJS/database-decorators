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

/**
 * Encryption modifier. enables the use of {@link Encrypted} on table fields.
 *
 * These fields are stored encrypted in the database.
 */
export class EncryptionModifier extends TwoWayModifier<LockedType, [], Meta, Options> {
  readonly autolock = true;

  public override lock(_locked_value: LockedType | undefined, value: unknown): LockedType {
    const iv = randomBytes(this.options.ivSize || 16);
    const cipher = createCipheriv(this.options.algorithm || 'aes-256-gcm', this.options.secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]).toString('base64');

    let authTag: string | undefined;
    try {
      authTag =
        'getAuthTag' in cipher ? (<CipherCCM>cipher).getAuthTag().toString('base64') : undefined;
    } catch (_) {}

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

    return JSON.parse(
      Buffer.concat([decipher.update(Buffer.from(locked_value, 'base64')), decipher.final()]).toString('utf8'),
    );
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
