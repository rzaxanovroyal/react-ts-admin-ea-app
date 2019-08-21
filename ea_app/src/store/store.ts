import {createStore, combineReducers, applyMiddleware} from "redux";
import thunk from "redux-thunk";
import {composeWithDevTools} from "redux-devtools-extension";
import {dataReducer, DataState} from "./data/reducer";
import {viewReducer, ViewState} from "./view/reducer";

export interface RootState {
    data: DataState;
    view: ViewState;
}

const rootReducer = combineReducers({
    data: dataReducer,
    view: viewReducer
});

export const store = createStore(
    rootReducer,
    composeWithDevTools(
    applyMiddleware(thunk),
    // other store enhancers if any
));