import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {RootState} from "../store/store";
import {fetchPassword, fetchUsername, prodURL} from "../shared/keys";
import axios from "axios";
import {DataState} from "../store/data/reducer";
import {setAttendees} from "../store/data/actions";

interface OwnProps {
    setAttendees(attendees: []): void
}

const mapStateToProps = ({data}: RootState): { data: DataState } => ({data});

type Props = OwnProps & ReturnType<typeof mapStateToProps>;

type State = Readonly<{}>;

class AttendeeComponent extends PureComponent<Props, State> {
    readonly state: State = {};

    private fetchAttendees = (): void => {
        const fetchURL = `${prodURL}/jsonapi/node/attendee/?filter[field_event_reference.field_event_access_code][value]=${this.props.data.eventCode}&fields[user--user]=name,mail&include=field_attendee_tags.vid&fields[node--attendee]=title,field_full_name,field_attendee_tags&fields[taxonomy_term--attendee_tags]=name`;

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
            .then(res => {
                const attendees: [] = res.data.data;
                this.props.setAttendees(attendees);
            })
            .catch(error => console.log(error));
    };

    componentDidMount(): void {
        this.fetchAttendees();
    }

    render() {
        return (
            <div>Attendee</div>
        );
    }
}

export default connect(mapStateToProps, {setAttendees})(AttendeeComponent);
