import { MfsAppItem, MfsQuery } from "..";
import { MfsDataModel, MfsItem } from "./mfsModel";

import { DataObject } from "@fluidframework/aqueduct";
import { IFluidHandle } from "@fluidframework/core-interfaces";
import { SharedMap } from "@fluidframework/map";

export abstract class MfsDataObject extends DataObject implements MfsDataModel<MfsItem> {    

    private itemsMap: SharedMap;    
    
    protected async initializingFirstTime() {
        console.log("BASE data object initializing");
        this.createSharedMap("items");                
        this.createSharedMap("users");        
    }
    
    protected async hasInitialized() {
        this.itemsMap = await this.root.get<IFluidHandle<SharedMap>>("items").get();        
        this.createEventListeners(this.itemsMap);        
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

    public createItem(item: MfsAppItem): void {
        this.itemsMap.set(item.id, item);
    }
    
    public getItem(itemId: string): MfsAppItem {
        return this.itemsMap.get<MfsAppItem>(itemId);
    }
    public deleteItem(itemId: string): void {
        this.itemsMap.delete(itemId);
    }
    
    public *getItems(query?: MfsQuery<MfsAppItem>): IterableIterator<MfsAppItem | unknown> {
        if (query && (query.filter || query.select)) {            
            this.itemsMap.forEach((v, _) => this.filterAndSelect(v, query));
        } else {
            yield* this.itemsMap.values();
        }    
    }

    protected *filterAndSelect(value: any, query: MfsQuery<MfsAppItem>): IterableIterator<unknown>{
        if (!query.filter || query.filter(value)) {             
            if (query.select?.some(p => !!p)) {                          
                yield query.select.reduce((o, k) => { o[k] = value[k]; return o; }, {});
            } else {
                yield value;    
            }
        }
    } 
}