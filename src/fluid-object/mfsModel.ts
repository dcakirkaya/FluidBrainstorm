export type MfsItem = {  
    id: string;  
    url: string;
    label?: string;
    isParked?: boolean;     
}

// export type MfsRelationshipType = 'parent' | 'child' | 'onDate'; // TODO: use if there are some common relationship types for all apps?
// export type ExtendedMfsRelationshipType<R> = R extends MfsRelationshipType ? MfsRelationshipType : R extends string ? R : never;

// export type MfsRelationship<TRelationship> = {    
//     inId: string;
//     outId: string;    
//     type: ExtendedMfsRelationshipType<TRelationship>;    
// }

export type MfsQuery = {    
    filter?: (item: MfsItem) => boolean | string; 
    select?: string[];
    expand?: string;
}

export interface MfsDataModel<T extends MfsItem>{    
    createItem(item: T) : void;
    getItem(itemId: string, query?: MfsQuery) : T | undefined;
    deleteItem(itemId: string): void;    
    getItems(query?: MfsQuery): IterableIterator<T | unknown>; 
    on(event: "change", listener: () => void): this;
    off(event: "change", listener: () => void): this;   
}
