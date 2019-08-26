import {DataActionTypes} from './types';
import {Dispatch} from "redux";

export interface DataActions {
    type: DataActionTypes.SET_LANGUAGE | DataActionTypes.SET_EVENT_CODE | DataActionTypes.SET_ATTENDEES | DataActionTypes.SET_EVENT_TAGS | DataActionTypes.SET_XCSRF_TOKEN
        | DataActionTypes.SET_TAGS_PARENT_DATA;
    payload: any;
}

// Set Event code
export const setEventCode = (response: any) => (dispatch: Dispatch) => {
    dispatch<DataActions>({
        type: DataActionTypes.SET_EVENT_CODE,
        payload: response
    })
};

// Set language
export const setLanguage = (response: any) => (dispatch: Dispatch) => {
    dispatch<DataActions>({
        type: DataActionTypes.SET_LANGUAGE,
        payload: response
    })
};

// Set Attendees
export const setAttendees = (response: any) => (dispatch: Dispatch) => {
    dispatch<DataActions>({
        type: DataActionTypes.SET_ATTENDEES,
        payload: response
    })
};
// Set Attendees
export const setEventTags = (response: any) => (dispatch: Dispatch) => {
    dispatch<DataActions>({
        type: DataActionTypes.SET_EVENT_TAGS,
        payload: response
    })
};
// Set setXCSRFtoken
export const setXCSRFtoken = (response: any) => (dispatch: Dispatch) => {
    dispatch<DataActions>({
        type: DataActionTypes.SET_XCSRF_TOKEN,
        payload: response
    })
};
// Set Tags Parent Data
export const setTagsParentData = (eventID: string, vocabularyID: string) => (dispatch: Dispatch) => {
    dispatch<DataActions>({
        type: DataActionTypes.SET_TAGS_PARENT_DATA,
        payload: {
            eventID: eventID,
            vocabularyID: vocabularyID
        }
    })
};