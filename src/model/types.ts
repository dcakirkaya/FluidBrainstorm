/** COMMON MFS MODEL  */
export type MfsItemData = {    
    id: string;
    url: string;
    label?: string;
    isParked?: boolean; 
};

export type MfsItem = {    
    id: string;
    url: string;
    label?: string;
    isParked?: boolean; 
};

export type MfsProperty = {
    appId: string;
    propertyName: string;
}

export type MfsQuery = {    
    filter?: (item: MfsItem) => boolean;
    /**
     * The properties to include in the result MfsItems. If using properties shared from other apps, then need to specify MfsProperty.
     */
    select?: MfsProperty | MfsProperty[] | string[] | string;
}

export interface MfsDataModel<T extends MfsItem> {    
    putItem(item: T) : void;
    getItem(itemId: string, query?: MfsQuery) : T | undefined;
    deleteItem(itemId: string): void;    
    getItems(query?: MfsQuery): IterableIterator<T>; 
    on(event: "change", listener: () => void): this;
    off(event: "change", listener: () => void): this;    
}


/** MFS APP SPECIFIC MODEL */

export const MfsAppId = "MfsAppId";

export type User = {
    id: string;
    name: string;
};

// custom item, can be liked by users. 
export type MfsItemExtension = {
    user: User;
    likes: number;    
};

export type MfsAppItem = MfsItem & MfsItemExtension;

export interface MfsAppDataModel  extends MfsDataModel<MfsAppItem> {
    getUser(): User | undefined;
    getUsers(): User[];    
    like: (itemId: string) => void;
    createAppItem (url: string, label: string): void;
}
 
