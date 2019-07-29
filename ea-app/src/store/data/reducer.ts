import {ActionTypes} from './types';
import {dataActions} from './actions'

export interface DataState {
    eventCode: string,
    language: string
}

export const initialState: DataState = {
    eventCode: 'empty',
    language: 'empty'
};

export function dataReducer(
    state = initialState,
    action: dataActions
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
        default:
            return state
    }
}