import * as DatabaseDev from '@ajs/database/beta';
import { Constructible, getMetadata } from '../common';

export const MixinSymbol = Symbol();

export type MixinType<T> = T extends { [MixinSymbol]: infer A } ? A : never;

export class Modifier<Meta extends {} = {}, Options extends {} = {}> {
  protected meta!: Meta;
  protected options!: Options;
}

export class OneWayModifier<
  LockedType,
  Args extends any[] = [],
  Meta extends {} = {},
  Options extends {} = {},
> extends Modifier<Meta, Options> {
  public lock(_locked_value: LockedType | undefined, _value: unknown, ..._args: Args): LockedType {
    throw new Error('Unimplemented');
  }
  public test(locked_value: LockedType, value: unknown, ...args: Args): boolean {
    return this.lock(undefined, value, ...args) === locked_value;
  }
}

type ProxyOrValArray<T extends any[]> = {
  [K in keyof T]: DatabaseDev.ValueProxy.ProxyOrVal<T[K]>;
};

export class TwoWayModifier<
  LockedType,
  Args extends any[] = [],
  Meta extends {} = {},
  Options extends {} = {},
> extends OneWayModifier<LockedType, Args, Meta, Options> {
  public unlock(_locked_value: LockedType, ..._args: Args): unknown {
    throw new Error('Unimplemented');
  }
  public unlockrequest(
    _data: DatabaseDev.ValueProxy.Proxy<LockedType>,
    _meta: DatabaseDev.ValueProxy.Proxy<Meta>,
    ..._args: ProxyOrValArray<Args>
  ): DatabaseDev.ValueProxy.Proxy<unknown> {
    throw new Error('Unimplemented');
  }
}

export class ContainerModifier<Meta extends {} = {}, Options extends {} = {}> extends TwoWayModifier<
  Record<string, unknown>,
  [key: string],
  Meta,
  Options
> {
  public override lock(locked_value: Record<string, unknown> | undefined, value: unknown, key: string) {
    return locked_value
      ? {
          ...locked_value,
          [key]: value,
        }
      : { [key]: value };
  }
  public override unlock(locked_value: Record<string, unknown>, key: string) {
    return locked_value[key];
  }
  public override unlockrequest(
    data: DatabaseDev.ValueProxy.Proxy<Record<string, unknown>>,
    meta: DatabaseDev.ValueProxy.Proxy<Meta>,
    key: DatabaseDev.ValueProxy.ProxyOrVal<string>,
  ): DatabaseDev.ValueProxy.Proxy<unknown> {
    return data(key);
  }
}

function isWriteOnly(modifier: Modifier) {
  return 'lock' in modifier && !('unlock' in modifier);
}

interface InternalType {
  meta: Record<string, object>;
  data: Record<string, any>;
}

export class ModifiersStaticMetadata {
  public static key = Symbol();

  [key: string]: Array<{ id: string; modifier: Modifier; metaRef: { _ref: any } }>;
}

function withRef<T extends Modifier, U>(
  internal: InternalType,
  id: ModifiersStaticMetadata[string][number]['id'],
  modifier: ModifiersStaticMetadata[string][number]['modifier'],
  metaRef: ModifiersStaticMetadata[string][number]['metaRef'],
  callback: (modifier: T) => U,
): U {
  metaRef._ref = internal.meta[id];
  const ret = callback(modifier as T);
  if (metaRef._ref !== internal.meta[id]) {
    internal.meta[id] = metaRef._ref;
  }
  return ret;
}

export class ModifiersDynamicMetadata {
  public static key = Symbol();

  staticMeta: ModifiersStaticMetadata;
  floating: Record<string, any> = {}; // Plain data that has no known lock value
  fields: Record<string, Record<string, any[]>> = {};

  constructor(target: any) {
    this.staticMeta = getMetadata(target.constructor, ModifiersStaticMetadata);
    for (const field of Object.keys(this.staticMeta)) {
      this.fields[field] = {};
    }
  }

  canGet(field: string) {
    const list = this.staticMeta[field];
    return (
      !isWriteOnly(list[list.length - 1].modifier) &&
      !list.some(({ id, modifier }) => !(<any>modifier).autounlock && 'unlock' in modifier && !(id in this.fields[field]))
    );
  }

  get(field: string, internal: InternalType) {
    if (field in this.floating) {
      return this.floating[field];
    }
    if (!this.canGet(field)) {
      return;
    }
    const list = this.staticMeta[field];
    let value = internal.data[field];
    for (const { id, modifier, metaRef } of list) {
      if ('unlock' in modifier && value !== undefined) {
        if (this.fields[field][id]) {
          value = withRef(internal, id, modifier, metaRef, (modifier: TwoWayModifier<unknown, any[]>) =>
            modifier.unlock(value, ...this.fields[field][id]),
          );
        } else if ((<any>modifier).autounlock) {
          value = withRef(internal, id, modifier, metaRef, (modifier: TwoWayModifier<unknown, any[]>) =>
            modifier.unlock(value),
          );
        }
      }
    }
    return value;
  }

  canSet(field: string) {
    const list = this.staticMeta[field];
    return !list.some(
      ({ id, modifier }) => !(<any>modifier).autolock && 'lock' in modifier && !(id in this.fields[field]),
    );
  }

  set(field: string, internal: InternalType, value: unknown) {
    if (!this.canSet(field)) {
      this.floating[field] = value;
      return;
    }
    const list = this.staticMeta[field];

    // TODO: should maybe cache this
    const prevlist: {
      id: string;
      modifier: Modifier<{}, {}>;
      metaRef: { _ref: any };
      prev: unknown;
    }[] = [];
    let prev = internal.data[field];
    for (let i = 0; i < list.length - 1; ++i) {
      const { id, modifier, metaRef } = list[i];
      prevlist[i] = { id, modifier, metaRef, prev };
      if ('unlock' in modifier) {
        if (this.fields[field][id]) {
          prev = (<TwoWayModifier<unknown, any[]>>modifier).unlock(prev, ...this.fields[field][id]);
        } else {
          prev = undefined;
        }
      }
    }
    prevlist.push({
      ...list[list.length - 1],
      prev,
    });

    for (let i = prevlist.length - 1; i >= 0; --i) {
      const { id, modifier, metaRef, prev } = prevlist[i];
      if ('lock' in modifier) {
        value = withRef(internal, id, modifier, metaRef, (modifier: OneWayModifier<unknown, any[]>) =>
          modifier.lock(prev, value, ...(this.fields[field][id] || [])),
        );
      }
    }
    internal.data[field] = value;
    delete this.floating[field];
  }
}

function getInternal(object: any): InternalType {
  if (!object._internal) {
    object._internal = {
      meta: {},
      data: {},
    };
  }
  return object._internal;
}

export function fromPlainData<T extends Constructible>(rawObject: Record<string, any>, TableClass: T): InstanceType<T> {
  const shallowCopy: Record<string, any> = {};
  // Attach prototype
  Object.setPrototypeOf(shallowCopy, TableClass.prototype);
  for (const [key, val] of Object.entries(rawObject)) {
    shallowCopy[key] = val;
  }
  return shallowCopy as InstanceType<T>;
}

export function toPlainData<T extends { constructor: any }>(object: T): Record<string, any> {
  const metaTable = getMetadata(object.constructor, ModifiersStaticMetadata);
  const result = { ...object };
  delete (<any>result)._internal;
  for (const field of Object.keys(metaTable)) {
    result[<keyof T>field] = object[<keyof T>field]; // Populate unlocked fields
  }
  return result;
}

export function fromDatabase<T extends Constructible>(rawObject: any, TableClass: T): InstanceType<T> {
  // Generate Meta
  const shallowCopy = { ...rawObject };
  // Attach prototype
  Object.setPrototypeOf(shallowCopy, TableClass.prototype);
  return shallowCopy;
}

export function toDatabase<T extends { constructor: any }>(object: T): Record<string, any> {
  return { ...object };
}

type ExtractModifierOptions<T> = T extends Modifier<any, infer Options> ? Options : undefined;
type ExtractModifierArgs<T> = T extends OneWayModifier<any, infer Args> ? Args : [];

export function attachModifier<T extends Constructible, M extends Constructible<Modifier>>(
  TableClass: T,
  Modifier: M,
  field: keyof InstanceType<T>,
  options: ExtractModifierOptions<InstanceType<M>>,
) {
  const entry = {
    id: Modifier.name,
    modifier: new Modifier(),
    metaRef: { _ref: {} },
  };
  (entry.modifier as any).meta = new Proxy(entry.metaRef, {
    get: (self, p) => {
      if (!self._ref) return undefined;
      return Reflect.get(self._ref, p, self._ref);
    },
    set: (self, p, v) => {
      if (!self._ref) self._ref = {};
      return Reflect.set(self._ref, p, v, self._ref);
    },
  });
  (entry.modifier as any).options = options;

  // Mark TableClass as special
  const metaTable = getMetadata(TableClass, ModifiersStaticMetadata);
  // Add Modifier to TableClass[field] with options
  if (field in metaTable) {
    const list = metaTable[<string>field];
    const last = list[list.length - 1];
    if (isWriteOnly(last.modifier)) {
      if (isWriteOnly(entry.modifier)) {
        throw new Error(
          `Attempted adding Modifier ${entry.id} on ${TableClass.name}.${<string>(
            field
          )} but it already has a One-Way Modifier`,
        );
      } else {
        console.error(
          `Adding Modifier ${entry.id} on ${TableClass.name}.${<string>(
            field
          )} after a One-Way Modifier, please review your ordering.`,
        );
        list.splice(list.length - 1, 0, entry);
      }
    } else {
      list.push(entry);
    }
  } else {
    metaTable[<string>field] = [entry];
  }

  Object.defineProperty(TableClass.prototype, field, {
    get: function () {
      return getMetadata(this, ModifiersDynamicMetadata).get(<string>field, getInternal(this));
    },
    set: function (value) {
      getMetadata(this, ModifiersDynamicMetadata).set(<string>field, getInternal(this), value);
    },
  });
  if (!('toJSON' in TableClass.prototype)) {
    Object.defineProperty(TableClass.prototype, 'toJSON', {
      value: function () {
        return toPlainData(this);
      },
    });
  }
}

export function getModifiedFields<T extends { constructor: any }, M extends Constructible<Modifier>>(
  object: T,
  Modifier: M,
): (keyof T)[] {
  const metaTable = getMetadata(object.constructor, ModifiersStaticMetadata);
  return Object.keys(metaTable).filter((field) =>
    metaTable[field]?.find(({ id }) => id === Modifier.name),
  ) as (keyof T)[];
}

export function unlock<T extends { constructor: any }, M extends Constructible<Modifier>>(
  object: T,
  Modifier: M,
  fields: Array<keyof T> | undefined,
  ...args: ExtractModifierArgs<InstanceType<M>>
) {
  const metaTable = getMetadata(object.constructor, ModifiersStaticMetadata);
  const usedFields = (fields ?? (Object.keys(metaTable) as Array<keyof T>)).filter((field) =>
    metaTable[<string>field]?.find(({ id }) => id === Modifier.name),
  );
  // Get metadata
  const meta = getMetadata(object, ModifiersDynamicMetadata);
  // for each field set metadata[field][Modifier] to args
  for (const field of usedFields) {
    meta.fields[<string>field][Modifier.name] = args;
    if (field in meta.floating) {
      // check floating
      object[field] = meta.floating[<string>field];
    }
  }
}

type ModifierWithProxyArgs = {
  modifier: Constructible<TwoWayModifier<any, any[]>>;
  args: DatabaseDev.ValueProxy.ProxyOrVal[];
};
export function unlockrequest<T extends {}, K extends keyof T>(
  table: Constructible<T>,
  object: DatabaseDev.ValueProxy.Proxy<T>,
  field: K,
  modifiers: ModifierWithProxyArgs[],
): DatabaseDev.ValueProxy.Proxy<T[K]> {
  const args = modifiers.reduce(
    (a, { modifier, args }) => Object.assign(a, { [modifier.name]: args }),
    {} as Record<string, any[]>,
  );

  const meta = (<any>object)('_internal')('meta');
  const metaTable = getMetadata(table, ModifiersStaticMetadata);
  return (
    metaTable[<string>field]?.reduce(
      (data, { id, modifier }) => {
        if (isWriteOnly(modifier)) {
          return data;
        }
        data = (<TwoWayModifier<any, any[]>>modifier).unlockrequest(data, meta(id), ...args[id]);
        return data;
      },
      (<any>object)('_internal')('data')(field),
    ) || (<any>object)(field)
  );
}

export function lock<T extends { constructor: any }, M extends Constructible<Modifier>>(
  object: T,
  Modifier: M,
  fields: Array<keyof T> | undefined,
  ...args: ExtractModifierArgs<InstanceType<M>> | []
) {
  const metaTable = getMetadata(object.constructor, ModifiersStaticMetadata);
  const usedFields = (fields ?? (Object.keys(metaTable) as Array<keyof T>)).filter((field) =>
    metaTable[<string>field]?.find(({ id }) => id === Modifier.name),
  );
  // Get metadata
  const meta = getMetadata(object, ModifiersDynamicMetadata);
  // for each field set metadata[field][Modifier] to args
  for (const field of usedFields) {
    const val = object[field];
    meta.fields[<string>field][Modifier.name] = args;
    object[field] = val;
  }
}

export function testValue<T extends { constructor: any }, K extends keyof T>(object: T, field: K, value: T[K]) {
  const metaTable = getMetadata(object.constructor, ModifiersStaticMetadata);
  // Get metadata
  const meta = getMetadata(object, ModifiersDynamicMetadata);
  const internal = getInternal(object);
  let val: unknown = internal.data[<string>field];
  for (const { id, modifier, metaRef } of metaTable[<string>field]) {
    const args = meta.fields[<string>field][id] || ((<any>modifier).autolock && []);
    if (!args) return false;
    if (isWriteOnly(modifier)) {
      // return OneWayModifier.test(unwrapped, value)
      return withRef(internal, id, modifier, metaRef, (modifier: OneWayModifier<unknown, any[]>) =>
        modifier.test(val, value, ...args),
      );
    }
    if ('unlock' in modifier && val !== undefined) {
      // unwrap field until the OneWayModifier
      return withRef(internal, id, modifier, metaRef, (modifier: TwoWayModifier<unknown, any[]>) =>
        modifier.unlock(val, ...args),
      );
    }
  }
  return val === value;
}
