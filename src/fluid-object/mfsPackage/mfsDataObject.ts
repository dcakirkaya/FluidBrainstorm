import { MfsDataModel, MfsItem } from "./mfsModel";

import { DataObject } from "@fluidframework/aqueduct";
import { IFluidHandle } from "@fluidframework/core-interfaces";
import { MfsQuery } from "..";
import { Serializable } from "./serializable";
import { SharedMap } from "@fluidframework/map";
import { v4 as uuidv4 } from 'uuid';

export abstract class MfsDataObject extends DataObject implements MfsDataModel<MfsItem> {
    private items: SharedMap;   
    private itemReferences: Map<string, SharedMap> = new Map();
    
    createItem = (item: Omit<MfsItem, 'id'>): Promise<string> => this.createItemInternal(item, uuidv4());
    
    getItem(itemId: string): MfsItem {        
        const itemMap = this.itemReferences.get(itemId);
        return this.toItem(itemMap);            
    }
    
    deleteItem(itemId: string): void {               
        this.items.delete(itemId);
        this.itemReferences.delete(itemId); 
    }
    
    // update only provided properties, keep the rest intact
    patchItem(itemId: string, item: Partial<Omit<MfsItem, 'id'>>): void {
        const itemMap = this.itemReferences.get(itemId);
        
        for(const propertyKey in item) {
            itemMap[propertyKey] = item[propertyKey];             
        }            
    }
    
    // replace the whole item
    putItem(itemId: string, item: Omit<MfsItem, 'id'>): void {        
        this.itemReferences.delete(itemId);
        this.createItemInternal(item, itemId);
    }
    
    setItemProperty(itemId: string, propertyKey: string, propertyValue: Serializable): void {
        // should preserve the type of the property.
        if (propertyKey === 'id')  {
            throw new Error("id property cannot be set");
        }
        
        const itemMap = this.getItemMap(itemId);        
        itemMap.set(propertyKey, propertyValue);
    }  
    
    getItemProperty(itemId: string, propertyKey: string): Serializable | undefined {
        return this.getItemMap(itemId).get(propertyKey);
    }    
    
    *getItems(query?: MfsQuery<MfsItem>): IterableIterator<Partial<MfsItem>> {        
        for(const [_, itemMap] of this.itemReferences) {
            // if (!query) {
            //     if (!query.filter || query.filter())   
            // }
            // else {
                yield this.toItem(itemMap, query?.select);    
            // }
            
        }
    }
    
    protected async initializingFirstTime() {       
        this.createSharedMap("items");                
        this.createSharedMap("users");        
    }
    
    protected async hasInitialized() {
        this.items = await this.root.get<IFluidHandle<SharedMap>>("items").get();        
        this.createEventListeners(this.items);        
    }

     /**
     * Creates a shared map with the provided id. The id must be unique.
     */
    protected createSharedMap(id: string): void {
        const map = SharedMap.create(this.runtime);
        this.root.set(id, map.handle);        
    }

    protected createEventListeners(sharedMap: SharedMap): void {
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
    
    private async createItemInternal(item: Omit<MfsItem, 'id'>, id: string): Promise<string> {
        const itemMap = SharedMap.create(this.runtime);
        this.items.set(id, itemMap.handle);
               
        itemMap.set('id', id);
        
        for(const propertyKey in item) {
            const value = item[propertyKey];
            
            if (value !== undefined) {
                // skip adding undefined values
                itemMap.set(propertyKey, value);                 
            }
        }
        
        console.log('isAttached', itemMap.isAttached());
        this.itemReferences.set(id, itemMap); 
        this.root.get<IFluidHandle<SharedMap>>("items").get().then(() => {
            this.createEventListeners(itemMap);
            console.log('event listeners created');
        });        

        console.log('itemMap initialized id:', id);
        return Promise.resolve(id);
    }

    private getItemMap(itemId: string): SharedMap {
        const itemMap = this.itemReferences.get(itemId);
        
        if (!itemMap) {
            throw new Error(`Item with ${itemId} does not exist`);
        }
        
        return itemMap;
    }

    protected toItem(itemMap: Map<string, Serializable>, selectedKeys? : string[]) : MfsItem {        
        const mfsItem: Partial<MfsItem> = {};
        
        for(const [key, value] of itemMap) {
            if (!selectedKeys || selectedKeys.includes(key)) {
                mfsItem[key] = value;     
            }             
        }

        if (!this.isMfsItem(mfsItem)) {
            // id is the only required property.
            throw new Error(`data corruption - id property not found on item ${mfsItem}`);
            // delete the corrupted data.            
        }
        
        return mfsItem;
    }

    protected isMfsItem = (item: Partial<MfsItem>): item is MfsItem => !!item.id;
}