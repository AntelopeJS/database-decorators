export type Constructible<T = object, A extends unknown[] = unknown[]> = new (
  ...args: A
) => T;

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U1>
    ? Array<DeepPartial<U1>>
    : T[K] extends ReadonlyArray<infer U2>
      ? ReadonlyArray<DeepPartial<U2>>
      : T[K] extends object
        ? DeepPartial<T[K]>
        : T[K];
};

export type DatumGeneratorOutput =
  | Record<string, unknown>
  | Array<Record<string, unknown>>
  | undefined;
export type DatumGenerator = (
  tableClass: Constructible,
) => DatumGeneratorOutput | Promise<DatumGeneratorOutput>;

export interface MetadataClass<TMetadata> extends Constructible<TMetadata> {
  key: symbol;
}

/**
 * Table class Metadata.
 */
export class DatumStaticMetadata {
  public static key = Symbol();

  public tableName?: string;
  public schemaName?: string;
  public readonly indexes: Record<string, Array<string>> = {};
  public primary: string = "_id";
  public generator?: DatumGenerator;

  addIndex(key: string, group: string) {
    if (!(group in this.indexes)) {
      this.indexes[group] = [];
    }
    this.indexes[group].push(key);
  }
}

export function getMetadata<TMetadata, TTarget extends object>(
  target: TTarget,
  metadataClass: MetadataClass<TMetadata>,
  inherit: boolean = true,
): TMetadata {
  const existingMetadata = Reflect.getOwnMetadata(metadataClass.key, target) as
    | TMetadata
    | undefined;
  if (existingMetadata) {
    return existingMetadata;
  }

  const prototype = Object.getPrototypeOf(target) as TTarget | null;
  const inheritedMetadata =
    inherit && prototype
      ? (Reflect.getOwnMetadata(metadataClass.key, prototype) as
          | TMetadata
          | undefined)
      : undefined;
  const metadata = inheritedMetadata ?? new metadataClass(target);
  Reflect.defineMetadata(metadataClass.key, metadata, target);
  return metadata;
}
