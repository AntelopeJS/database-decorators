export type Constructible<T = {}, A extends any[] = any[]> = { new (...args: A): T };

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U1>
    ? Array<DeepPartial<U1>>
    : T[K] extends ReadonlyArray<infer U2>
      ? ReadonlyArray<DeepPartial<U2>>
      : DeepPartial<T[K]>;
};

/**
 * Table class Metadata.
 */
export class DatumStaticMetadata {
  public static key = Symbol();

  public readonly indexes: Record<string, Array<string>> = {};
  public primary: string = 'id';

  public generator?: (cl: any) => any;

  addIndex(key: string, group: string) {
    if (!(group in this.indexes)) {
      this.indexes[group] = [];
    }
    this.indexes[group].push(key);
  }
}

export function getMetadata<T, U extends {}>(
  target: U,
  meta: Constructible<T, [U]> & { key: symbol },
  inherit: boolean = true,
): T {
  let data = Reflect.getOwnMetadata(meta.key, target) as T;
  if (!data) {
    const proto = Object.getPrototypeOf(target);
    data = (inherit && proto && Reflect.getOwnMetadata(meta.key, proto)) || new meta(target);
    Reflect.defineMetadata(meta.key, data, target);
  }
  return data;
}
