import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {RootState} from "../store/store";
import {fetchPassword, fetchUsername, prodURL} from "../shared/keys";
import axios from "axios";
import {DataState} from "../store/data/reducer";
import {setAttendees} from "../store/data/actions";
import {Table, Input, Button, Popconfirm, Form} from 'antd';
import {ColumnProps} from 'antd/lib/table';

// @ts-ignore
const EditableContext = React.createContext();
// @ts-ignore
const EditableRow = ({form, index, ...props}) => (
    <EditableContext.Provider value={form}>
        <tr {...props} />
    </EditableContext.Provider>
);

const EditableFormRow = Form.create()(EditableRow);

interface EditableCellProps {
    record: any,
    handleSave: any,
    dataIndex: any,
    title: any,
    editable: any,
    index: any
}

type EditableCellState = Readonly<{
    editing: boolean
}>;

class EditableCell extends PureComponent<EditableCellProps, EditableCellState> {
    readonly state: EditableCellState = {
        editing: false,
    };

    private input: any;
    toggleEdit = () => {
        const editing = !this.state.editing;
        this.setState({editing}, () => {
            if (editing) {
                this.input.focus();
            }
        });
    };
    private form: any;
    save = (e: any) => {
        const {record, handleSave} = this.props;
        this.form.validateFields((error: any, values: any) => {
            if (error && error[e.currentTarget.id]) {
                return;
            }
            this.toggleEdit();
            handleSave({...record, ...values});
        });
    };

    renderCell = (form: any) => {
        this.form = form;
        const {children, dataIndex, record, title} = this.props;
        const {editing} = this.state;
        return editing ? (
            <Form.Item style={{margin: 0}}>
                {form.getFieldDecorator(dataIndex, {
                    rules: [
                        {
                            required: true,
                            message: `${title} is required.`,
                        },
                    ],
                    initialValue: record[dataIndex],
                })(<Input ref={node => (this.input = node)} onPressEnter={this.save} onBlur={this.save}/>)}
            </Form.Item>
        ) : (
            <div
                className="editable-cell-value-wrap"
                style={{paddingRight: 24}}
                onClick={this.toggleEdit}
            >
                {children}
            </div>
        );
    };

    render() {
        const {
            editable,
            dataIndex,
            title,
            record,
            index,
            handleSave,
            children,
            ...restProps
        } = this.props;
        return (
            <td {...restProps}>
                {editable ? (
                    <EditableContext.Consumer>{this.renderCell}</EditableContext.Consumer>
                ) : (
                    children
                )}
            </td>
        );
    }
}

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
