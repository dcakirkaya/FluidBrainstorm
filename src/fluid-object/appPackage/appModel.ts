/** MFS APP PACKAGE*/

import { MfsDataModel, MfsItem, MfsSystemProperty, RequiredKeys } from "../mfsPackage/mfsModel";

export const MfsAppId = "MfsAppId";

export type User = {
    id: string;
    name: string;
};

export type MfsAppData = {
    user: User;  
    numLikes: number;       
};

export type MfsAppItem = MfsItem & MfsAppData;

// TODO: move this to mfs package 
type MfsAppProperty = RequiredKeys<MfsAppData>;

// should keep a record of all required properties. 
export const MfsAppProperties: Record<MfsAppProperty| MfsSystemProperty, boolean> =  { id: true, user: true, numLikes: true}; 

export interface MfsAppDataModel  extends MfsDataModel<MfsAppItem> {
    addUser(): void;    
    getUser(): User | undefined;
    getUsers(): User[];    
    like: (itemId: string) => Promise<void>;
    getItemsFromBoard: (filterString?: string) => AsyncIterableIterator<MfsAppItem>;
    createAppItem: (url: string, label?: string) => Promise<string>;
    createDemoItem: () => string;
    clear: () => void;
}
