import React, {AriaAttributes, DOMAttributes, PureComponent} from 'react';
import {connect} from 'react-redux';
import {RootState} from "../../store/store";
import {fetchPassword, fetchUsername, prodURL} from "../../shared/keys";
import axios from "axios";

import {AttendeeData, DataState} from "../../store/data/reducer";
import {setAttendees, setEventTags} from "../../store/data/actions";
import {callMethod, toggleDrawer} from "../../store/view/actions";

import {Button, Form, Icon, Input, InputNumber, Popconfirm, Spin, Table, Tag} from 'antd';
import {FormComponentProps} from 'antd/lib/form';
import DrawerTagsComponent from "./drawer-tags-component"
import {ViewState} from "../../store/view/reducer";
import {catchError} from "../../shared/common-methods";

// @ts-ignore
const EditableContext = React.createContext();
// @ts-ignore
const EditableRow = ({form, index, ...props}) => (
    <EditableContext.Provider value={form}>
        <tr {...props} />
    </EditableContext.Provider>
);
const EditableFormRow = Form.create()(EditableRow);

interface EditableCellProps extends FormComponentProps {
    editing?: boolean;
    dataIndex?: any;
    title?: string;
    inputType?: string;
    record?: any;
    index?: number;
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
                                    required: dataIndex === 'firstName' || dataIndex === 'email',
                                    message: `Please enter ${title}`,
                                    type: dataIndex === 'email' ? 'email' : 'string'
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
    toggleDrawer(drawerStatus: boolean, record: Attendee): void;

    callMethod(method: string): void;
}

const mapStateToProps = ({data, view}: RootState): { data: DataState, view: ViewState } => ({data, view});

type Props = OwnProps & ReturnType<typeof mapStateToProps>;

export interface EventTag {
    tagName: string;
    tagID: string;
    attendeeID?: string;
}

export interface Attendee {
    key: number;
    firstName: string;
    lastName?: string;
    email: string;
    attendeeTags: EventTag[]
}

interface newAttendee {
    field_first_name: string;
    field_last_name?: string;
    field_full_name: string;
}

export interface Columns {
    dataIndex?: string;
    render?: (text: any, record: Attendee, index?: number | undefined) => any;
    title: string;
    key: string;
    editable?: boolean;
    sorter?: (a: any, b: any) => any;
    sortDirections?: any;
    defaultSortOrder?: "ascend" | "descend" | undefined;
}

type State = Readonly<{
    dataSource: Attendee[];
    editingRow: string;
    isLoading: boolean;
    createAttendeeMode: boolean;
}>;

declare module 'react' {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
        disabled?: boolean;
    }
}

const spinIcon = <Icon type="loading" style={{fontSize: 6, marginLeft: 7, marginRight: 5, verticalAlign: 3}} spin/>;

class AttendeeComponent extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            dataSource: [{
                key: 0,
                firstName: '',
                lastName: '',
                email: '',
                attendeeTags: [{
                    tagID: '',
                    tagName: ''
                }],
            }],
            editingRow: '',
            isLoading: true,
            createAttendeeMode: false
        };
    }

    private removeTag = (record: Attendee, tagID: string) => {
        this.setState({isLoading: true});

        const attendeeID = record.attendeeTags[0].attendeeID;
        const attendeeIndex = record.key;
        const currentTags = this.props.data.attendees.data[attendeeIndex].relationships.field_attendee_tags.data;
        const updatedTags = currentTags.filter(currentTag => currentTag.id !== tagID);

        axios({
            method: 'patch',
            url: `${prodURL}/jsonapi/node/attendee/${attendeeID}`,
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
                "data": {
                    "type": "node--attendee",
                    "id": attendeeID,
                    "relationships": {
                        "field_attendee_tags": {
                            "data": updatedTags
                        }
                    }
                }
            }
        })
            .then(res => {
                this.props.callMethod('fetchAttendees')
            })
            .catch(catchError);
    };

    private addTag = (record: Attendee) => {
        this.props.toggleDrawer(true, record);
    };

    private updateAttendees = (attendeeID: string, newAttendee: newAttendee): void => {
        axios({
            method: 'patch',
            url: `${prodURL}/jsonapi/node/attendee/${attendeeID}`,
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
                "data": {
                    "type": "node--attendee",
                    "id": attendeeID,
                    "attributes": newAttendee
                }
            }
        })
            .then(res => {
                console.log(res);
                this.props.callMethod('fetchAttendees')
            })
            .catch(catchError);
    };

    isEditing = (record: any) => record.key === this.state.editingRow;

    cancel = (recordKey: any) => {
        this.setState({editingRow: ''});
    };

    save(form: any, key: any) {
        this.setState({isLoading: true});

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
                    field_full_name: updatedAttendee.lastName ? `${updatedAttendee.firstName} ${updatedAttendee.lastName}` : updatedAttendee.firstName
                };

                this.updateAttendees(attendeeID, newAttendee);
            } else {
                newData.push(row);
                this.setState({dataSource: newData, editingRow: ''});
            }
        });
    }

    private createNewAttendee = (form: any, key: any): void => {
        this.setState({
            isLoading: true,
        });

        form.validateFields((error: any, row: any) => {
            if (error) {
                return;
            }
            //this.registerUser(row.email, row.firstName, row.lastName);
            axios({
                method: 'post',
                url: `${prodURL}/jsonapi/node/attendee`,
                auth: {
                    username: `${fetchUsername}`,
                    password: `${fetchPassword}`
                },
                headers: {
                    'Accept': 'application/vnd.api+json',
                    'Content-Type': 'application/vnd.api+json'
                },
                data: {
                    "data": {
                        "type": "node--attendee",
                        "attributes": {
                            "title": row.email,
                            "field_first_name": row.firstName,
                            "field_full_name": row.lastName ? `${row.firstName} ${row.lastName}` : row.firstName,
                            "field_last_name": row.lastName,
                        }
                    }
                }
            })
                .catch(catchError);
        });
    };

    edit(key: any) {
        this.setState({editingRow: key});
    }

    private registerUser = (enteredEmail: string, firstName: string, lastName: string): void => {
        const fetchURL = `${prodURL}/jsonapi/user/user?fields[user--user]=mail&filter[mail]=${enteredEmail}`;
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
            .then((res) => {
                const registeredAttendees = res.data.data;
                const attendeeAlreadyRegistered = registeredAttendees.some((attendee: string) => attendee);

                if (attendeeAlreadyRegistered === false) {
                    axios({
                        method: 'post',
                        url: `${prodURL}/user/register?_format=json`,
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-Token': this.props.data.XCSRFtoken
                        },
                        data: {
                            "name": {"value": enteredEmail},
                            "mail": {"value": enteredEmail}
                        }
                    })
                        .catch(catchError);
                }
            })
            .then(res => {
                axios({
                    method: 'post',
                    url: `${prodURL}/jsonapi/node/attendee`,
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
                        "data": {
                            "type": "node--attendee",
                            "attributes": {
                                "title": enteredEmail,
                                "field_first_name": firstName,
                                "field_full_name": lastName ? `${firstName} ${lastName}` : firstName,
                                "field_last_name": lastName,
                            }
                        }
                    }
                })
                    .catch(catchError);
            })
            .then(res => {
                this.props.callMethod('fetchAttendees')
            })
            .catch(catchError);
    };

    private setDataSource = (): void => {
        const attendees = this.props.data.attendees;
        const attendeeNames = attendees.data;
        const attendeeTags = attendees.included;

        const attendeeData = attendeeNames.map((attendeeName: any, index: number) => {
            let tags: EventTag[] = [];

            const existingTagIDs: string[] = attendeeName.relationships.field_attendee_tags.data.map((tagID: any) => {
                return tagID.id
            });

            if (attendeeTags) {
                attendeeTags.map((attendeeTag) => {
                    return (
                        existingTagIDs.map((existingTagID: string) => {
                                if (attendeeTag.id === existingTagID) {
                                    return (
                                        tags.push({
                                            tagName: attendeeTag.attributes.name,
                                            tagID: attendeeTag.id,
                                            attendeeID: attendeeName.id
                                        })
                                    )
                                } else {
                                    return null
                                }
                            }
                        ))
                })
            }
            return {
                key: index,
                firstName: attendeeName.attributes.field_first_name,
                lastName: attendeeName.attributes.field_last_name,
                email: attendeeName.attributes.title,
                attendeeTags: tags
            }
        });
        this.setState({
            dataSource: attendeeData,
            isLoading: false
        })
    };

    private handleAdd = (): void => {
        const {dataSource} = this.state;
        const newData = {
            key: -1,
            firstName: '#Enter First name',
            lastName: '#Enter Last name',
            email: '#Enter e-mail',
            attendeeTags: []
        };
        this.setState({
            dataSource: [...dataSource, newData],
            createAttendeeMode: true
        });
    };

    componentDidMount(): void {
        this.setDataSource();
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot ?: any): void {
        if (this.props.data.attendees !== prevProps.data.attendees) {
            this.setDataSource();
        }
    }

    render() {
        let tagPosition = 0;

        const columnsBlueprint: Columns[] = [
            {
                title: 'Edit',
                key: 'edit',
                render: (text, record) => {
                    const {editingRow} = this.state;
                    const editable = this.isEditing(record);

                    if (record.key === -1) {
                        return editable ?
                            (<span>
              <EditableContext.Consumer>
                {(form: any) => (
                    <a
                        onClick={() => this.createNewAttendee(form, record.key)}
                        style={{marginRight: 8}}
                    > Save </a>)}
              </EditableContext.Consumer>

              <Popconfirm title="Sure to cancel?" onConfirm={() => this.cancel(record.key)}><a> Cancel </a></Popconfirm>
            </span>)
                            :
                            (<a disabled={editingRow !== ''} onClick={() => this.edit(record.key)}>
                                <Icon type="user-add" theme="outlined"
                                      style={{fontSize: '18px', color: 'rgba(176,31,95,1)'}}/>
                            </a>);
                    }
                    return editable ?
                        (<span>
              <EditableContext.Consumer>
                {(form: any) => (
                    <a
                        onClick={() => this.save(form, record.key)}
                        style={{marginRight: 8}}
                    > Save </a>)}
              </EditableContext.Consumer>

              <Popconfirm title="Sure to cancel?" onConfirm={() => this.cancel(record.key)}><a> Cancel </a></Popconfirm>
            </span>)
                        :
                        (<a disabled={editingRow !== ''} onClick={() => this.edit(record.key)}>
                            <Icon type="edit" theme="outlined"
                                  style={{fontSize: '18px', color: 'rgba(176,31,95,1)'}}/>
                        </a>);
                },
            },
            {
                title: 'First name',
                dataIndex: 'firstName',
                key: 'firstName',
                editable: true,
                sorter: (a, b) => {
                    a = a.firstName || 'z';
                    b = b.firstName || 'z';
                    return a.localeCompare(b);
                },
                sortDirections: ['ascend', 'descend']
            },
            {
                title: 'Last name',
                dataIndex: 'lastName',
                key: 'lastName',
                editable: true,
                defaultSortOrder: 'ascend',
                sorter: (a, b) => {
                    a = a.lastName || 'z';
                    b = b.lastName || 'z';
                    return a.localeCompare(b);
                },
                sortDirections: ['ascend', 'descend']
            },
            {
                title: 'Email',
                dataIndex: 'email',
                key: 'email',
                editable: this.state.createAttendeeMode,
                sorter: (a, b) => {
                    a = a.email || 'z';
                    b = b.email || 'z';
                    return a.localeCompare(b);
                },
                sortDirections: ['ascend', 'descend']
            }, {
                title: 'Attendee tags',
                dataIndex: 'attendeeTags',
                key: 'attendeeTags',
                editable: false,
                render: (tags, record, index) => {
                    if (record.key === -1) {
                        return (
                            <div>Please create new attendee before adding tags</div>
                        )
                    }
                    return (
                        <span>
                        {tags.map((tag: EventTag) => {
                            let color;
                            switch (tagPosition) {
                                case 0:
                                    color = 'volcano';
                                    tagPosition = 1;
                                    break;
                                case 1:
                                    color = 'geekblue';
                                    tagPosition = 2;
                                    break;
                                case 2:
                                    color = 'green';
                                    tagPosition = 3;
                                    break;
                                case 3:
                                    color = 'orange';
                                    tagPosition = 4;
                                    break;
                                case 4:
                                    color = 'cyan';
                                    tagPosition = 5;
                                    break;
                                case 5:
                                    color = 'magenta';
                                    tagPosition = 6;
                                    break;
                                case 6:
                                    color = 'purple';
                                    tagPosition = 7;
                                    break;
                                case 7:
                                    color = 'red';
                                    tagPosition = 8;
                                    break;
                                case 8:
                                    color = 'blue';
                                    tagPosition = 9;
                                    break;
                                case 9:
                                    color = 'gold';
                                    tagPosition = 0;
                                    break;
                                default:
                                    color = 'lime';
                                    break
                            }
                            return (
                                this.state.isLoading ?
                                    <Tag key={tag.tagID}
                                         style={{background: '#fff', borderStyle: 'dashed'}}>{tag.tagName}<Spin
                                        indicator={spinIcon}/></Tag>
                                    :

                                    <Tag color={color} key={tag.tagID} closable
                                         onClose={(e: any) => {
                                             e.preventDefault();
                                             this.removeTag(record, tag.tagID)
                                         }}> {tag.tagName} </Tag>
                            )
                        })}
                            < Tag key={index} onClick={(e: any) => {
                                e.preventDefault();
                                this.addTag(record)
                            }} style={{background: '#fff', borderStyle: 'dashed'}}>
                            <Icon type="plus"/> Add Tag
                            </Tag>
                       </span>
                    )
                }
            }
        ];

        const components = {
            body: {
                row: EditableFormRow,
                cell: EditableCell,
            },
        };
        const columns = columnsBlueprint.map(col => {
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
            <React.Fragment>
                {!this.state.createAttendeeMode ?
                    <Button onClick={this.handleAdd} type="dashed" style={{marginBottom: 16}}>
                        <Icon type="plus" theme="outlined"
                              style={{fontSize: '18px', color: 'rgba(176,31,95,1)'}}/>Add row
                    </Button> : null}
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
                <DrawerTagsComponent/>
            </React.Fragment>
        );
    }
}

const WrappedAttendeeComponent = Form.create<EditableCellProps>({name: 'register'})(AttendeeComponent);

export default connect(mapStateToProps, {
    setAttendees,
    setEventTags,
    toggleDrawer,
    callMethod
})(WrappedAttendeeComponent);
