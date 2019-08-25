import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {RootState} from "../../store/store";

interface OwnProps {
}

type Props = OwnProps & ReturnType<typeof mapStateToProps> & typeof mapDispatchToProps;

type State = Readonly<{}>;

class MomentTagsComponent extends PureComponent<Props, State> {
    readonly state: State = {};

    render() {
        return (
            <div>Moment tags</div>
        );
    }
}

const mapStateToProps = (state: RootState) => {
    return {};
};

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(MomentTagsComponent);
