export type Constructible<T = object, A extends unknown[] = unknown[]> = new (...args: A) => T;
export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends Array<infer U1> ? Array<DeepPartial<U1>> : T[K] extends ReadonlyArray<infer U2> ? ReadonlyArray<DeepPartial<U2>> : T[K] extends object ? DeepPartial<T[K]> : T[K];
};
export type DatumGeneratorOutput = Record<string, unknown> | Array<Record<string, unknown>> | undefined;
export type DatumGenerator = (tableClass: Constructible) => DatumGeneratorOutput | Promise<DatumGeneratorOutput>;
export interface MetadataClass<TMetadata> extends Constructible<TMetadata> {
    key: symbol;
}
/**
 * Table class Metadata.
 */
export declare class DatumStaticMetadata {
    static key: symbol;
    tableName?: string;
    schemaName?: string;
    readonly indexes: Record<string, Array<string>>;
    primary: string;
    generator?: DatumGenerator;
    addIndex(key: string, group: string): void;
}
export declare function getMetadata<TMetadata, TTarget extends object>(target: TTarget, metadataClass: MetadataClass<TMetadata>, inherit?: boolean): TMetadata;
