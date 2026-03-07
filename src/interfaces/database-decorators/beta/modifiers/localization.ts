import { MakePropertyDecorator } from "@ajs/core/beta/decorators";
import type * as DatabaseDev from "@ajs/database/beta";
import {
  attachModifier,
  ContainerModifier,
  MixinSymbol,
  unlock,
} from "./common";

type Options = {
  /** Fallback locale to use when no value exists for the selected locale. */
  fallbackLocale?: string;
};

/**
 * Localization modifier. enables the use of {@link Localized} on table fields.
 *
 * Localized fields contain multiple values (one for each language).
 * Accessing a particular value is done by first calling {@link localize} on the Table class instance.
 * This method is added through the mixin class.
 *
 * See {@link ContainerModifier} for the generic modifier.
 */
export class LocalizationModifier extends ContainerModifier<
  Record<string, never>,
  Options
> {
  public override unlock(locked_value: Record<string, unknown>, key: string) {
    const unlocked = super.unlock(locked_value, key);
    if (unlocked !== undefined) {
      return unlocked;
    }
    if (this.options.fallbackLocale) {
      return super.unlock(locked_value, this.options.fallbackLocale);
    }
  }

  public override unlockrequest(
    data: DatabaseDev.ValueProxy<Record<string, unknown>>,
    _meta: DatabaseDev.ValueProxy<Record<string, never>>,
    key: DatabaseDev.ValueProxyOrValue<string>,
  ): DatabaseDev.ValueProxy<unknown> {
    if (this.options.fallbackLocale) {
      return data.key(key).default(data.key(this.options.fallbackLocale));
    }
    return data.key(key);
  }

  [MixinSymbol] = class {
    /**
     * Specify which locale to use for accessing some or all localized fields.
     *
     * @param locale - Locale to use to unlock the field(s).
     * @param fields - Field names to unlock. Picks from the fields of the object this function is mixed into.
     *
     * @returns `this`
     */
    localize<This extends { constructor: any }>(
      this: This,
      locale: string,
      fields?: Array<keyof This>,
    ): This {
      unlock(this, LocalizationModifier, fields, locale);
      return this;
    }
  };
}

/**
 * Mark a Database Table class field as being localized.
 *
 * @note The Table class MUST incorporate the {@link LocalizationModifier} mixin.
 *
 * @param options Localization options.
 */
export const Localized = MakePropertyDecorator(
  (target, propertyKey, options?: Options) => {
    attachModifier(
      target.constructor,
      LocalizationModifier,
      propertyKey,
      options || {},
    );
  },
);
