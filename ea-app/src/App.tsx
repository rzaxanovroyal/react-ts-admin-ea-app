import React, {PureComponent} from 'react';
import {connect} from 'react-redux';

import {RootState} from "./store/store";
import AttendeeComponent from "./components/attendee-component";
import {setEventCode, setXCSRFtoken} from "./store/data/actions";
import {DataState} from "./store/data/reducer";
import axios from "axios";
import {prodURL} from "./shared/keys";

interface OwnProps {
    setXCSRFtoken(XCSRFtoken: string): void;
}

const mapStateToProps = ({data}: RootState): { data: DataState } => ({data});

type Props = OwnProps & ReturnType<typeof mapStateToProps>;

type State = Readonly<{}>;

class App extends PureComponent<Props, State> {
    readonly state: State = {};

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
    }

    render() {

        return (
            <div>
                <AttendeeComponent/>
            </div>
        );
    }
}

export default connect(mapStateToProps, {setEventCode, setXCSRFtoken})(App);