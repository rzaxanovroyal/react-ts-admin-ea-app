import {SET_LANGUAGE, SET_EVENT_CODE, SET_ATTENDEES, SET_EVENT_TAGS, SET_XCSRF_TOKEN} from './types';
import {Dispatch} from "redux";

export interface DataActions {
    type: 'SET_LANGUAGE' | 'SET_EVENT_CODE' | 'SET_ATTENDEES' | 'SET_EVENT_TAGS' | 'SET_XCSRF_TOKEN';
    payload: any;
}

// Set Event code
export const setEventCode = (response: any) => (dispatch: Dispatch) => {
    dispatch<DataActions>({
        type: SET_EVENT_CODE,
        payload: response
    })
};

// Set language
export const setLanguage = (response: any) => (dispatch: Dispatch) => {
    dispatch<DataActions>({
        type: SET_LANGUAGE,
        payload: response
    })
};

// Set Attendees
export const setAttendees = (response: any) => (dispatch: Dispatch) => {
    dispatch<DataActions>({
        type: SET_ATTENDEES,
        payload: response
    })
};
// Set Attendees
export const setEventTags = (response: any) => (dispatch: Dispatch) => {
    dispatch<DataActions>({
        type: SET_EVENT_TAGS,
        payload: response
    })
};
// Set setXCSRFtoken
export const setXCSRFtoken = (response: any) => (dispatch: Dispatch) => {
    dispatch<DataActions>({
        type: SET_XCSRF_TOKEN,
        payload: response
    })
};