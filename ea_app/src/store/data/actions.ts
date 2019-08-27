import {DataActionTypes} from './types';
import {Dispatch} from "redux";

export interface DataActions {
    type: DataActionTypes.SET_LANGUAGE | DataActionTypes.SET_EVENT_CODE | DataActionTypes.SET_ATTENDEES | DataActionTypes.SET_EVENT_TAGS | DataActionTypes.SET_XCSRF_TOKEN
        | DataActionTypes.SET_TAG_PARENT_EVENTS | DataActionTypes.SET_TAG_TAXONOMY_VOCABULARIES | DataActionTypes.SET_MOMENT_TAGS;
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
// Set Event tags
export const setEventTags = (response: any) => (dispatch: Dispatch) => {
    dispatch<DataActions>({
        type: DataActionTypes.SET_EVENT_TAGS,
        payload: response
    })
};
// Set Moment tags
export const setMomentTags = (response: any) => (dispatch: Dispatch) => {
    dispatch<DataActions>({
        type: DataActionTypes.SET_MOMENT_TAGS,
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
// Set Tags Parent Events IDs
export const setTagParentEvents = (attendeeEventID: string, momentEventID: string) => (dispatch: Dispatch) => {
    dispatch<DataActions>({
        type: DataActionTypes.SET_TAG_PARENT_EVENTS,
        payload: {
            attendeeEventID: attendeeEventID,
            momentEventID: momentEventID
        }
    })
};
// Set Tags Taxonomy Vocabularies IDs
export const setTagTaxonomyVocabularies = (attendeeVocabularyID: string, momentVocabularyID: string) => (dispatch: Dispatch) => {
    dispatch<DataActions>({
        type: DataActionTypes.SET_TAG_TAXONOMY_VOCABULARIES,
        payload: {
            attendeeVocabularyID: attendeeVocabularyID,
            momentVocabularyID: momentVocabularyID
        }
    })
};