/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    DataObject,
    DataObjectFactory,
} from "@fluidframework/aqueduct";
import { MfsAppDataModel, MfsAppItem, MfsItem, MfsItemExtension, MfsQuery, User } from "./types";

import { FakeUser } from "./demo";
import { IFluidHandle } from "@fluidframework/core-interfaces";
import { SharedMap } from "@fluidframework/map";
import uuid from "uuid";

const MfsAppConfig = {
    ItemsMap: "items",
    ItemExtensionsMap: "itemExtensions",
    UsersMap: "users"
};

export class MfsApp extends DataObject implements MfsAppDataModel {   
   
    // Local references to the SharedMaps used in this component
    private items: SharedMap;    
    private itemExtensions: SharedMap;
    private users: SharedMap;
    
    // stores a fake userId as we aren't using true auth for this demo
    private userId: string;

    /**
     * initializingFirstTime is called only once,
     * it is executed only by the first client to open the
     * component and all work will resolve before the view
     * is presented to any user.
     *
     * This method is used to perform component setup,
     * which can include setting an initial schema or initial values.
     */
    protected async initializingFirstTime() {
        // Create SharedMaps for the notes, votes, and users
        this.createSharedMap(MfsAppConfig.ItemsMap);        
        this.createSharedMap(MfsAppConfig.ItemExtensionsMap);
        this.createSharedMap(MfsAppConfig.UsersMap);
    }

    /**
     * Creates a shared map with the provided id. The id must be unique.
     */
    private createSharedMap(id: string): void {
        const map = SharedMap.create(this.runtime);
        this.root.set(id, map.handle);
    }

    /**
    * hasInitialized is called every time a client joins a session.
    * Performs tasks required for each client like initializing event listeners.
    */
    protected async hasInitialized() {
        // Create local references to the SharedMaps.
        // Otherwise, they need to be called async which is inconvenient.
        this.items = await this.root.get<IFluidHandle<SharedMap>>(MfsAppConfig.ItemsMap).get();
        this.itemExtensions = await this.root.get<IFluidHandle<SharedMap>>(MfsAppConfig.ItemExtensionsMap).get();
        this.users = await this.root.get<IFluidHandle<SharedMap>>(MfsAppConfig.UsersMap).get();

        // Add the current user to set of collaborators.
        this.addUser();

        // Set up event listeners to update the ui when data changes               
        this.createEventListeners(this.items);
        this.createEventListeners(this.itemExtensions);
        this.createEventListeners(this.users);

        // quorum
        const quorum = this.context.getQuorum();        
        quorum.on("addMember", () => {
            this.emit("change");
        });
        quorum.on("removeMember", () => {
            this.emit("change");
        });
    }
    
    /**
     * Helper function to set up event listeners for shared objects
     */
    private createEventListeners(sharedMap: SharedMap): void {
        sharedMap.on("valueChanged", () => {
            this.emit("change");
        });

        // Set up an event listener for changes to values in the SharedMap
        sharedMap.on("valueChanged", () => {
            this.emit("change");
        });

        //Set up an event listener for clearing the data in a SharedMap
        sharedMap.on("clear", () => {
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
            this.users.get<User>(sessionStorage.getItem('userId'))) {
            this.userId = sessionStorage.getItem('userId'); //This session might have has a user
        } else {
            const user: User = {
                id: FakeUser.getFakeUserId(),
                name: FakeUser.getFakeName()
            };
            this.userId = user.id;
            sessionStorage.setItem('userId', user.id);
            this.users.set(user.id, user);
        }
    }

    /**
     * Get the User literal object for the current user.
     */
    public getUser = (): User => {
        return this.users.get<User>(this.userId);
    }

    /**
     * Get an array of all User literal objects for users
     * who have joined the session (even if they have left). 
     */
    public getUsers(): User[] {
        const users: User[] = [];
        this.users.forEach((i: User) => {
            users.push(i);
        });
        return users;
    }
    
    public putItem(item: MfsAppItem): void {
        const {  id, url, label, isParked, ...extension } = item;
        this.items.set(item.id, {id, url, label, isParked});
        this.itemExtensions.set(item.id, extension);
    }
    
    public getItem(itemId: string, query?: MfsQuery): MfsAppItem {
        // TODO: query !
        return {
            ...this.items.get<MfsItem>(itemId), 
            ...this.itemExtensions.get<MfsItemExtension>(itemId)};
    }
    
    public deleteItem(itemId: string): void {        
        this.items.delete(itemId);
        this.itemExtensions.delete(itemId);        
    }
    
    public *getItems(query?: MfsQuery): IterableIterator<MfsAppItem | unknown> {        
        if (query && (query.filter || query.select)) {            
            this.items.forEach((v, k) => this.filterAndSelect(v, k, query));
        } else {
            yield* this.items.values();
        }        
    }

    private *filterAndSelect(value: any, key: any, query: MfsQuery): IterableIterator<unknown>{
        if (!query.filter || query.filter(value)) { 
            // TODO: implement select correctly  -- go to the right container and choose the selected props.
            if (query.select.some(p => !!p)) {
                yield {value,...this.itemExtensions.get<MfsItemExtension>(key)};
            } else {
                yield value;    
            }
        }
    }
    
    public like (itemId: string): void {
        if(this.items.has(itemId)) {
            const { user, likes} : MfsItemExtension = this.itemExtensions.get(itemId);
            this.itemExtensions.set(itemId, {...user, likes:likes+1});
        }
    }
    
    public createAppItem(url: string, label?: string): void {
        this.putItem({
            id: uuid(),
            url: url,
            label: label ?? url,
            user: this.getUser(),
            likes: 0            
        });        
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
export const MfsAppInstantiationFactory = new DataObjectFactory(
    "MfsApp",
    MfsApp,
    [
        SharedMap.getFactory(),
    ],
    {},
);
