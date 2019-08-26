import React, {PureComponent} from 'react';
import {connect} from 'react-redux';

import {RootState} from "./store/store";
import {setEventCode, setEventTags, setTagsParentData, setXCSRFtoken} from "./store/data/actions";
import {DataState, EventTags} from "./store/data/reducer";
import axios from "axios";
import {fetchPassword, fetchUsername, prodURL} from "./shared/keys";
import SidebarComponent from "./components/sidebar-component";
import {catchError} from "./shared/common-methods";

interface OwnProps {
    setXCSRFtoken(XCSRFtoken: string): void;

    setEventCode(eventCode: string): void;

    setEventTags(eventTags: EventTags): void;

    setTagsParentData(eventID: string, vocabularyID: string): void;

}

const mapStateToProps = ({data}: RootState): { data: DataState } => ({data});

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
    }

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
                console.log(res);
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
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        if (this.props.data.eventCode !== prevProps.data.eventCode
            && this.props.data.eventCode !== 'empty'
            && this.state.isLoading) {
            this.setState({
                isLoading: false
            })
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

export default connect(mapStateToProps, {setEventCode, setXCSRFtoken, setEventTags, setTagsParentData})(App);