"use client";

import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { createReducer, initialState } from "./create-reducer";
import type { CreateFlowState, CreateAction } from "./create-types";

interface CreateFlowContextValue {
  state: CreateFlowState;
  dispatch: Dispatch<CreateAction>;
}

const CreateFlowContext = createContext<CreateFlowContextValue | null>(null);

export function useCreateFlow(): CreateFlowContextValue {
  const ctx = useContext(CreateFlowContext);
  if (!ctx)
    throw new Error("useCreateFlow must be used within CreateFlowProvider");
  return ctx;
}

export function CreateFlowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(createReducer, initialState);

  return (
    <CreateFlowContext.Provider value={{ state, dispatch }}>
      {children}
    </CreateFlowContext.Provider>
  );
}
