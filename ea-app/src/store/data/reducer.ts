import {Reducer} from 'redux';
import {DataState, SET_EVENT_CODE} from './types';

export const initialState: DataState = {
    eventCode: 'empty'
};

const reducer: Reducer<DataState> = (state = initialState, action) => {
    switch (action.type) {
        case SET_EVENT_CODE: {
            return {
                ...state,
                eventCode: action.payload.eventCode
            }
        }
        default: {
            return state
        }
    }
};

export {reducer as dataReducer}