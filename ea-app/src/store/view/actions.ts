import {TOGGLE_DRAWER, CALL_METHOD} from './types';
import {Dispatch} from "redux";

export interface ViewActions {
    type: 'TOGGLE_DRAWER' | 'CALL_METHOD'
    payload: any;
}

// Open/close tags drawer
export const toggleDrawer = (drawerStatus: boolean, record: any) => (dispatch: Dispatch) => {
    dispatch<ViewActions>({
        type: TOGGLE_DRAWER,
        payload: {
            drawerStatus: drawerStatus,
            record: record
        }
    })
};
// Call chosen method
export const callMethod = (method: string) => (dispatch: Dispatch) => {
    dispatch<ViewActions>({
        type: CALL_METHOD,
        payload: method
    })
};