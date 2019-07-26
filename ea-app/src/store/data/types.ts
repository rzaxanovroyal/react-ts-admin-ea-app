export interface DataState {
    readonly eventCode: string,
    readonly language: string
}

export const SET_EVENT_CODE = 'SET_EVENT_CODE';
export const SET_LANGUAGE = 'SET_LANGUAGE';