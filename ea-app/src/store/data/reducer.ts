import {ActionTypes} from './types';
import {DataActions} from './actions'

export interface DataState {
    eventCode: string,
    language: string,
    attendees: []
}

export const initialState: DataState = {
    eventCode: '589089',//'empty'
    language: 'empty',
    attendees: []
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
        default:
            return state
    }
}