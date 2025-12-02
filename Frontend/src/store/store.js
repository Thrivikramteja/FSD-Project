import { configureStore } from "@reduxjs/toolkit";
import entitiesReducer from "./entitiesSlice";

export const store = configureStore({
  reducer: {
    entities: entitiesReducer
  }
});
