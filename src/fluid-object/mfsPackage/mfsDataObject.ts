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
    private isFirstTimeInitialized: boolean;
    
    createItem = (item: Omit<MfsItem, 'id'>): string => this.createItemInternal(item, uuidv4());
    
    getItem(itemId: string): MfsItem {        
        const itemMap = this.itemReferences.get(itemId);
        return this.toItem(itemMap);            
    }
    
    deleteItem(itemId: string): void {                       
        const map = this.itemReferences.get(itemId);
        map.removeAllListeners();
        this.itemReferences.delete(itemId); 
        this.items.delete(itemId);        
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
        console.log('mfsDataObject - getItems', this.itemReferences);     
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
        this.isFirstTimeInitialized = true;      
    }
    
    protected async hasInitialized() {
        this.items = await this.root.get<IFluidHandle<SharedMap>>("items").get();        
        this.createEventListeners(this.items);   
        
        if (!this.isFirstTimeInitialized) {
            //TODO: pass the keys of the items to load.                     
            const loadedItemMaps = await this.lazyLoadItems(this.items);
            loadedItemMaps.forEach((v, k) => this.itemReferences.set(v.get('id'), v));        
            console.log('Loaded ITEM REFS:', this.itemReferences);                
        }
        
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
    
    private createItemInternal(item: Omit<MfsItem, 'id'>, id: string): string {
        console.log('BEGIN_createItem');
        const itemMap = SharedMap.create(this.runtime);
                 
        console.log('isAttached', itemMap.isAttached()); // False  
        
        for(const propertyKey in item) {
            const value = item[propertyKey];
            
            if (value !== undefined) {
                // skip adding undefined values
                itemMap.set(propertyKey, value);                 
            }
        }

        //this.createEventListeners(itemMap);             
        itemMap.set('id', id);
        
        console.log('isAttached', itemMap.isAttached());    // True-- 

        this.itemReferences.set(id, itemMap); 
        this.items.set(id, itemMap.handle); 
        console.log('END_createItem: itemMap initialized id:', id);
        return id;
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