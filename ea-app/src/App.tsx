import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {History} from 'history';

import {RootState} from "./store/store";
import AttendeeComponent from "./components/AttendeeComponent";
import {setEventCode} from "./store/data/actions";

interface OwnProps {
    history: History;
}

const mapStateToProps = (state: RootState) => ({
    eventCode: state.data.eventCode
});

const mapDispatchToProps = {setEventCode};

type Props = OwnProps & ReturnType<typeof mapStateToProps> & typeof mapDispatchToProps;

type State = Readonly<{}>;

class App extends PureComponent<Props, State> {
    readonly state: State = {};

    render() {
        const {history}: OwnProps = this.props;

        return (
            <div>
                <AttendeeComponent/>
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
