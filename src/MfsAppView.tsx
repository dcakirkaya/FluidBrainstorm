/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import "./styles.scss";

import {
  IMfsAppDataModel,
  INoteWithVotes,
  IUser,
} from "./fluid-object/interfaces";
import React, { FC, useEffect, useState } from "react";

import { Board } from "./partials/Board";
import { Pad } from "./partials/Pad";

// eslint-disable-next-line import/no-unassigned-import


// MfsAppView
interface MfsAppViewProps {
  readonly model: IMfsAppDataModel;
}

interface MfsAppViewState {
  user: IUser;
  users: IUser[];
  notes: INoteWithVotes[];
}

export const MfsAppView: FC<MfsAppViewProps> = (props) => {
  const generateState = () => {
    return {
      user: props.model.getUser(),
      users: props.model.getUsers(),
      notes: props.model.getNotesFromBoard(),
    };
  };
  const [state, setState] = useState<MfsAppViewState>(generateState());
  const [highlightMine, setHighlightMine] = useState<boolean>();

  // Setup a listener that
  useEffect(() => {
    const onChange = () => setState(generateState());
    props.model.on("change", onChange);

    // useEffect runs after the first render so we will update the view again incase there
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
        createNote={props.model.createNote}
        demo={props.model.createDemoNote}
        user={state.user}
        users={state.users}
        clear={() => alert("clear not implemented")}
        setHighlightMine={setHighlightMine}
        highlightMine={highlightMine}
      />
      <Board
        notes={state.notes}
        vote={props.model.vote}
        user={state.user}
        highlightMine={highlightMine}
      />
    </div>
  );
};
