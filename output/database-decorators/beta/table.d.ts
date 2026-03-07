import { type ClassDecorator } from "@ajs/core/beta/decorators";
import { type Constructible } from "./common";
import { MixinSymbol, type MixinType } from "./modifiers/common";
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
export declare const TableMetaSymbol: unique symbol;
export declare const TableRefSymbol: unique symbol;
export type ExtractTableMeta<T> = T extends {
    [TableMetaSymbol]: infer Meta;
} ? Meta extends object ? Meta : never : object;
export interface TableClass<Base = object, Args extends any[] = [], Meta extends object | undefined = undefined> {
    new (...args: Args): {
        _id: string;
    } & Base & (Meta extends object ? {
        [TableMetaSymbol]: Meta;
    } : object);
    with<This extends TableClass, T extends Constructible<{
        [MixinSymbol]: Constructible;
    }>[] = []>(this: This, ...other: T): TableClass<InstanceType<This> & UnionToIntersection<InstanceType<MixinType<InstanceType<T[number]>>>>, ConstructorParameters<This>, ExtractTableMeta<InstanceType<This>> | ExtractTableMeta<InstanceType<T[number]>>>;
}
/**
 * Database Table superclass
 */
export declare class Table {
    _id: string;
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
