"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { createReducer, initialState } from "./create-reducer";
import { saveState, loadState, clearState } from "./create-persistence";
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

function getInitialState(): CreateFlowState {
  if (typeof window === "undefined") return initialState;
  return loadState() ?? initialState;
}

export function CreateFlowProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(
    createReducer,
    undefined,
    getInitialState,
  );

  const dispatch = useCallback((action: CreateAction) => {
    rawDispatch(action);
    if (action.type === "RESET") clearState();
  }, []);

  // Persist after every state change
  useEffect(() => {
    saveState(state);
  }, [state]);

  return (
    <CreateFlowContext.Provider value={{ state, dispatch }}>
      {children}
    </CreateFlowContext.Provider>
  );
}
