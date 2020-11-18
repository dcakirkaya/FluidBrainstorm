/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import "./styles.scss";

import { MfsAppDataModel, MfsAppItem, User } from "./model/types";
import React, { FC, useEffect, useState } from "react";

import { Board } from "./views/Board";
import { Pad } from "./views/Pad";

// eslint-disable-next-line import/no-unassigned-import


// MfsAppView
interface MfsAppViewProps {
  readonly model: MfsAppDataModel;  
}

interface MfsAppViewState {
  user: User;
  users: User[];
  items: MfsAppItem[];
}

export const MfsAppView: FC<MfsAppViewProps> = (props) => {
  const generateState = () => {
    return {
      user: props.model.getUser(),
      users: props.model.getUsers(),
      items: [...props.model.getItems<MfsAppItem>()],
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
        createItem={props.model.createDemoItem}        
        user={state.user}
        users={state.users}
        clear={() => alert("clear not implemented")}
        setHighlightMine={setHighlightMine}
        highlightMine={highlightMine}
      />
      <Board
        items={state.items}
        like={props.model.like}
        user={state.user}
        highlightMine={highlightMine}
      />
    </div>
  );
};
