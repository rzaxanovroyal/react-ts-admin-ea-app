import {ActionTypes} from './types';
import {Dispatch} from "redux";

export interface DataActions {
    type: ActionTypes.setEventCode | ActionTypes.setLanguage | ActionTypes.setAttendees,
    payload: any
}

// Set Event code
export const setEventCode = (response: any) => (dispatch: Dispatch) => {
    dispatch<DataActions>({
        type: ActionTypes.setEventCode,
        payload: response
    })
};

// Set language
export const setLanguage = (response: any) => (dispatch: Dispatch) => {
    dispatch<DataActions>({
        type: ActionTypes.setLanguage,
        payload: response
    })
};

// Set Attendees
export const setAttendees = (response: any) => (dispatch: Dispatch) => {
    dispatch<DataActions>({
        type: ActionTypes.setAttendees,
        payload: response
    })
};