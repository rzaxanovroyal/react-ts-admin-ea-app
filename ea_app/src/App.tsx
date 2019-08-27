import React, {PureComponent} from 'react';
import {connect} from 'react-redux';

import {RootState} from "./store/store";
import {
    setEventCode,
    setEventTags,
    setMomentTags,
    setXCSRFtoken,
    setAttendees,
    setTagParentEvents,
    setTagTaxonomyVocabularies
} from "./store/data/actions";
import {callMethod} from "./store/view/actions";
import {AttendeeData, DataState, EventTags} from "./store/data/reducer";
import axios from "axios";
import {fetchPassword, fetchUsername, prodURL} from "./shared/keys";
import SidebarComponent from "./components/sidebar-component";
import {catchError} from "./shared/common-methods";
import {ViewState} from "./store/view/reducer";

interface OwnProps {
    setXCSRFtoken(XCSRFtoken: string): void;

    setEventCode(eventCode: string): void;

    setEventTags(eventTags: EventTags): void;

    setMomentTags(eventTags: EventTags): void;

    setTagParentEvents(attendeeEventID: string, momentEventID: string): void;

    setTagTaxonomyVocabularies(attendeeVocabularyID: string, momentVocabularyID: string): void;

    callMethod(method: string): void;

    setAttendees(attendees: AttendeeData): void;

}

const mapStateToProps = ({data, view}: RootState): { data: DataState, view: ViewState } => ({data, view});

type Props = OwnProps & ReturnType<typeof mapStateToProps>;

type State = Readonly<{
    isLoading: boolean
}>;

class App extends PureComponent<Props, State> {
    readonly state: State = {
        isLoading: true
    };

    private getXCSRFToken = (): void => {
        const fetchURL = `${prodURL}/rest/session/token`;

        axios({
            method: 'get',
            url: `${fetchURL}`,
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
            }
        })
            .then(response => {
                this.props.setXCSRFtoken(response.data)
            })
            .catch(catchError);
    };

    private fetchAttendees = (): void => {
        const fetchURL = `${prodURL}/jsonapi/node/attendee/?filter[field_event_reference.field_event_access_code][value]=${this.props.data.eventCode}&fields[user--user]=name,mail&include=field_attendee_tags.vid&fields[node--attendee]=title,field_first_name,field_last_name,field_attendee_tags,field_event_reference&fields[taxonomy_term--attendee_tags]=name`;
        axios({
            method: 'get',
            url: `${fetchURL}`,
            auth: {
                username: `${fetchUsername}`,
                password: `${fetchPassword}`
            },
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
            }
        })
            .then((res) => {
                const attendees = res.data;
                this.props.setAttendees(attendees);
                this.setState({
                    isLoading: false
                });
            })
            .catch(catchError);
    };

    private fetchEventTags = (): void => {
        const fetchURL = `${prodURL}/jsonapi/taxonomy_term/attendee_tags?fields[taxonomy_term--attendee_tags]=name&filter[parent.name][value]=${this.props.data.eventCode}&include=parent,vid`;

        axios({
            method: 'get',
            url: `${fetchURL}`,
            auth: {
                username: `${fetchUsername}`,
                password: `${fetchPassword}`
            },
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
            }
        })
            .then((res: any) => {
                const eventTags = res.data.data;
                this.props.setEventTags(eventTags);
            })
            .catch(catchError);
    };

    private fetchMomentTags = (): void => {
        const fetchURL = `${prodURL}/jsonapi/taxonomy_term/moment_tags?fields[taxonomy_term--moment_tags]=name&filter[parent.name][value]=${this.props.data.eventCode}&include=parent,vid`;

        axios({
            method: 'get',
            url: `${fetchURL}`,
            auth: {
                username: `${fetchUsername}`,
                password: `${fetchPassword}`
            },
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
            }
        })
            .then((res: any) => {
                const momentTags = res.data.data;
                this.props.setMomentTags(momentTags);
            })
            .catch(catchError);
    };

    private fetchTagsParentEvent = (): void => {
        const fetchURL = `${prodURL}/jsonapi/node/event?filter[field_event_access_code]=${this.props.data.eventCode}&fields[node--event]=field_event_attendee_tags,field_event_moment_tags`;

        axios({
            method: 'get',
            url: `${fetchURL}`,
            auth: {
                username: `${fetchUsername}`,
                password: `${fetchPassword}`
            },
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
            }
        })
            .then((res: any) => {
                const attendeeEventID = res.data.data[0].relationships.field_event_attendee_tags.data.id;
                const momentEventID = res.data.data[0].relationships.field_event_moment_tags.data[0].id;

                this.props.setTagParentEvents(attendeeEventID, momentEventID);
            })
            .catch(catchError);
    };

    private fetchTaxonomyVocabularyID = (): void => {
        const fetchURL = `${prodURL}/jsonapi/taxonomy_vocabulary/taxonomy_vocabulary?fields[taxonomy_vocabulary--taxonomy_vocabulary]=name`;

        axios({
            method: 'get',
            url: `${fetchURL}`,
            auth: {
                username: `${fetchUsername}`,
                password: `${fetchPassword}`
            },
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
            }
        })
            .then((res: any) => {
                const taxonomyData = res.data.data;
                let attendeeVocabularyID = '';
                let momentVocabularyID = '';

                taxonomyData.map((vocabulary: any) => {
                    if (vocabulary.attributes.name === 'Attendee Tags') {
                        attendeeVocabularyID = vocabulary.id
                    } else if (vocabulary.attributes.name === 'Moment Tags') {
                        momentVocabularyID = vocabulary.id
                    }
                });
                this.props.setTagTaxonomyVocabularies(attendeeVocabularyID, momentVocabularyID)
            })
            .catch(catchError);
    };

    async componentDidMount() {
        this.getXCSRFToken();
        /*global drupalSettings:true*/
        /*eslint no-undef: "error"*/
        // @ts-ignore
        await this.props.setEventCode('039214');//'039214'//drupalSettings.eventAccessCode//'332280'
        await this.fetchEventTags();
        await this.fetchAttendees();
        await this.fetchMomentTags();
        await this.fetchTagsParentEvent();
        await this.fetchTaxonomyVocabularyID();
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        if (this.props.view.callMethod !== prevProps.view.callMethod) {
            switch (this.props.view.callMethod) {
                case 'fetchEventTags':
                    this.fetchEventTags();
                    this.props.callMethod('');
                    break;
                case 'fetchMomentTags':
                    this.fetchMomentTags();
                    this.props.callMethod('');
                    break;
                case 'fetchAttendees':
                    this.fetchAttendees();
                    this.props.callMethod('');
                    break;
            }
        }
    }

    render() {

        return (
            this.state.isLoading ?
                <h1>Loading...</h1>
                :
                <SidebarComponent/>
        );
    }
}

export default connect(mapStateToProps, {
    setAttendees,
    setEventCode,
    setXCSRFtoken,
    setEventTags,
    setMomentTags,
    setTagParentEvents, setTagTaxonomyVocabularies,
    callMethod
})(App);