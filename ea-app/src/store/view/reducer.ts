import {ViewActionTypes} from './types';
import {ViewActions} from './actions';

export interface ViewState {
    DrawerIsVisible: boolean;
}

export const initialState: ViewState = {
    DrawerIsVisible: false,
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