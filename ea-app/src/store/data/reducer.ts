import {SET_LANGUAGE, SET_EVENT_CODE, SET_ATTENDEES, SET_EVENT_TAGS, SET_XCSRF_TOKEN} from './types';
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
    attendees: AttendeeData;
    eventTags: EventTags[];
    XCSRFtoken: string;
}

export const initialState: DataState = {
    eventCode: '589089',//'empty'
    language: 'empty',
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
    XCSRFtoken: 'empty',
};

export function dataReducer(
    state = initialState,
    action: DataActions
): DataState {
    switch (action.type) {
        case SET_EVENT_CODE: {
            return {
                ...state,
                eventCode: action.payload
            }
        }
        case SET_LANGUAGE: {
            return {
                ...state,
                language: action.payload
            }
        }
        case SET_ATTENDEES: {
            return {
                ...state,
                attendees: action.payload
            }
        }
        case SET_EVENT_TAGS: {
            return {
                ...state,
                eventTags: action.payload
            }
        }
        case SET_XCSRF_TOKEN: {
            return {
                ...state,
                XCSRFtoken: action.payload
            }
        }
        default:
            return state
    }
}