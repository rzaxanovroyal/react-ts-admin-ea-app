import {ViewActionTypes} from './types';
import {Dispatch} from "redux";
import {Attendee} from '../../components/attendee/attendee-component';

export interface ViewActions {
    type: ViewActionTypes.TOGGLE_DRAWER | ViewActionTypes.CALL_METHOD
    payload: any;
}

// Open/close tags drawer
export const toggleDrawer = (drawerStatus: boolean, record: Attendee) => (dispatch: Dispatch) => {
    dispatch<ViewActions>({
        type: ViewActionTypes.TOGGLE_DRAWER,
        payload: {
            drawerStatus: drawerStatus,
            record: record
        }
    })
};
// Call chosen method
export const callMethod = (method: string) => (dispatch: Dispatch) => {
    dispatch<ViewActions>({
        type: ViewActionTypes.CALL_METHOD,
        payload: method
    })
};