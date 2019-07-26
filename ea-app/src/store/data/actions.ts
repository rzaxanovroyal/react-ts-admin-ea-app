import {action} from 'typesafe-actions'
import {SET_EVENT_CODE, SET_LANGUAGE} from './types'

export const setEventCode = () => action(SET_EVENT_CODE);
export const setLanguage = () => action(SET_LANGUAGE);