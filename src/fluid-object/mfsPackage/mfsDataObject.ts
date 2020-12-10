import { ItemMap, MfsDataModel, MfsItem } from "./mfsModel";

import { DataObject } from "@fluidframework/aqueduct";
import { IFluidHandle } from "@fluidframework/core-interfaces";
import { MfsQuery } from "..";
import { Serializable } from "./serializable";
import { SharedMap } from "@fluidframework/map";
import { v4 as uuidv4 } from 'uuid';

export abstract class MfsDataObject extends DataObject implements MfsDataModel<MfsItem> {
    private items: SharedMap;           
    
    createItem = (item: Omit<MfsItem, 'id'>): Promise<string> => this.createItemInternal(item, uuidv4());
    
    async getItem(itemId: string): Promise<MfsItem> {        
        const itemMap = await this.getItemMap(itemId);
        return this.toItem(itemMap);            
    }
    
    async deleteItem(itemId: string): Promise<void> {                       
        const map = await this.getItemMap(itemId);
        map.removeAllListeners();        
        this.items.delete(itemId);        
    }
    
    // update only provided properties, keep the rest intact
    async patchItem(itemId: string, item: Partial<Omit<MfsItem, 'id'>>): Promise<void> {
        const itemMap = await this.getItemMap(itemId);
        
        for(const propertyKey in item) {
            const value = item[propertyKey];
            
            if (value === undefined || value === null) {
                // remove null & undefined values
                itemMap.delete(propertyKey);
            } else {
                // set defined values (allowing nulls)                
                itemMap.set(propertyKey, value);                                 
            }           
        }            
    }
    
    // replace the whole item
    async putItem(itemId: string, item: Omit<MfsItem, 'id'>): Promise<void> {                
        return this.createItemInternal(item, itemId).then((_) => {});
    }
    
    async setItemProperty(itemId: string, propertyKey: string, propertyValue: Serializable): Promise<void> {
        // should preserve the type of the property.
        if (propertyKey === 'id')  {
            throw new Error('System property id cannot be set');
        }
        const itemMap = await this.getItemMap(itemId);
        itemMap.set(propertyKey, propertyValue);
    }  
    
    async getItemProperty(itemId: string, propertyKey: string): Promise<Serializable | undefined> {
        const itemMap = await this.getItemMap(itemId);
        return itemMap.get(propertyKey);
    }    
    
    async *getItems(query?: MfsQuery): AsyncIterableIterator <Partial<MfsItem>> {   
        
        for(const [_, itemMapHandle] of this.items) {
            const itemMap = await (itemMapHandle as  IFluidHandle<SharedMap>).get();
            
            if (!query?.filter || query.filter(itemMap)) {
                yield this.toItem(itemMap, query?.select);    
            }            
        }
    }
    
    protected async initializingFirstTime() {       
        this.createSharedMap("items");                
        this.createSharedMap("users");          
    }
    
    protected async hasInitialized() {
        this.items = await this.root.get<IFluidHandle<SharedMap>>("items").get();        
        this.createEventListeners(this.items);   
        
        // if (!this.isFirstTimeInitialized) {
        //     //TODO: pass the keys of the items to load.                     
        //     const loadedItemMaps = await this.lazyLoadItems(this.items);
        //     loadedItemMaps.forEach((v, k) => this.itemReferences.set(v.get('id'), v));        
        //     console.log('Loaded ITEM REFS:', this.itemReferences);                
        // }
        
        const quorum = this.context.getQuorum();
        quorum.on("addMember", () => {
            this.emit("change");
        });

        quorum.on("removeMember", () => {
            this.emit("change");
        });     
    }

    protected async lazyLoadItems(items: SharedMap, _itemKeys?:string[]) : Promise<SharedMap[]> {
        const loadItemTasks: Promise<SharedMap>[] = [];
        
        for(const key of items.keys()) {            
            const loadItemMap = items.get<IFluidHandle<SharedMap>>(key).get();
            loadItemTasks.push(loadItemMap);                            
        }

        return Promise.all(loadItemTasks);
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
        sharedMap.on("valueChanged", (...args) => {
            console.log("on valueChanged", args);
            this.emit("change");
        });

        //Set up an event listener for clearing the data in a SharedMap
        sharedMap.on("clear", () => {
            console.log("on clear");
            this.emit("change");
        });
    }
    
    private async createItemInternal(item: Omit<MfsItem, 'id'>, id: string): Promise<string> {
        console.log('BEGIN_createItem');
        const itemMap = SharedMap.create(this.runtime);
        
        for(const propertyKey in item) {
            const value = item[propertyKey];
            
            if (value !== undefined) {
                // skip adding undefined values
                itemMap.set(propertyKey, value);                 
            }
        }

        //this.createEventListeners(itemMap);             
        itemMap.set('id', id);
        this.items.set(id, itemMap.handle); 
        console.log('END_createItem: itemMap initialized id:', id);
        return id;
    }

    private async getItemMap(itemId: string): Promise<SharedMap> {
        const itemMap = await this.items.get(itemId)?.get();
        
        if (!itemMap) {
            throw new Error(`Item with ${itemId} does not exist`);
        }
        
        return itemMap;
    }

    protected toItem(itemMap: ItemMap, selectedKeys? : string[]) : MfsItem {        
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