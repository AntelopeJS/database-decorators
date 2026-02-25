import { Schema } from '@ajs/database/beta';
export declare function getSchemaForInstance(instanceId: string): Schema<any> | undefined;
export declare function CreateDatabaseSchemaInstance(schemaId: string, instanceId: string): Promise<void>;
