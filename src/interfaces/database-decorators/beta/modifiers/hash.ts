import { createHash } from "node:crypto";
import { MakePropertyDecorator } from "@ajs/core/beta/decorators";
import { generate } from "randomstring";
import {
  attachModifier,
  MixinSymbol,
  OneWayModifier,
  testValue,
} from "./common";

type Options = {
  /** Hashing algorithm (for supported algorithms refer to {@link createHash}) */
  algorithm?: string;
};

/**
 * Hash modifier. enables the use of {@link Hashed} on table fields.
 *
 * Hashed fields only contain a hash of the inserted value.
 * Because of this, you lose the ability to query the information directly.
 * You can test equality using {@link testHash}
 */
export class HashModifier extends OneWayModifier<
  string | undefined,
  [],
  { salt?: string },
  Options
> {
  public readonly autolock = true;

  public override lock(_locked_value: string | undefined, value: unknown) {
    if (value === undefined) {
      return value;
    }
    if (!this.meta.salt) {
      this.meta.salt = generate();
    }
    return createHash(this.options.algorithm || "sha256")
      .update(this.meta.salt)
      .update(JSON.stringify(value))
      .digest("base64");
  }

  [MixinSymbol] = class {
    /**
     * Test a value against the stored hash.
     *
     * @param field - Name of the field to test against.
     * @param value - Value to hash and test.
     *
     * @returns Whether the new value is identical to the original or not.
     */
    testHash<This extends {}, F extends keyof This>(
      this: This,
      field: F,
      value: This[F],
    ) {
      return testValue(this, field, value);
    }
  };
}

/**
 * Mark a Database Table class field as being hashed.
 *
 * @note The Table class MUST incorporate the {@link HashModifier} mixin.
 *
 * @param options Hash options.
 */
export const Hashed = MakePropertyDecorator(
  (target, propertyKey, options?: Options) => {
    attachModifier(
      target.constructor,
      HashModifier,
      propertyKey,
      options || {},
    );
  },
);
