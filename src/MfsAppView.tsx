/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import "./styles.scss";

import { MfsAppDataModel, MfsAppItem } from "./fluid-object";
import React, { FC, useEffect, useState } from "react";

import { Board } from "./partials/Board";
import {
  IUser,
} from "./fluid-object/interfaces";
import { Pad } from "./partials/Pad";

// eslint-disable-next-line import/no-unassigned-import


// MfsAppView
interface MfsAppViewProps {
  readonly model: MfsAppDataModel;
}

interface MfsAppViewState {
  user: IUser;
  users: IUser[];
  notes: MfsAppItem[];
}

export const MfsAppView: FC<MfsAppViewProps> = (props) => {
  const generateState = () => {
    const theNotes = [...props.model.getItemsFromBoard()];
    console.log('View: items', theNotes);
    return {
      user: props.model.getUser(),
      users: props.model.getUsers(),
      notes: theNotes,
    };
  };
  const [state, setState] = useState<MfsAppViewState>(generateState());
  const [highlightMine, setHighlightMine] = useState<boolean>();


  useEffect(() => {
    const onChange = () => {
      console.log("View Change: Setting state");
      setState(generateState());
    }
    props.model.on("change", onChange);

    // useEffect runs only after the first render for this example - so we will update the view again in case there
    // were changes that came into the model in between generating initialState and setting
    // the above event handler
    onChange();    
    return () => {
      // When the view dismounts remove the listener to avoid memory leaks
      props.model.off("change", onChange);
    };
  }, []);

  return (
    <div>
      <Pad
        createNote={props.model.createAppItem}
        demo={props.model.createDemoItem}
        user={state.user}
        users={state.users}
        clear={() => alert("clear not implemented")}
        setHighlightMine={setHighlightMine}
        highlightMine={highlightMine}
      />
      <Board
        notes={state.notes}
        like={props.model.like}
        user={state.user}
        highlightMine={highlightMine}
      />
    </div>
  );
};
