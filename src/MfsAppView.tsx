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
}

export const MfsAppView: FC<MfsAppViewProps> = (props) => {
  const generateState = () => {        
    return {
      user: props.model.getUser(),
      users: props.model.getUsers(),     
    };
  };

  const [state, setState] = useState<MfsAppViewState>({ user: props.model.getUser(), users: props.model.getUsers()});

  const readItems = async (filter?:string) => {        
    const items = [];

    for await (const v of props.model.getItemsFromBoard(filter)) {
      items.push(v);
    }
    
    return items;
  };
  
  const [items, setItems] = useState<MfsAppItem[]>([]);
  const [highlightMine, setHighlightMine] = useState<boolean>();


  useEffect(() => {
    const onChange = () => {
      setState(generateState());
      readItems().then(s=> {        
        setItems(s)
      });
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
        filterItems ={async (text) => {
          readItems(text).then((s) => setItems(s));
        }}
        demo={props.model.createDemoItem}
        user={state.user}
        users={state.users}
        clear={props.model.clear}
        setHighlightMine={setHighlightMine}
        highlightMine={highlightMine}
      />
      <Board
        notes={items}
        like={props.model.like}
        user={state.user}
        highlightMine={highlightMine}
      />
    </div>
  );
};
