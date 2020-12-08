/** MFS APP PACKAGE*/

import { AutoNote, FakeUser } from "../demo";
import { IUser, MfsAppItem, MfsItem, MfsQuery } from "..";
import { MfsAppData, MfsAppProperties } from "./appModel";

import { DataObjectFactory } from "@fluidframework/aqueduct";
import { IFluidHandle } from "@fluidframework/core-interfaces";
import { MfsDataObject } from "../mfsPackage/mfsDataObject";
import { SharedMap } from "@fluidframework/map";

export class MfsAppDataObject extends MfsDataObject {    
    // define app specific DDSes 
    private usersMap: SharedMap;    
    private userId: string;
    
    protected async initializingFirstTime() {       
        super.initializingFirstTime();
        this.createSharedMap("users");
    }
    
    protected async hasInitialized() {
        // initialize app-specific fluid objects
        super.hasInitialized();
        this.usersMap = await this.root.get<IFluidHandle<SharedMap>>("users").get();        
        this.addUser();
        this.createEventListeners(this.usersMap);
    }

    /**
     * Creates a "fake" user based on a fake user id and a fake name.
     * Only use this code for protoyping and demos.
     */
    addUser = (): void => {
        // Check for a #userId in SessionStorage - this prevents refresh from generating a new user
        if (sessionStorage.getItem('#userId') &&
            this.usersMap.get<IUser>(sessionStorage.getItem('#userId'))) {
            this.userId = sessionStorage.getItem('#userId'); //This session might have has a user
        } else {
            const user: IUser = {
                id: FakeUser.getFakeUserId(),
                name: FakeUser.getFakeName()
            };
            this.userId = user.id;
            sessionStorage.setItem('#userId', user.id);
            this.usersMap.set(user.id, user);
        }
    }
    
    getUser = (): IUser => {
        return this.usersMap.get<IUser>(this.userId);
    }

    getUsers(): IUser[] {
        const users: IUser[] = [];
        this.usersMap.forEach((i: IUser) => {
            users.push(i);
        });
        return users;
    }
    
    like = async (itemId: string) : Promise<void> => {
        // ideally we should use counter dds *with atomic cas - but here we just do compare and set without atomicity
        const likes = await this.getItemProperty(itemId, 'numLikes') as number; // this can totally throw in Runtime. find a better way .== or maybe it's better to let it throw so we can fix it.
        const itemPatch: Pick<MfsAppItem, 'numLikes'> = { numLikes: likes + 1 };
        return this.patchItem(itemId, itemPatch);
    }
    
    createAppItem = (url: string, label: string): Promise<string> => {
        const appData: MfsAppData = {                        
            numLikes: 0,
            user: this.getUser()
        };
        
        const appItem: Omit<MfsItem, 'id'> = { ...appData, label: label, url: url};
        return this.createItem(appItem);
    }
    

    getItemsFromBoard =  (filter?: string): AsyncIterableIterator<MfsAppItem> => {
        
        const query: MfsQuery | undefined = !!filter ? {
            filter : (itemMap) => { 
                const url = (itemMap.get('url') as string).toLowerCase();
                return url.includes(filter.toLowerCase());
            }

        } : undefined;

        
        return this.getItems(query) as AsyncIterableIterator<MfsAppItem>;
    }
    
    createDemoItem = (): string => {
        return AutoNote.createDemoNote()
    }
    
    async getItem(itemId: string): Promise<MfsAppItem | undefined> {        
        const mfsItem = await super.getItem(itemId);
        
        if (!mfsItem) {
            return undefined;
        }

        if (this.isMfsAppItem(mfsItem)) {
            return mfsItem;
        }
    }
    
    private isMfsAppItem (item: MfsItem): item is MfsAppItem {        
        for(const k in MfsAppProperties) {
            if (!item[k]) {
                return false;
            }
        }

        return true;
    }
}


/**
 * The DataObjectFactory declares the component
 * and defines any additional distributed data structures.
 * To add a SharedSequence, SharedMap, or any other
 * structure, put it in the array below.
 * 
 * Note: This project uses SharedMap so it is added below...
 */
export const MfsAppDataObjectInstantiationFactory = new DataObjectFactory(
    "MfsAppDataObject",
    MfsAppDataObject,
    [
        SharedMap.getFactory(),
    ],
    {},
);
