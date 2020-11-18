/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MfsItem, User } from "../model/types";
import React, { ChangeEvent, FC, useState } from "react";

import { Button } from "./Button";
import { ItemEditor } from "./ItemEditor";
import { UserName } from "./UserName";

// Pad
interface PadProps {
  createItem: (text: string) => MfsItem;
  demo: () => string;
  user: User;
  users: User[];
  clear: () => void;
  setHighlightMine: (value: boolean) => void;
  highlightMine: boolean;
}

export const Pad: FC<PadProps> = (props) => {
  const [value, setValue] = useState<string>("");

  const createItem = () => {
    props.createItem(value);
    setValue("");
  };
  
  const onNoteValueChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  const onNoteFocus = () => {
    if (!value.length) {
      setValue(props.demo());
    }
  };

  return (
    <div className="container">
      <div className="pad">
        <ItemEditor
          onFocus={onNoteFocus}
          value={value}
          onChange={onNoteValueChange}
          onEnter={createItem}
        />
        <Button onClick={createItem}> Share my idea </Button>        
        {/* <Button onClick={props.clear}> Tidy up </Button> */}
        <UserName user={props.user} userCount={props.users.length} />
      </div>
    </div>
  );
};
