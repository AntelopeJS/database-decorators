import * as DatabaseDev from '@ajs/database/beta';
import { Constructible, DeepPartial } from './common';
import { Class } from '@ajs/core/beta/decorators';
import { RequestContext } from '@ajs/api/beta';
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
export declare function BasicDataModel<T extends {}>(dataType: Constructible<T>, tableName?: string): {
    new (database: DatabaseDev.SchemaInstance<any>): {
        /**
         * AQL Table reference.
         */
        readonly table: DatabaseDev.Table<T>;
        readonly database: DatabaseDev.SchemaInstance<any>;
        /**
         * Get a single element from the table using its primary key.
         *
         * @param id Primary key value
         * @returns Table class instance
         */
        get(id: string): PromiseLike<T | undefined>;
        /**
         * Get multiple elements from the table using a given index.
         *
         * @param index Index name
         * @param keys Index value(s)
         * @returns Array of Table class instances.
         */
        getBy(index: keyof T, ...keys: any[]): PromiseLike<T[]>;
        /**
         * Get all the elements from the table.
         *
         * @returns Array of Table class instances.
         */
        getAll(): PromiseLike<T[]>;
        /**
         * Insert some data into the table.
         *
         * @param obj Table class instance or plain data
         * @param options Insert options
         * @returns Insert result
         */
        insert(obj: DeepPartial<T> | Array<DeepPartial<T>>): Promise<string[]>;
        /**
         * Updates a single element in the table.
         *
         * @param id Primary key value
         * @param obj Table class instance or plain data
         * @param options Update options
         * @returns Update result
         */
        update(id: string, obj: DeepPartial<T>): Promise<number>;
        update(obj: DeepPartial<T>): Promise<number>;
        /**
         * Delete an element from the table.
         *
         * @param id Primary key value
         * @returns Delete result
         */
        delete(id: string): Promise<number>;
    };
    readonly schemaName: string;
    /**
     * Converts some plain data into an instance of the Table class.
     *
     * @param obj Plain data object containing the table fields
     * @returns Table class instance
     */
    fromPlainData(obj: any): T;
    /**
     * Converts an object acquired from the database into a Table class instance.
     *
     * @param obj Object resulting from a database get
     * @returns Table class instance
     */
    fromDatabase(obj: any): T | undefined;
    /**
     * Converts a Table class instance into an object fit to be inserted in the database.
     *
     * @param obj Table class instance
     * @returns Database-ready data
     */
    toDatabase(obj: any): Record<string, any>;
};
export declare function GetModel<M extends InstanceType<DataModel>>(cl: DataModel & Class<M>, instanceId?: string): M;
export declare const StaticModel: (cl: DataModel<any> & Class<{
    readonly database: DatabaseDev.SchemaInstance<any>;
    readonly table: DatabaseDev.Table<any>;
}>, instanceId?: string | undefined) => import("@ajs/core/beta/decorators").PropertyDecorator & import("@ajs/core/beta/decorators").ParameterDecorator;
export declare const DynamicModel: (cl: DataModel<any> & Class<{
    readonly database: DatabaseDev.SchemaInstance<any>;
    readonly table: DatabaseDev.Table<any>;
}>, callback: (ctx: RequestContext) => string | undefined) => import("@ajs/core/beta/decorators").PropertyDecorator & import("@ajs/core/beta/decorators").ParameterDecorator;
