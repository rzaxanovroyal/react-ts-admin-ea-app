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
        case ViewActionTypes.toggleDrawer: {
            return {
                ...state,
                DrawerIsVisible: action.payload
            }
        }
        case ViewActionTypes.callMethod: {
            return {
                ...state,
                callMethod: action.payload
            }
        }
        default:
            return state
    }
}