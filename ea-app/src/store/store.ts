import {createStore, combineReducers, applyMiddleware} from "redux";
import thunk from "redux-thunk";
import {composeWithDevTools} from "redux-devtools-extension";
import {dataReducer, DataState} from "./data/reducer";

export interface RootState {
    data: DataState
}

const rootReducer = combineReducers({
    data: dataReducer,
});

export const store = createStore(
    rootReducer,
    composeWithDevTools(
    applyMiddleware(thunk),
    // other store enhancers if any
));