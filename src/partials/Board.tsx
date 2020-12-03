/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { FC } from "react";

import { IUser } from "../fluid-object/interfaces";
import { MfsAppItem } from "..";
import { Note } from "./Note";

interface BoardProps {
  notes: MfsAppItem[];
  like: (itemId: string) => void;
  user: IUser;
  highlightMine: boolean;
}

export const Board: FC<BoardProps> = (props) => (
  <div className="board">
    {props.notes.map((note) => (
      <Note
        key={note.id}
        note={note}
        onClick={() => props.like(note.id)}
        count={note.numLikes}
        user={props.user}
        highlightMine={props.highlightMine}
      />
    ))}
  </div>
);
