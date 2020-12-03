/** MFS APP SPECIFIC MODEL */

import { DataObject, DataObjectFactory } from "@fluidframework/aqueduct";
import { MfsDataModel, MfsItem, MfsQuery } from "./mfsModel";

import { FakeUser } from "./demo";
import { IFluidHandle } from "@fluidframework/core-interfaces";
import { IUser } from ".";
import { SharedMap } from "@fluidframework/map";
import { v4 as uuidv4 } from 'uuid';

export const MfsAppId = "MfsAppId";

export type User = {
    id: string;
    name: string;
};

export type MfsAppItem = MfsItem & {
    user: User;  
    likes: number;  
};

export interface MfsAppDataModel  extends MfsDataModel<MfsAppItem> {
    addUser(): void;    
    getUser(): User | undefined;
    getUsers(): User[];    
    like: (itemId: string) => void;
    createAppItem: (url: string, label: string) => void;
}


export class MfsAppDataObject extends DataObject implements MfsAppDataModel {
    private itemsMap: SharedMap;
    private usersMap: SharedMap;
    
    //a fake userId for demo purposes
    private userId: string;

    // runs once - only on the first connected client.
    protected async initializingFirstTime() {
        // Create SharedMaps for the notes, votes, and users
        this.createSharedMap("items");                
        this.createSharedMap("users");        
    }
    
    protected async hasInitialized() {
        // Create local references to the SharedMaps.
        // Otherwise, they need to be called async which is inconvenient.
        this.itemsMap = await this.root.get<IFluidHandle<SharedMap>>("items").get();        
        this.usersMap = await this.root.get<IFluidHandle<SharedMap>>("users").get();

        // Add the current user to set of collaborators.
        this.addUser();

        // Set up event listeners to update the ui when data changes               
        this.createEventListeners(this.itemsMap);        
        this.createEventListeners(this.usersMap);
    }

     /**
     * Creates a shared map with the provided id. The id must be unique.
     */
    private createSharedMap(id: string): void {
        const map = SharedMap.create(this.runtime);
        this.root.set(id, map.handle);
    }

    private createEventListeners(sharedMap: SharedMap): void {
        // Set up an event listener for changes to values in the SharedMap
        sharedMap.on("valueChanged", () => {
            this.emit("change");
        });

        //Set up an event listener for clearing the data in a SharedMap
        sharedMap.on("clear", () => {
            this.emit("change");
        });

        const quorum = this.context.getQuorum();
        quorum.on("addMember", () => {
            this.emit("change");
        });

        quorum.on("removeMember", () => {
            this.emit("change");
        });
    }

    /**
     * Creates a "fake" user based on a fake user id and a fake name.
     * Only use this code for protoyping and demos.
     */
    public addUser = (): void => {
        // Check for a userId in SessionStorage - this prevents refresh from generating a new user
        if (sessionStorage.getItem('userId') &&
            this.usersMap.get<IUser>(sessionStorage.getItem('userId'))) {
            this.userId = sessionStorage.getItem('userId'); //This session might have has a user
        } else {
            const user: IUser = {
                id: FakeUser.getFakeUserId(),
                name: FakeUser.getFakeName()
            };
            this.userId = user.id;
            sessionStorage.setItem('userId', user.id);
            this.usersMap.set(user.id, user);
        }
    }
    
    public getUser = (): IUser => {
        return this.usersMap.get<IUser>(this.userId);
    }

    public getUsers(): IUser[] {
        const users: IUser[] = [];
        this.usersMap.forEach((i: IUser) => {
            users.push(i);
        });
        return users;
    }
    
    public like = (itemId: string) :void => {
        let mfsItem = this.getItem(itemId);
        mfsItem.likes = mfsItem.likes + 1;
    }
    
    public createAppItem = (url: string, label: string): void => {
        const appItem: MfsAppItem = {
            id: uuidv4(),            
            url,
            label,            
            user: this.getUser(),
            likes: 0            
        };
        this.createItem(appItem);
    }
    
    public createItem(item: MfsAppItem): void {
        this.itemsMap.set(item.id, item);
    }
    
    public getItem(itemId: string, query?: MfsQuery): MfsAppItem {
        return this.itemsMap.get<MfsAppItem>(itemId);
    }
    public deleteItem(itemId: string): void {
        this.itemsMap.delete(itemId);
    }
    
    public *getItems(query?: MfsQuery): IterableIterator<MfsAppItem | unknown> {
        if (query && (query.filter || query.select)) {            
            this.itemsMap.forEach((v, k) => this.filterAndSelect(v, query));
        } else {
            yield* this.itemsMap.values();
        }    
    }
    
    private *filterAndSelect(value: any, query: MfsQuery): IterableIterator<unknown>{
        if (!query.filter || query.filter(value)) {             
            if (query.select.some(p => !!p)) {                          
                yield query.select.reduce((o, k) => { o[k] = value[k]; return o; }, {});
            } else {
                yield value;    
            }
        }
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
