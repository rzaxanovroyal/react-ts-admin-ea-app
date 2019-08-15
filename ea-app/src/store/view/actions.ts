import {ViewActionTypes} from './types';
import {Dispatch} from "redux";

export interface ViewActions {
    type: ViewActionTypes.toggleDrawer;
    payload: any;
}

// Open/close tags drawer
export const toggleDrawer = (drawerStatus: boolean, record: any ) => (dispatch: Dispatch) => {
    dispatch< ViewActions>({
        type: ViewActionTypes.toggleDrawer,
        payload: {
            drawerStatus: drawerStatus,
            record: record
        }
    })
};