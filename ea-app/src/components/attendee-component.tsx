import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {RootState} from "../store/store";
import {fetchPassword, fetchUsername, prodURL} from "../shared/keys";
import axios from "axios";
import {DataState} from "../store/data/reducer";
import {setAttendees} from "../store/data/actions";
import {Table} from 'antd';
import {ColumnProps} from 'antd/lib/table';

interface OwnProps {
    setAttendees(attendees: object): void
}

const mapStateToProps = ({data}: RootState): { data: DataState } => ({data});

type Props = OwnProps & ReturnType<typeof mapStateToProps>;

interface Attendee {
    key: number,
    firstName: string,
    lastName: string,
    email: string,
    attendeeTags: string[]
}

type State = Readonly<{
    attendeeData: Attendee[]
}>;

class AttendeeComponent extends PureComponent<Props, State> {
    readonly state: State = {
        attendeeData: [{
            key: 0,
            firstName: '',
            lastName: '',
            email: '',
            attendeeTags: [''],
        }]
    };

    private fetchAttendees = (): void => {
        const fetchURL = `${prodURL}/jsonapi/node/attendee/?filter[field_event_reference.field_event_access_code][value]=${this.props.data.eventCode}&fields[user--user]=name,mail&include=field_attendee_tags.vid&fields[node--attendee]=title,field_first_name,field_last_name,field_attendee_tags&fields[taxonomy_term--attendee_tags]=name`;
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
                const attendees: object = res.data;
                this.props.setAttendees(attendees);
            })
            .catch(error => console.log(error));
    };

    componentDidMount(): void {
        this.fetchAttendees();
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        const attendees: any = this.props.data.attendees;

        if (attendees !== prevProps.data.attendees) {
            const attendeeNames = attendees.data;
            const attendeeTags: any = attendees.included;

            const attendeeData = attendeeNames.map((attendeeName: any, index: number) => {
                let tags: string[] = [];

                const existingTagIDs: string[] = attendeeName.relationships.field_attendee_tags.data.map((tagID: any) => {
                    return tagID.id
                });

                attendeeTags.map((attendeeTag: any) => {
                    return (
                        existingTagIDs.map((existingTagID: string) => {
                                if (attendeeTag.id === existingTagID) {
                                    return (
                                        tags.push(attendeeTag.attributes.name)
                                    )
                                } else {
                                    return null
                                }
                            }
                        ))
                });

                const tagsString = tags.join(', ');

                return {
                    key: index,
                    firstName: attendeeName.attributes.field_first_name,
                    lastName: attendeeName.attributes.field_last_name,
                    email: attendeeName.attributes.title,
                    attendeeTags: tagsString
                }
            });
            this.setState({
                attendeeData: attendeeData
            })
        }
    }

    render() {
        const columns: ColumnProps<Attendee>[] = [
            {
                title: 'Edit',
                key: 'edit',
                render: () => <div>Edit</div>
            },
            {
                title: 'First name',
                dataIndex: 'firstName',
                key: 'firstName',
            },
            {
                title: 'Last name',
                dataIndex: 'lastName',
                key: 'lastName',
            },
            {
                title: 'Email',
                dataIndex: 'email',
                key: 'email',
            }, {
                title: 'Attendee tags',
                dataIndex: 'attendeeTags',
                key: 'attendeeTags'
            }
        ];

        return (
            <Table<Attendee> dataSource={this.state.attendeeData} columns={columns}/>
        );
    }
}

export default connect(mapStateToProps, {setAttendees})(AttendeeComponent);
