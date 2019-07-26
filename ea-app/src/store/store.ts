import {createStore, combineReducers, applyMiddleware} from "redux";
import thunkMiddleware from "redux-thunk";
import {composeWithDevTools} from "redux-devtools-extension";
import { RouterState, connectRouter, routerMiddleware } from 'connected-react-router';
import { createBrowserHistory } from 'history';
import { History } from 'history';

import {dataReducer} from "./data/reducer";

export const history = createBrowserHistory();

const rootReducer = (history: History) => combineReducers({
    router: connectRouter(history),
    data: dataReducer,
});

export interface RootState {
    router: RouterState,
    data: any
}

export default function configureStore() {
    const middlewares = [thunkMiddleware, routerMiddleware(history)];
    const middleWareEnhancer = applyMiddleware(...middlewares);

    const store = createStore(
        rootReducer(history),
        composeWithDevTools(middleWareEnhancer)
    );

    return store;
}