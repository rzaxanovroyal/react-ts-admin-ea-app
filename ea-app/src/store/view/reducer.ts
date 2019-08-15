import {ViewActionTypes} from './types';
import {ViewActions} from './actions';

export interface ViewState {
    DrawerIsVisible:{
        drawerStatus: boolean;
        record: any;
    };
}

export const initialState: ViewState = {
    DrawerIsVisible: {
        drawerStatus: false,
        record: null
    },
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
        default:
            return state
    }
}