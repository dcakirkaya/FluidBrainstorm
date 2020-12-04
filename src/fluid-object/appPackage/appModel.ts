/** MFS APP PACKAGE*/

import { MfsDataModel, MfsItem } from "../mfsPackage/mfsModel";

export const MfsAppId = "MfsAppId";

export type User = {
    id: string;
    name: string;
};

export type MfsAppItem = MfsItem & {
    user: User;  
    numLikes: number;    
};

export interface MfsAppDataModel  extends MfsDataModel<MfsAppItem> {
    addUser(): void;    
    getUser(): User | undefined;
    getUsers(): User[];    
    like: (itemId: string) => void;
    getItemsFromBoard: () => IterableIterator<MfsAppItem>;
    createAppItem: (url: string, label?: string) => void;
    createDemoItem: () => string;
}
