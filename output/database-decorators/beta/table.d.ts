import { MixinType, MixinSymbol } from './modifiers/common';
import { ClassDecorator } from '@ajs/core/beta/decorators';
import { Constructible } from './common';
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
export declare const TableMetaSymbol: unique symbol;
export declare const TableRefSymbol: unique symbol;
export type ExtractTableMeta<T> = T extends {
    [TableMetaSymbol]: infer Meta;
} ? (Meta extends {} ? Meta : never) : {};
export interface TableClass<Base = {}, Args extends any[] = [], Meta extends {} | undefined = undefined> {
    new (...args: Args): {
        id: string;
    } & Base & (Meta extends {} ? {
        [TableMetaSymbol]: Meta;
    } : {});
    with<This extends TableClass, T extends Constructible<{
        [MixinSymbol]: Constructible;
    }>[] = []>(this: This, ...other: T): TableClass<InstanceType<This> & UnionToIntersection<InstanceType<MixinType<InstanceType<T[number]>>>>, ConstructorParameters<This>, ExtractTableMeta<InstanceType<This>> | ExtractTableMeta<InstanceType<T[number]>>>;
}
/**
 * Database Table superclass
 */
export declare class Table {
    id: string;
    /**
     * Supplement the superclass with Modifier mixins.
     *
     * @param others List of Modifier mixin classes
     * @returns New superclass
     */
    static with<This extends typeof Table, T extends Constructible<{
        [MixinSymbol]: Constructible;
    }>[] = []>(this: This, ...others: T): TableClass<InstanceType<This> & UnionToIntersection<InstanceType<MixinType<InstanceType<T[number]>>>>, ConstructorParameters<This>, ExtractTableMeta<InstanceType<This>> | ExtractTableMeta<InstanceType<T[number]>>>;
}
/**
 * Database Table Index decorator.
 *
 * Available options:
 * - `group`: Index name for multi-field indexes.
 *
 * @param options Options
 */
export declare const Index: (options?: {
    group?: string;
} | undefined) => import("@ajs/core/beta/decorators").PropertyDecorator;
type AwaitableArray<T> = Promise<T | T[]> | T | T[];
/**
 * Database Table class decorator to create default data on table creation.
 *
 * @param generator Data generator
 */
export declare const Fixture: <T extends typeof Table>(generator: (p: T) => AwaitableArray<Partial<InstanceType<T>>>) => ClassDecorator<T>;
export {};
