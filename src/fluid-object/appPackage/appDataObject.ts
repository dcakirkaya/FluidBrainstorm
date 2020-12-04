/** MFS APP PACKAGE*/

import { AutoNote, FakeUser } from "../demo";
import { IUser, MfsAppItem } from "..";

import { DataObjectFactory } from "@fluidframework/aqueduct";
import { IFluidHandle } from "@fluidframework/core-interfaces";
import { MfsDataObject } from "../mfsPackage/mfsDataObject";
import { SharedMap } from "@fluidframework/map";
import { v4 as uuidv4 } from 'uuid';

export class MfsAppDataObject extends MfsDataObject {    
    // define app specific DDSes 
    private usersMap: SharedMap;
    
    private userId: string;
    
    protected async initializingFirstTime() {       
        console.log("app data object initializing");
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
        mfsItem.numLikes = mfsItem.numLikes + 1;
    }
    
    public createAppItem = (url: string, label: string): void => {
        const appItem: MfsAppItem = {
            id: uuidv4(),            
            url,
            label,            
            user: this.getUser(),
            numLikes: 0            
        };
        this.createItem(appItem);
    }
    
    public getItemsFromBoard =  (): IterableIterator<MfsAppItem> => {
        return this.getItems() as IterableIterator<MfsAppItem>;
    }
    
    public createDemoItem = (): string => {
        return AutoNote.createDemoNote()
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
