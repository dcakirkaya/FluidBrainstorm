import { MfsRelationship } from "./mfsRelationship";
import { MfsValue } from "./mfsValue";

// SharedMap requires its keys to be strings and values to be serializable - non-serializable keys or values can't be transmitted to other clients.
export type MfsItem = {
    readonly id: string;        
    [propertyName:string] : MfsValue;    
}

export type MfsSystemProperty = 'id'; // add more 

/**
 * All the required keys of type T. Used by the SDK to implement type-guard on read 
 */
export type RequiredKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T];

export type MfsQuery = {    
    filter?: (item: ItemMap) => boolean; 
    select?: string[];
}


export type ItemMap = Map<string, MfsValue>;

export interface MfsDataModel<T extends MfsItem> {       
    createItem(item: Omit<T, 'id'>) : Promise<string>;
    getItem(itemId: string) : Promise<T | undefined>;
    deleteItem(itemId: string): Promise<void>;
    deleteItems() : void; 
    patchItem(itemId: string, item: Partial<Omit<T, 'id'>>): Promise<void>;
    putItem(itemId: string, item: Omit<T, 'id'>): Promise<void>;
    setItemProperty(itemId: string, propertyKey: string, propertyValue: MfsValue): Promise<void>;       
    getItemProperty(itemId: string, propertyKey: string): Promise<MfsValue | undefined>;
    deleteItemProperty(itemId: string, propertyKey: string): Promise<void>;    
    getItems(query?: MfsQuery): AsyncIterableIterator<Partial<T>>;
    createRelationship(relationship: MfsRelationship): Promise<void>;         
    on(event: "change", listener: () => void): this;
    off(event: "change", listener: () => void): this;   
}
