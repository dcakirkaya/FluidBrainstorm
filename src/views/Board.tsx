/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { FC } from "react";

import { Item } from "./Item";
import { MfsAppItem } from "../model/types";
import { User } from "../model";

interface BoardProps {
  items: MfsAppItem[];
  like: (item: MfsAppItem) => void;
  user: User;
  highlightMine: boolean;
}

export const Board: FC<BoardProps> = (props) => (
  <div className="board">
    {props.items.map((item) => (
      <Item
        key={item.id}
        item={item}
        onClick={() => props.like(item)}
        count={item.likes}
        user={props.user}
        highlightMine={props.highlightMine}       
      />
    ))}
  </div>
);
