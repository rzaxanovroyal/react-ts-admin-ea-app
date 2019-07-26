import {DataState, SET_EVENT_CODE, SET_LANGUAGE} from './types';

export const initialState: DataState = {
    eventCode: 'empty',
    language: 'empty'
};

export function dataReducer(
    state = initialState,
    action: any
): DataState {
    switch (action.type) {
        case SET_EVENT_CODE: {
            return {
                ...state,
                eventCode: action.payload.eventCode
            }
        }
        case SET_LANGUAGE: {
            return {
                ...state,
                language: action.payload.language
            }
        }
        default:
            return state
    }
}