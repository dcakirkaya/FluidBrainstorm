
type MfsCommonRelationshipType = 'contains'; 

export type MfsRelationshipType<R> = R extends MfsCommonRelationshipType ? MfsCommonRelationshipType : R extends string ? R : never;

export type MfsRelationship<R = MfsCommonRelationshipType> = {    
    inId: string;
    outId: string;    
    type: MfsRelationshipType<R>;    
}
