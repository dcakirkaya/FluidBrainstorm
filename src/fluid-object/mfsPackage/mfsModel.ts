import { Serializable } from "./serializable";

// SharedMap requires its keys to be strings and values to be serializable - non-serializable keys or values can't be transmitted to other clients.
export type MfsItem = {
    readonly id: string;       
    [propertyName:string] : Serializable;
}

export type MfsSystemProperty = 'id'; // add more 

//  if there are any common relationship types for all items - available to all apps, we can add them here.
type MfsCommonRelationshipType = 'parent' | 'child' | 'onDate'; 
export type MfsRelationshipType<R> = R extends MfsCommonRelationshipType ? MfsCommonRelationshipType : R extends string ? R : never;

export type RequiredKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T];

export type MfsRelationship<R> = {    
    inId: string;
    outId: string;    
    type: MfsRelationshipType<R>;    
}

export type MfsQuery<T = MfsItem> = {    
    filter?: (item: T) => boolean | string; 
    select?: string[];
    expand?: string[]; 
}

export interface MfsDataModel<T extends MfsItem> {    
    createItem(item: Omit<T, 'id'>) : string;
    getItem(itemId: string) : T | undefined;
    deleteItem(itemId: string): void; 
    patchItem(itemId: string, item: Partial<Omit<T, 'id'>>): void;
    putItem(itemId: string, item: Omit<T, 'id'>): void;
    setItemProperty(itemId: string, propertyKey: string, propertyValue: Serializable): void;  // TODO: prevent setting id.       
    getItemProperty(itemId: string, propertyKey: string): Serializable | undefined;    
    getItems(query?: MfsQuery<T>): IterableIterator<Partial<T>>; 
    on(event: "change", listener: () => void): this;
    off(event: "change", listener: () => void): this;   
}
