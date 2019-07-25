import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {RootState} from "./store/store";
import {setEventCode} from "./store/data/actions";


interface OwnProps {
}

type Props = OwnProps & ReturnType<typeof mapStateToProps> & typeof mapDispatchToProps;

type State = Readonly<{}>;

class App extends PureComponent<Props, State> {
    readonly state: State = {};

    render() {
        return (
            <div>1</div>
        );
    }
}

const mapStateToProps = (state: RootState) => ({
    eventCode: state.data.eventCode
});

const mapDispatchToProps = {setEventCode};

export default connect(mapStateToProps, mapDispatchToProps)(App);
