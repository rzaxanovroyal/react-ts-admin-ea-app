import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {RootState} from "../../store/store";
import {fetchPassword, fetchUsername, prodURL} from "../../shared/keys";
import axios from "axios";

import {DataState, AttendeeData, EventTags} from "../../store/data/reducer";
import {setAttendees, setEventTags} from "../../store/data/actions";
import {toggleDrawer, callMethod} from "../../store/view/actions";

import {Table, Input, Popconfirm, Form, InputNumber, Icon, Tag, Spin} from 'antd';
import {FormComponentProps} from 'antd/lib/form';
import DrawerTagsComponent from "./drawer-tags-component"
import {ViewState} from "../../store/view/reducer";

// @ts-ignore
const EditableContext = React.createContext();

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
    setAttendees(attendees: AttendeeData): void;

    setEventTags(eventTags: EventTags): void;

    toggleDrawer(drawerStatus: boolean, record: any): void;

    callMethod(method: string): void;
}

const mapStateToProps = ({data, view}: RootState): { data: DataState, view: ViewState } => ({data, view});

type Props = OwnProps & ReturnType<typeof mapStateToProps>;

export interface eventTag {
    tagName: string;
    tagID: string;
    attendeeID?: string;
}

interface Attendee {
    key: number;
    firstName: string;
    lastName: string;
    email: string;
    attendeeTags: eventTag[]
}

interface newAttendee {
    field_first_name: string;
    field_last_name: string;
    field_full_name: string;
}

type State = Readonly<{
    dataSource: Attendee[];
    editingRow: string;
    isLoading: boolean;
}>;

declare module 'react' {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
        disabled?: boolean;
    }
}

const spinIcon = <Icon type="loading" style={{fontSize:6, marginLeft: 7, marginRight: 5, verticalAlign: 3}} spin/>;

class AttendeeComponent extends PureComponent<Props, State> {
    private columns: (
        {
            title: string;
            render: (text: any, record: Attendee, index?: number | undefined) => any;
            key: string;
            editable?: boolean;
            dataIndex?: string;
        } |
        {
            dataIndex: string;
            title: string;
            key: string;
            editable: boolean;
            sorter: (a: any, b: any) => any;
            sortDirections: any;
            defaultSortOrder?: "ascend" | "descend" | undefined;
        })[];

    constructor(props: Props) {
        super(props);
        let tagPosition = 0;

        this.columns = [
            {
                title: 'Edit',
                key: 'edit',
                render: (text, record) => {
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
                editable: true,
                sorter: (a:any, b:any) => a.firstName.localeCompare(b.firstName),
                sortDirections: ['ascend', 'descend']
            },
            {
                title: 'Last name',
                dataIndex: 'lastName',
                key: 'lastName',
                editable: true,
                defaultSortOrder: 'ascend',
                sorter: (a:any, b:any) => a.lastName.localeCompare(b.lastName),
                sortDirections: ['ascend', 'descend']
            },
            {
                title: 'Email',
                dataIndex: 'email',
                key: 'email',
                editable: false,
                sorter: (a:any, b:any) => a.email.localeCompare(b.email),
                sortDirections: ['ascend', 'descend']
            }, {
                title: 'Attendee tags',
                dataIndex: 'attendeeTags',
                key: 'attendeeTags',
                editable: false,
                render: (tags, record, index) => (
                    <span>
        {tags.map((tag: eventTag) => {
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
                    <Tag key={tag.tagID} style={{background: '#fff', borderStyle: 'dashed'}}>{tag.tagName}<Spin indicator={spinIcon}/></Tag>
                    :
                    <Tag color={color} key={tag.tagID} closable
                         onClose={(e: any) => {
                             e.preventDefault();
                             this.removeTag(record, tag.tagID)
                         }}> {tag.tagName} </Tag>
            );
        })}

                            <Tag key={index} onClick={(e: any) => {
                                e.preventDefault();
                                this.addTag(record)
                            }} style={{background: '#fff', borderStyle: 'dashed'}}>
                                <Icon type="plus"/> Add Tag
                            </Tag>
                    </span>
                ),
            }
        ];

        this.state = {
            dataSource: [{
                key: 0,
                firstName: '',
                lastName: '',
                email: '',
                attendeeTags: [{
                    tagID: 'empty',
                    tagName: 'empty'
                }],
            }],
            editingRow: '',
            isLoading: true
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
                this.fetchAttendees()
            })
            .catch(error => console.log(error));
    };
    private addTag = (record: Attendee) => {
        this.props.toggleDrawer(true, record);
    };
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
            .then((res) => {
                const attendees = res.data;
                this.props.setAttendees(attendees);
                this.setState({isLoading: false});
            })
            .catch((error: any) => console.log(error));
    };

    private fetchEventTags = (): void => {
        const fetchURL = `${prodURL}/jsonapi/taxonomy_term/attendee_tags?fields[taxonomy_term--attendee_tags]=name&filter[parent.name][value]=${this.props.data.eventCode}`;

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
            .then((res: any) => {
                const eventTags = res.data.data;
                this.props.setEventTags(eventTags);
            })
            .catch((error: any) => console.log(error));
    };

    private setDataSource = (): void => {
        const attendees = this.props.data.attendees;
        const attendeeNames = attendees.data;
        const attendeeTags = attendees.included;

        const attendeeData = attendeeNames.map((attendeeName: any, index: number) => {
            let tags: eventTag[] = [];

            const existingTagIDs: string[] = attendeeName.relationships.field_attendee_tags.data.map((tagID: any) => {
                return tagID.id
            });

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
            });

            return {
                key: index,
                firstName: attendeeName.attributes.field_first_name,
                lastName: attendeeName.attributes.field_last_name,
                email: attendeeName.attributes.title,
                attendeeTags: tags
            }
        });

        this.setState({
            dataSource: attendeeData
        })
    };

    componentDidMount(): void {
        this.fetchAttendees();
        this.fetchEventTags();
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        if (this.props.data.attendees !== prevProps.data.attendees) {
            this.setDataSource();
        }
        if (this.props.view.callMethod !== prevProps.view.callMethod) {
            switch (this.props.view.callMethod) {
                case 'fetchAttendees':
                    this.fetchAttendees();
                    this.props.callMethod('');
                    break;
            }
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
            <React.Fragment>
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
