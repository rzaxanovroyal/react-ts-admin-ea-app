import React, {PureComponent} from 'react';
import {connect} from 'react-redux';

import {RootState} from "./store/store";
import AttendeeComponent from "./components/attendee/attendee-component";
import {setEventCode, setXCSRFtoken} from "./store/data/actions";
import {DataState} from "./store/data/reducer";
import axios from "axios";
import {prodURL} from "./shared/keys";

interface OwnProps {
    setXCSRFtoken(XCSRFtoken: string): void;

    setEventCode(eventCode: string): void;
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

    getXCSRFToken() {
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
            .catch(error => console.log(error));
    }

    componentDidMount(): void {
        this.getXCSRFToken();
        /*global drupalSettings:true*/
        /*eslint no-undef: "error"*/
        // @ts-ignore
        this.props.setEventCode('039214');//'039214'//drupalSettings.eventAccessCode
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
                <AttendeeComponent/>
        );
    }
}

export default connect(mapStateToProps, {setEventCode, setXCSRFtoken})(App);