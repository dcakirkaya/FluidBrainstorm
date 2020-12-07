
type JsonSerializablePrimitive = undefined | null | number| boolean | string;
type JsonSerializableObject<T> = {[key: string]: JsonSerializable<T>};
type JsonSerializableArray<T> = JsonSerializable<T>[];
type JsonSerializable<T = JsonSerializablePrimitive> = T | JsonSerializableArray<T> | JsonSerializableObject<T>;
export type Serializable = JsonSerializable<JsonSerializablePrimitive>;
