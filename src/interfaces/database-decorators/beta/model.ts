import * as DatabaseDev from '@ajs/database/beta';
import { Schema } from '@ajs/database/beta';
import { fromDatabase, fromPlainData, toDatabase, triggerEvent } from './modifiers/common';
import assert from 'assert';
import { Constructible, DatumStaticMetadata, DeepPartial, getMetadata } from './common';
import { Class, MakeParameterAndPropertyDecorator } from '@ajs/core/beta/decorators';
import { RequestContext, SetParameterProvider } from '@ajs/api/beta';

export type DataModel<T = any> = {
  readonly schemaName: string;
  new (database: DatabaseDev.SchemaInstance<any>): {
    readonly database: DatabaseDev.SchemaInstance<any>;
    readonly table: DatabaseDev.Table<T>;
  };
  fromDatabase(obj: any): T | undefined;
  fromPlainData(obj: any): T;
};

/**
 * Utility Class factory to create a basic Data Model with 1 table.
 *
 * @param dataType Database Table class
 * @param tableName Table name in Database
 */
export function BasicDataModel<T extends {}>(dataType: Constructible<T>, tableName?: string) {
  const metadata = getMetadata(dataType, DatumStaticMetadata);
  const resolvedName = tableName ?? metadata.tableName;
  assert(resolvedName, 'tableName must be provided or set via @RegisterTable');
  const name: string = resolvedName;
  const schemaName = metadata.schemaName;
  const primaryKey = metadata.primary;
  return class Model {
    public static readonly schemaName = schemaName!;
    /**
     * Converts some plain data into an instance of the Table class.
     *
     * @param obj Plain data object containing the table fields
     * @returns Table class instance
     */
    public static fromPlainData(obj: any) {
      return obj instanceof dataType ? obj : fromPlainData(obj, dataType);
    }

    /**
     * Converts an object acquired from the database into a Table class instance.
     *
     * @param obj Object resulting from a database get
     * @returns Table class instance
     */
    public static fromDatabase(obj: any) {
      return obj ? fromDatabase(obj, dataType) : undefined;
    }

    /**
     * Converts a Table class instance into an object fit to be inserted in the database.
     *
     * @param obj Table class instance
     * @returns Database-ready data
     */
    public static toDatabase(obj: any) {
      const instance = obj instanceof dataType ? obj : Model.fromPlainData(obj);
      return toDatabase(instance);
    }

    /**
     * AQL Table reference.
     */
    public readonly table: DatabaseDev.Table<T>;

    constructor(public readonly database: DatabaseDev.SchemaInstance<any>) {
      this.table = database.table(name);
    }

    /**
     * Get a single element from the table using its primary key.
     *
     * @param id Primary key value
     * @returns Table class instance
     */
    public get(id: string) {
      return this.table.get(id).then(Model.fromDatabase);
    }

    /**
     * Get multiple elements from the table using a given index.
     *
     * @param index Index name
     * @param keys Index value(s)
     * @returns Array of Table class instances.
     */
    public getBy(index: keyof T, ...keys: any[]) {
      return this.table
        .getAll(keys.length === 1 ? keys[0] : keys, <string>index)
        .then((dataR) => dataR.map(Model.fromDatabase) as T[]);
    }

    /**
     * Get all the elements from the table.
     *
     * @returns Array of Table class instances.
     */
    public getAll() {
      return this.table.then((dataR) => dataR.map(Model.fromDatabase) as T[]);
    }

    /**
     * Insert some data into the table.
     *
     * @param obj Table class instance or plain data
     * @param options Insert options
     * @returns Insert result
     */
    public insert(obj: DeepPartial<T> | Array<DeepPartial<T>>) {
      const converter = (entry: any) => {
        const instance = Model.fromPlainData(entry);
        triggerEvent(instance, 'insert');
        return Model.toDatabase(instance);
      };
      return this.table.insert(Array.isArray(obj) ? obj.map(converter) : converter(obj)).run();
    }

    /**
     * Updates a single element in the table.
     *
     * @param id Primary key value
     * @param obj Table class instance or plain data
     * @param options Update options
     * @returns Update result
     */
    public update(id: string, obj: DeepPartial<T>): Promise<number>;
    public update(obj: DeepPartial<T>): Promise<number>;
    public update(obj: DeepPartial<T> | string, data?: DeepPartial<T>) {
      if (typeof obj === 'string') {
        const instance = Model.fromPlainData(<DeepPartial<T>>data);
        triggerEvent(instance, 'update');
        return this.table.get(obj).update(Model.toDatabase(instance)).run();
      }
      const instance = Model.fromPlainData(obj);
      triggerEvent(instance, 'update');
      const id = (<any>obj)[primaryKey];
      assert(id !== undefined, 'Missing primary key in object update.');
      return this.table.get(id).update(Model.toDatabase(instance)).run();
    }

    /**
     * Delete an element from the table.
     *
     * @param id Primary key value
     * @returns Delete result
     */
    public delete(id: string) {
      return this.table.get(id).delete().run();
    }
  };
}

const modelCache = new Map<Class, Record<string, InstanceType<DataModel>>>();

export function GetModel<M extends InstanceType<DataModel>>(cl: DataModel & Class<M>, instanceId?: string) {
  if (!modelCache.has(cl)) {
    modelCache.set(cl, {});
  }
  const cache = modelCache.get(cl)!;
  const cacheKey = instanceId ?? '';
  if (cache[cacheKey]) return cache[cacheKey] as M;
  const schema = Schema.get(cl.schemaName);
  assert(schema, `Schema not found for '${cl.schemaName}'`);
  const model = new cl(schema.instance(instanceId));
  cache[cacheKey] = model;
  return model;
}

export const Model = MakeParameterAndPropertyDecorator(
  (
    target,
    key,
    index,
    cl: DataModel & Class<InstanceType<DataModel>>,
    instanceIdOrCallback?: string | ((ctx: RequestContext) => string | undefined),
  ) => {
    if (typeof instanceIdOrCallback === 'function') {
      SetParameterProvider(target, key, index, (ctx: RequestContext) => {
        return GetModel(cl, instanceIdOrCallback(ctx));
      });
    } else {
      SetParameterProvider(target, key, index, () => GetModel(cl, instanceIdOrCallback));
    }
  },
);
