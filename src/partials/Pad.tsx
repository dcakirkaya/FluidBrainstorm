/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { ChangeEvent, FC, useState } from "react";

import { Button } from "./Button";
import { IUser } from "../fluid-object/interfaces";
import { NoteEditor } from "./NoteEditor";
import { UserName } from "./UserName";

// Pad
interface PadProps {
  demo: () => string;
  createNote: (text: string) => Promise<string>;
  user: IUser;
  users: IUser[];
  clear: () => void;
  setHighlightMine: (value: boolean) => void;
  highlightMine: boolean;
}

export const Pad: FC<PadProps> = (props) => {
  const [value, setValue] = useState<string>("");

  const createNote = async () => {
    props.createNote(value);
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
        <NoteEditor
          onFocus={onNoteFocus}
          value={value}
          onChange={onNoteValueChange}
          onEnter={createNote}
        />
        <Button onClick={createNote}> Create Mfs Item </Button>
        {/* <Button onClick={handleHighlight}>
          {props.highlightMine ? "Stop highlighting" : "Highlight my ideas"}
        </Button> */}
        {/* <Button onClick={props.clear}> Tidy up </Button> */}
        <UserName user={props.user} userCount={props.users.length} />
      </div>
    </div>
  );
};
