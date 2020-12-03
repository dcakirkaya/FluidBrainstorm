export type MfsItem = {  
    id: string;  
    url: string;
    label?: string;
    isParked?: boolean;     
}

//  if there are any common relationship types for all items - available to all apps, we can add them here.
type MfsCommonRelationshipType = 'parent' | 'child' | 'onDate'; 
export type MfsRelationshipType<R> = R extends MfsCommonRelationshipType ? MfsCommonRelationshipType : R extends string ? R : never;

export type MfsRelationship<R> = {    
    inId: string;
    outId: string;    
    type: MfsRelationshipType<R>;    
}

export type MfsQuery<T extends MfsItem> = {    
    filter?: (item: T) => boolean | string; 
    select?: Array<keyof T>;
    expand?: Array<keyof T>; 
}

export interface MfsDataModel<T extends MfsItem>{    
    createItem(item: T) : void;
    getItem(itemId: string) : T | undefined;
    deleteItem(itemId: string): void;    
    getItems(query?: MfsQuery<T>): IterableIterator<T | Partial<T>>; 
    on(event: "change", listener: () => void): this;
    off(event: "change", listener: () => void): this;   
}
