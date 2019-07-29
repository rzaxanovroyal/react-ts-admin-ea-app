import {ActionTypes} from './types';
import {Dispatch} from "redux";

export interface dataActions {
    type: ActionTypes.setEventCode | ActionTypes.setLanguage,
    payload: any
}

// Set Event code
export const setEventCode = (response: any) => (dispatch: Dispatch) => {
    dispatch({
        type: ActionTypes.setEventCode,
        payload: response
    })
};

// Set language
export const setLanguage = (response: any) => (dispatch: Dispatch) => {
    dispatch<dataActions>({
        type: ActionTypes.setLanguage,
        payload: response
    })
};