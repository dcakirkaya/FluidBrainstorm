/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MfsAppItem, User } from "../model/types";
import React, { FC } from "react";

interface ItemProps extends React.AllHTMLAttributes<HTMLButtonElement> {
  count: number;
  item: MfsAppItem;  
  user: User;
  highlightMine: boolean;
}

export const Item: FC<ItemProps> = (props) => (
  <button
    className={
      props.item.user.id != props.user.id && props.highlightMine
        ? "note others"
        : "note"
    }
    onClick={props.onClick}
  >
    {props.count > 0 && (
      <span className="note-badge" >
        {props.count}
      </span>
    )}
    <span className="note-text">{props.item.label}</span>
    <span className="note-text">{props.item.url}</span>
  </button>
);
