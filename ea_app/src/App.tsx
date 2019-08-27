import React, {PureComponent} from 'react';
import {connect} from 'react-redux';

import {RootState} from "./store/store";
import {setEventCode, setEventTags, setTagsParentData, setXCSRFtoken, setAttendees} from "./store/data/actions";
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

    setTagsParentData(eventID: string, vocabularyID: string): void;

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

                if (res.data.included) {
                    const eventID = res.data.included[0].id;
                    const vocabularyID = res.data.included[1].id;
                    this.props.setTagsParentData(eventID, vocabularyID);
                }
            })
            .catch(catchError);
    };

    async componentDidMount() {
        this.getXCSRFToken();
        /*global drupalSettings:true*/
        /*eslint no-undef: "error"*/
        // @ts-ignore
        await this.props.setEventCode('039214');//'039214'//drupalSettings.eventAccessCode
        await this.fetchEventTags();
        await this.fetchAttendees();

    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        if (this.props.view.callMethod !== prevProps.view.callMethod) {
            switch (this.props.view.callMethod) {
                case 'fetchEventTags':
                    this.fetchEventTags();
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
    setTagsParentData,
    callMethod
})(App);