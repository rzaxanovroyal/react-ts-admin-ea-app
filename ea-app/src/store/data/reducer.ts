import {ActionTypes} from './types';
import {DataActions} from './actions';

interface Data {
    id: string;
    attributes: {
        field_first_name: string;
        field_last_name: string;
        title: string;
    };
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
        case ActionTypes.setEventCode: {
            return {
                ...state,
                eventCode: action.payload
            }
        }
        case ActionTypes.setLanguage: {
            return {
                ...state,
                language: action.payload
            }
        }
        case ActionTypes.setAttendees: {
            return {
                ...state,
                attendees: action.payload
            }
        }
        case ActionTypes.setEventTags: {
            return {
                ...state,
                eventTags: action.payload
            }
        }
        case ActionTypes.setXCSRFtoken: {
            return {
                ...state,
                XCSRFtoken: action.payload
            }
        }
        default:
            return state
    }
}