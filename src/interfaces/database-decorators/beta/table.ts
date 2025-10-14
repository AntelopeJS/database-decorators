import { MixinType, MixinSymbol } from './modifiers/common';
import { MakePropertyDecorator, MakeClassDecorator, ClassDecorator } from '@ajs/core/beta/decorators';
import { Constructible, DatumStaticMetadata, getMetadata } from './common';

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export const TableMetaSymbol = Symbol();
export const TableRefSymbol = Symbol();
export type ExtractTableMeta<T> = T extends { [TableMetaSymbol]: infer Meta } ? (Meta extends {} ? Meta : never) : {};

export interface TableClass<Base = {}, Args extends any[] = [], Meta extends {} | undefined = undefined> {
  new (...args: Args): Base & (Meta extends {} ? { [TableMetaSymbol]: Meta } : {});

  /* public static */ with<This extends TableClass, T extends Constructible<{ [MixinSymbol]: Constructible }>[] = []>(
    this: This,
    ...other: T
  ): TableClass<
    InstanceType<This> & UnionToIntersection<InstanceType<MixinType<InstanceType<T[number]>>>>,
    ConstructorParameters<This>,
    ExtractTableMeta<InstanceType<This>> | ExtractTableMeta<InstanceType<T[number]>>
  >;
}

/**
 * Database Table superclass
 */
export class Table {
  /**
   * Supplement the superclass with Modifier mixins.
   *
   * @param others List of Modifier mixin classes
   * @returns New superclass
   */
  public static with<This extends typeof Table, T extends Constructible<{ [MixinSymbol]: Constructible }>[] = []>(
    this: This,
    ...others: T
  ): TableClass<
    InstanceType<This> & UnionToIntersection<InstanceType<MixinType<InstanceType<T[number]>>>>,
    ConstructorParameters<This>,
    ExtractTableMeta<InstanceType<This>> | ExtractTableMeta<InstanceType<T[number]>>
  > {
    const c = class _internal_table extends (<any>this) {};
    for (const mixin of others
      .map((otherClass) => otherClass.prototype && new otherClass())
      .map((other) => other && other[MixinSymbol])
      .filter((mixin) => mixin?.prototype)) {
      for (const key of Object.getOwnPropertyNames(mixin.prototype)) {
        if (key !== 'constructor' && !(key in c.prototype)) {
          (<any>c.prototype)[key] = mixin.prototype[key];
        }
      }
      for (const key of Object.getOwnPropertySymbols(mixin.prototype)) {
        if (!(key in c.prototype)) {
          (<any>c.prototype)[key] = mixin.prototype[key];
        }
      }
    }
    return <any>c;
  }
}

/**
 * Database Table Index decorator.
 *
 * Available options:
 * - `primary`: This field is the primary key for the table.
 * - `group`: Index name for multi-field indexes.
 *
 * @param options Options
 */
export const Index = MakePropertyDecorator((target, propertyKey, options?: { primary?: boolean; group?: string }) => {
  const metadata = getMetadata(target.constructor, DatumStaticMetadata);
  if (options?.primary) {
    metadata.primary = <string>propertyKey;
  } else {
    metadata.addIndex(<string>propertyKey, options?.group || <string>propertyKey);
  }
});

type AwaitableArray<T> = Promise<T | T[]> | T | T[];
/**
 * Database Table class decorator to create default data on table creation.
 *
 * @param generator Data generator
 */
export const Fixture: <T extends typeof Table>(
  generator: (p: T) => AwaitableArray<Partial<InstanceType<T>>>,
) => ClassDecorator<T> = MakeClassDecorator((target, generator) => {
  const metadata = getMetadata(target, DatumStaticMetadata);
  metadata.generator = generator;
});
