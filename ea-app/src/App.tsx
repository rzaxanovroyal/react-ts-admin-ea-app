import React, {PureComponent} from 'react';
import {connect} from 'react-redux';

import {RootState} from "./store/store";
import AttendeeComponent from "./components/attendee-component";
import {setEventCode} from "./store/data/actions";
import {DataState} from "./store/data/reducer";

interface OwnProps {
    data: DataState,
    setEventCode: any
}

const mapStateToProps = ({data}: RootState): {data: DataState} => ({data});

type Props = OwnProps & ReturnType<typeof mapStateToProps>;

type State = Readonly<{}>;

class App extends PureComponent<Props, State> {
    readonly state: State = {};

    render() {

        return (
            <div>
                <AttendeeComponent/>
            </div>
        );
    }
}

export default connect(mapStateToProps, {setEventCode})(App);