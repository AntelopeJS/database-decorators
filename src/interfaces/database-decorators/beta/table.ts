import {
  type ClassDecorator,
  MakeClassDecorator,
  MakePropertyDecorator,
} from "@ajs/core/beta/decorators";
import { type Constructible, DatumStaticMetadata, getMetadata } from "./common";
import { MixinSymbol, type MixinType } from "./modifiers/common";

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

export const TableMetaSymbol = Symbol();
export const TableRefSymbol = Symbol();
export type ExtractTableMeta<T> = T extends { [TableMetaSymbol]: infer Meta }
  ? Meta extends object
    ? Meta
    : never
  : object;

export interface TableClass<
  Base = object,
  Args extends any[] = [],
  Meta extends object | undefined = undefined,
> {
  new (
    ...args: Args
  ): { _id: string } & Base &
    (Meta extends object ? { [TableMetaSymbol]: Meta } : object);

  /* public static */ with<
    This extends TableClass,
    T extends Constructible<{ [MixinSymbol]: Constructible }>[] = [],
  >(
    this: This,
    ...other: T
  ): TableClass<
    InstanceType<This> &
      UnionToIntersection<InstanceType<MixinType<InstanceType<T[number]>>>>,
    ConstructorParameters<This>,
    | ExtractTableMeta<InstanceType<This>>
    | ExtractTableMeta<InstanceType<T[number]>>
  >;
}

/**
 * Database Table superclass
 */
export class Table {
  declare _id: string;

  /**
   * Supplement the superclass with Modifier mixins.
   *
   * @param others List of Modifier mixin classes
   * @returns New superclass
   */
  public static with<
    This extends typeof Table,
    T extends Constructible<{ [MixinSymbol]: Constructible }>[] = [],
  >(
    this: This,
    ...others: T
  ): TableClass<
    InstanceType<This> &
      UnionToIntersection<InstanceType<MixinType<InstanceType<T[number]>>>>,
    ConstructorParameters<This>,
    | ExtractTableMeta<InstanceType<This>>
    | ExtractTableMeta<InstanceType<T[number]>>
  > {
    // biome-ignore lint/complexity/noThisInStatic: intentional mixin pattern — this refers to the calling class
    const c = class _internal_table extends (this as any) {};
    for (const mixin of others
      .map((otherClass) => otherClass.prototype && new otherClass())
      .map((other) => other?.[MixinSymbol])
      .filter((mixin) => mixin?.prototype)) {
      for (const key of Object.getOwnPropertyNames(mixin.prototype)) {
        if (key !== "constructor" && !(key in c.prototype)) {
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
 * - `group`: Index name for multi-field indexes.
 *
 * @param options Options
 */
export const Index = MakePropertyDecorator(
  (target, propertyKey, options?: { group?: string }) => {
    const metadata = getMetadata(target.constructor, DatumStaticMetadata);
    metadata.addIndex(
      <string>propertyKey,
      options?.group || <string>propertyKey,
    );
  },
);

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
  metadata.generator = generator as unknown as DatumStaticMetadata["generator"];
});
