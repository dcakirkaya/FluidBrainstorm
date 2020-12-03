/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Note that the model primarily uses interfaces, not classes.
 * When objects are stored in Fluid DDSs,
 * they are serialized and deserialized over the wire.
 * Using interfaces avoids any issues with calling functions 
 * that are no longer present on an object. 
 */
   
export interface INote {
    id: string;
    text: string;
    user: IUser;
}

export interface INoteWithVotes extends INote {
    currentUserVoted: boolean;
    votes: number;
}

export interface IUser {
    id: string;
    name: string;
}

export interface IBallot {
    id: string,
    noteId: string,
    user: IUser
}