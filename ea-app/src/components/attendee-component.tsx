import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {RootState} from "../store/store";
import {fetchPassword, fetchUsername, prodURL} from "../shared/keys";
import axios from "axios";
import {DataState} from "../store/data/reducer";
import {setAttendees} from "../store/data/actions";
import {Table, Input, Popconfirm, Form, InputNumber, Icon} from 'antd';
import {FormComponentProps} from 'antd/lib/form';

// @ts-ignore
const EditableContext = React.createContext();

interface EditableCellProps extends FormComponentProps {
    editing?: boolean,
    dataIndex?: any,
    title?: string,
    inputType?: string,
    record?: any,
    index?: number,
}

type EditableCellState = Readonly<{}>;

class EditableCell extends PureComponent<EditableCellProps, EditableCellState> {
    getInput = () => {
        if (this.props.inputType === 'number') {
            return <InputNumber/>;
        }
        return <Input/>;
    };

    renderCell = ({getFieldDecorator}: any) => {
        const {
            editing,
            dataIndex,
            title,
            inputType,
            record,
            index,
            children,
            ...restProps
        } = this.props;
        return (
            <td {...restProps}>
                {editing ? (
                    <Form.Item style={{margin: 0}}>
                        {getFieldDecorator(dataIndex, {
                            rules: [
                                {
                                    required: true,
                                    message: `Please Input ${title}!`,
                                },
                            ],
                            initialValue: record[dataIndex],
                        })(this.getInput())}
                    </Form.Item>
                ) : (
                    children
                )}
            </td>
        );
    };

    render() {
        return <EditableContext.Consumer>{this.renderCell}</EditableContext.Consumer>;
    }
}

interface OwnProps extends FormComponentProps {
    setAttendees(attendees: object): void,

    XCSRFtoken: string
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
interface newAttendee {
    field_first_name: string,
    field_last_name: string,
    field_full_name: string
}
type State = Readonly<{
    dataSource: Attendee[],
    editingRow: string
}>;

declare module 'react' {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
        disabled?: boolean;
    }
}

class AttendeeComponent extends PureComponent<Props, State> {
    private columns: (
        {
            title: string;
            render: (text: any, record: any) => any;
            key: string,
            editable?: boolean,
            dataIndex?: string;
        } |
        {
            dataIndex: string;
            title: string;
            key: string,
            editable: boolean
        })[];

    constructor(props: Props) {
        super(props);

        this.columns = [
            {
                title: 'Edit',
                key: 'edit',
                render: (text: any, record: any) => {
                    const {editingRow} = this.state;
                    const editable = this.isEditing(record);

                    return editable ?
                        (
                            <span>
              <EditableContext.Consumer>
                {(form: any) => (
                    <a
                        href="javascript:;"
                        onClick={() => this.save(form, record.key)}
                        style={{marginRight: 8}}
                    >
                        Save
                    </a>
                )}
              </EditableContext.Consumer>
              <Popconfirm title="Sure to cancel?" onConfirm={() => this.cancel(record.key)}>
                <a>Cancel</a>
              </Popconfirm>
            </span>
                        ) :
                        (
                            <a disabled={editingRow !== ''} onClick={() => this.edit(record.key)}>
                                <Icon type="edit" theme="outlined" style={{fontSize: '18px', color: '#595959'}}/>
                            </a>
                        );
                },
            },
            {
                title: 'First name',
                dataIndex: 'firstName',
                key: 'firstName',
                editable: true
            },
            {
                title: 'Last name',
                dataIndex: 'lastName',
                key: 'lastName',
                editable: true,
            },
            {
                title: 'Email',
                dataIndex: 'email',
                key: 'email',
                editable: false
            }, {
                title: 'Attendee tags',
                dataIndex: 'attendeeTags',
                key: 'attendeeTags',
                editable: true
            }
        ];

        this.state = {
            dataSource: [{
                key: 0,
                firstName: '',
                lastName: '',
                email: '',
                attendeeTags: [''],
            }],
            editingRow: ''
        };
    }

    private updateAttendees = (attendeeID: string, newAttendee: newAttendee): void => {

        console.log(attendeeID);
        console.log(newAttendee);

        /*axios({
            method: 'patch',
            url: `${prodURL}/jsonapi/node/puzzle/${attendeeID}`,
            auth: {
                username: `${fetchUsername}`,
                password: `${fetchPassword}`
            },
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
                'X-CSRF-Token': this.props.data.XCSRFtoken
            },
            data: {
                "data": []
            }
        })
            .then(res => {
                const attendees: object = res.data;
                this.props.setAttendees(attendees);
            })
            .catch(error => console.log(error));*/
    };

    isEditing = (record: any) => record.key === this.state.editingRow;

    cancel = (recordKey: any) => {
        this.setState({editingRow: ''});
    };

    save(form: any, key: any) {
        form.validateFields((error: any, row: any) => {
            if (error) {
                return;
            }
            const newData = [...this.state.dataSource];
            const index = newData.findIndex(item => key === item.key);
            const attendeeID = this.props.data.attendees.data[key].id;

            if (index > -1) {
                const item = newData[index];
                newData.splice(index, 1, {
                    ...item,
                    ...row,
                });
                this.setState({dataSource: newData, editingRow: ''});

                const updatedAttendee = newData[key];
                const newAttendee: newAttendee = {
                   field_first_name: updatedAttendee.firstName,
                   field_last_name: updatedAttendee.lastName,
                   field_full_name: `${updatedAttendee.firstName} ${updatedAttendee.lastName}`
                };

                this.updateAttendees(attendeeID, newAttendee);
            } else {
                newData.push(row);
                this.setState({dataSource: newData, editingRow: ''});
            }
        });
    }

    edit(key: any) {
        this.setState({editingRow: key});
    }

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
                dataSource: attendeeData
            })
        }
    }

    render() {
        const components = {
            body: {
                cell: EditableCell,
            },
        };
        const columns = this.columns.map(col => {
            if (!col.editable) {
                return col;
            }
            return {
                ...col,
                onCell: (record: any) => ({
                    record,
                    inputType: col.dataIndex === 'text',
                    dataIndex: col.dataIndex,
                    title: col.title,
                    editing: this.isEditing(record),
                }),
            };
        });

        return (
            <EditableContext.Provider value={this.props.form}>
                <Table<Attendee>
                    components={components}
                    bordered
                    dataSource={this.state.dataSource}
                    columns={columns}
                    // @ts-ignore
                    rowClassName="editable-row"
                    pagination={{
                        onChange: this.cancel,
                    }}
                />
            </EditableContext.Provider>


        );
    }

}

const WrappedAttendeeComponent = Form.create<EditableCellProps>({name: 'register'})(AttendeeComponent);

export default connect(mapStateToProps, {setAttendees})(WrappedAttendeeComponent);
