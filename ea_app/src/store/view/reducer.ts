import {ViewActionTypes} from './types';
import {ViewActions} from './actions';

export interface ViewState {
    DrawerIsVisible: {
        drawerStatus: boolean;
        record: any;
    };
    callMethod: string;
}

export const initialState: ViewState = {
    DrawerIsVisible: {
        drawerStatus: false,
        record: null
    },
    callMethod: 'empty'
};

export function viewReducer(
    state = initialState,
    action: ViewActions
): ViewState {
    switch (action.type) {
        case ViewActionTypes.TOGGLE_DRAWER: {
            return {
                ...state,
                DrawerIsVisible: action.payload
            }
        }
        case ViewActionTypes.CALL_METHOD: {
            return {
                ...state,
                callMethod: action.payload
            }
        }
        default:
            return state
    }
}