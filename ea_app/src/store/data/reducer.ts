import {DataActionTypes} from './types';
import {DataActions} from './actions';

interface FieldAttendeeTagsData {
    type: string;
    id: string;
}

interface Data {
    id: string;
    attributes: {
        field_first_name: string;
        field_last_name: string;
        title: string;
    };
    relationships: {
        field_attendee_tags: {
            data: FieldAttendeeTagsData[];
        }
    }
}

interface Included {
    attributes: {
        name: string;
    };
    id: string
}

export interface AttendeeData {
    data: Data[];
    included: Included[];
}

export interface EventTags {
    attributes: {
        name: string
    };
    id: string;
}


export interface DataState {
    eventCode: string;
    language: string;
    userIsAnonymous: boolean;
    attendees: AttendeeData;
    eventTags: EventTags[];
    momentTags: EventTags[];
    XCSRFtoken: string;
    parentEventData: {
        eventID: string;
        attendeeEventID: string;
        momentEventID: string;
    };
    tagTaxonomyVocabularies: {
        attendeeVocabularyID: string,
        momentVocabularyID: string
    };
}

export const initialState: DataState = {
    eventCode: 'empty',
    language: 'empty',
    userIsAnonymous: false,
    attendees: {
        data: [{
            id: 'empty',
            attributes: {
                field_last_name: 'empty',
                field_first_name: 'empty',
                title: 'empty',
            },
            relationships: {
                field_attendee_tags: {
                    data: [{
                        type: 'empty',
                        id: 'empty'
                    }]
                }
            }
        }],
        included: [{
            attributes: {
                name: 'empty',
            },
            id: 'empty'
        }]
    },
    eventTags: [{
        attributes: {
            name: 'empty'
        },
        id: 'empty'
    }],
    momentTags: [{
        attributes: {
            name: 'empty'
        },
        id: 'empty'
    }],
    XCSRFtoken: 'empty',
    parentEventData: {
        eventID: 'empty',
        attendeeEventID: 'empty',
        momentEventID: 'empty'
    },
    tagTaxonomyVocabularies: {
        attendeeVocabularyID: 'empty',
        momentVocabularyID: 'empty'
    }
};

export function dataReducer(
    state = initialState,
    action: DataActions
): DataState {
    switch (action.type) {
        case DataActionTypes.SET_EVENT_CODE: {
            return {
                ...state,
                eventCode: action.payload
            }
        }
        case DataActionTypes.SET_LANGUAGE: {
            return {
                ...state,
                language: action.payload
            }
        }
        case DataActionTypes.SET_AUTH_STATUS: {
            return {
                ...state,
                userIsAnonymous: action.payload
            }
        }
        case DataActionTypes.SET_ATTENDEES: {
            return {
                ...state,
                attendees: action.payload
            }
        }
        case DataActionTypes.SET_EVENT_TAGS: {
            return {
                ...state,
                eventTags: action.payload
            }
        }
        case DataActionTypes.SET_MOMENT_TAGS: {
            return {
                ...state,
                momentTags: action.payload
            }
        }
        case DataActionTypes.SET_XCSRF_TOKEN: {
            return {
                ...state,
                XCSRFtoken: action.payload
            }
        }
        case DataActionTypes.SET_PARENT_EVENT_DATA: {
            return {
                ...state,
                parentEventData: action.payload
            }
        }
        case DataActionTypes.SET_TAG_TAXONOMY_VOCABULARIES: {
            return {
                ...state,
                tagTaxonomyVocabularies: action.payload
            }
        }
        default:
            return state
    }
}