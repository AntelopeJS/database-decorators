import * as DatabaseDev from '@ajs/database/beta';
import { fromDatabase, fromPlainData, toDatabase, triggerEvent } from './modifiers/common';
import assert from 'assert';
import { Constructible, DatumStaticMetadata, DeepPartial, getMetadata } from './common';
import { Class, MakeParameterAndPropertyDecorator } from '@ajs/core/beta/decorators';
import { RequestContext, SetParameterProvider } from '@ajs/api/beta';
import { getSchemaForDatabase } from './database';

export type DataModel<T = any> = {
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
export function BasicDataModel<T extends {}, Name extends string>(dataType: Constructible<T>, tableName: Name) {
  const primaryKey = getMetadata(dataType, DatumStaticMetadata).primary;
  return class Model {
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

    constructor(public readonly database: DatabaseDev.SchemaInstance<{ [K in Name]: T }>) {
      this.table = database.table(tableName);
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

export function GetModel<M extends InstanceType<DataModel>>(cl: Class<M>, databaseName: string) {
  if (!modelCache.has(cl)) {
    modelCache.set(cl, {});
  }
  const cache = modelCache.get(cl)!;
  if (cache[databaseName]) return cache[databaseName] as M;
  const schema = getSchemaForDatabase(databaseName);
  assert(schema, `Schema not found for database '${databaseName}'`);
  const model = new cl(schema.instance(databaseName));
  cache[databaseName] = model;
  return model;
}

export const StaticModel = MakeParameterAndPropertyDecorator(
  (target, key, index, cl: Class<InstanceType<DataModel>>, databaseName: string) => {
    SetParameterProvider(target, key, index, () => GetModel(cl, databaseName));
  },
);

export const DynamicModel = MakeParameterAndPropertyDecorator(
  (target, key, index, cl: Class<InstanceType<DataModel>>, callback: (ctx: RequestContext) => string) => {
    SetParameterProvider(target, key, index, (ctx: RequestContext) => {
      return GetModel(cl, callback(ctx));
    });
  },
);
