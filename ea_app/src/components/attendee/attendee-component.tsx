import React, {AriaAttributes, DOMAttributes, PureComponent, createRef} from 'react';
import {connect} from 'react-redux';
import {RootState} from "../../store/store";
import {fetchPassword, fetchUsername, prodURL} from "../../shared/keys";
import axios from "axios";

import {DataState} from "../../store/data/reducer";
import {setAttendees, setEventTags} from "../../store/data/actions";
import {callMethod, toggleDrawer} from "../../store/view/actions";

import {
    Form, Input, InputNumber, Popconfirm, Spin, 
    Table, Tag, Popover, message, Icon, Select
} from 'antd';
import {FormComponentProps} from 'antd/es/form';
import DrawerTagsComponent from "./drawer-tags-component"
import {ViewState} from "../../store/view/reducer";
import {catchError} from "../../shared/common-methods";
import LoaderComponent from "../loader-component";
import styled from "styled-components";
import intl from "react-intl-universal";

import SearchBar from "material-ui-search-bar";
import { filter } from 'lodash';

import EditableFormTable from './expandable-editable-table';

const { Option } = Select;

// CSS starts
const LoaderWrapper = styled.div`
 display: grid;
 grid-template-columns: 1fr;
 height: 70vh;
 align-items: center;
 justify-items: center;
`;
// CSS ends

message.config({
    top: 150
});
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
        return <Input placeholder={`${intl.get('ENTER')} ${this.props.title}`}/>;
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
                                    message: `${intl.get('PLEASE_ENTER')} ${title}`,
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
    gender: string;
    email: string;
    birth: string;
    death: string;
    attendeeTags: EventTag[];
    parent: any[];
    createParentMode: boolean;
}

interface newAttendee {
    field_first_name: string;
    field_last_name?: string;
    field_full_name: string;
    gender?: string;
    birth?: string;
    death?: string;
}

export interface Columns {
    dataIndex?: string;
    render?: (text: any, record: Attendee, index?: number | undefined) => any;
    title: any;
    key: string;
    editable?: boolean;
    sorter?: (a: any, b: any) => any;
    sortDirections?: any;
    defaultSortOrder?: "ascend" | "descend" | undefined;
    filters?: any[];
    width?: number;
    fixed?: any;
}

type State = Readonly<{
    dataSource: Attendee[];
    editingRow: string;
    isLoading: boolean;
    fullscreenLoading: boolean;
    createAttendeeMode: boolean;
    originDataSource: any[];
    pagination: any;
    searchValue: string;
}>;

declare module 'react' {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
        disabled?: boolean;
    }
}

const spinIcon = <Icon type="loading" style={{fontSize: 6, marginLeft: 7, marginRight: 5, verticalAlign: 3}} spin/>;

class AttendeeComponent extends PureComponent<Props, State> {
    readonly myRef: React.RefObject<HTMLDivElement>;

    constructor(props: Props) {
        super(props);

        this.myRef = createRef<HTMLDivElement>();

        this.state = {
            dataSource: [{
                key: 0,
                firstName: '',
                lastName: '',
                email: '',
                gender: '',
                birth: '',
                death: '',
                attendeeTags: [{
                    tagID: '',
                    tagName: ''
                }],
                parent: [],
                createParentMode: false
            }],
            editingRow: '',
            isLoading: true,
            fullscreenLoading: false,
            createAttendeeMode: false,
            originDataSource: [],
            pagination: {
                current: 1,
                pageSize: 10,
            },
            searchValue: ''
        };
    }

    private removeTag = (record: Attendee, tagID: string) => {        
        this.setState({isLoading: true});
        const attendeeID = record.attendeeTags[0].attendeeID;
        const attendeeIndex = record.key;
        const currentTags = this.props.data.attendees.data[attendeeIndex].relationships.field_attendee_tags.data;
        const updatedTags = currentTags.filter(currentTag => currentTag.id !== tagID);
        console.log("removeTag", attendeeID, updatedTags);
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
            .then((res:any) => {
                this.props.callMethod('fetchAttendees');
                if(res.status === 200) {
                    console.log("removeTags-refresh");
                    window.location.reload();
                }
            })
            .catch(catchError);
    };

    private addTag = (record: Attendee) => {
        this.props.toggleDrawer(true, record);
    };

    private updateAttendees = (attendeeID: string, newAttendee: newAttendee): void => {
        // console.log("save here", attendeeID, newAttendee)
        let modifiedNewAttendee:any = {
            "field_first_name": newAttendee.field_first_name,
            "field_full_name": newAttendee.field_full_name,
            "field_last_name": newAttendee.field_last_name,
            "field_gender": newAttendee.gender,
            "field_birth": newAttendee.birth,
            "field_death": newAttendee.death
        }
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
                    "attributes": modifiedNewAttendee
                }
            }
        })
            .then(res => {
                this.props.callMethod('fetchAttendees');
                // window.location.reload();
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
                console.log("save", newData, key, index);
                const updatedAttendee = newData[index];
                const newAttendee: newAttendee = {
                    field_first_name: updatedAttendee.firstName,
                    field_last_name: updatedAttendee.lastName,
                    gender: updatedAttendee.gender,
                    birth: updatedAttendee.birth,
                    death: updatedAttendee.death,
                    field_full_name: updatedAttendee.lastName ? `${updatedAttendee.firstName} ${updatedAttendee.lastName}` : updatedAttendee.firstName
                };
                
                this.updateAttendees(attendeeID, newAttendee);
                
            } else {
                newData.push(row);
                this.setState({dataSource: newData, editingRow: ''});
            }
        });
    }

    private createAttendeeNode = (title: string, firstName: string, lastName: string | undefined, userID: string, gender: string, birth: string, death: string): void => {
        console.log("createAttendeeNode");
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
                        "title": title,
                        "field_first_name": firstName,
                        "field_full_name": lastName ? `${firstName} ${lastName}` : firstName,
                        "field_last_name": lastName,
                        "field_gender": gender,
                        "field_birth": birth,
                        "field_death": death
                    },
                    "relationships": {
                        "uid": {
                            "data": {
                                "type": "user--user",
                                "id": userID
                            }
                        },
                        "field_event_reference": {
                            "data": {
                                "type": "node--event",
                                "id": this.props.data.parentEventData.eventID
                            }
                        }
                    }
                }
            }
        })
            .then(res => {
                this.props.callMethod('fetchAttendees');
                this.setState({
                    createAttendeeMode: false,
                    fullscreenLoading: false
                });
                console.log("res", res);
                // window.location.reload();
            })
            .catch(error => {
                this.props.callMethod('fetchAttendees');
                this.setState({
                    createAttendeeMode: false,
                    fullscreenLoading: false
                });
            });
    };

    private emailIsAlreadyRegistered = (): void => {
        message.error(intl.get('EMAIL_IS_ALREADY_REGISTERED'));
    };

    private createNewAttendee = (form: any, key: any): void => {
        form.validateFields((error: any, row: any) => {
            if (error) {
                return;
            }
            this.initiateRegister(row.email, row.firstName, row.lastName, row.gender, row.birth, row.death);
        });
    };

    edit(key: any) {
        this.setState({editingRow: key});
    }

    private initiateRegister = (enteredEmail: string, firstName: string, lastName: string, gender: string, birth: string, death: string): void => {
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
                    this.setState({fullscreenLoading: true});
                    this.registerUser(enteredEmail, firstName, lastName, gender, birth, death);
                } else {
                    this.emailIsAlreadyRegistered();
                }
            })
            .catch(catchError);
    };

    private registerUser = (enteredEmail: string, firstName: string, lastName: string, gender: string, birth: string, death: string): void => {
        axios({
            method: 'post',
            url: `${prodURL}/entity/user?_format=hal_json`,
            auth: {
                username: `${fetchUsername}`,
                password: `${fetchPassword}`
            },
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': this.props.data.XCSRFtoken
            },
            data: {
                "name": {"value": enteredEmail},
                "mail": {"value": enteredEmail}
            }
        })
            .then(res => {
                const userID = res.data.uuid[0].value;
                this.createAttendeeNode(enteredEmail, firstName, lastName, userID, gender, birth, death)
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
                gender: attendeeName.attributes.gender,
                birth: attendeeName.attributes.birth,
                death: attendeeName.attributes.death,
                attendeeTags: tags,
                parent: attendeeName.attributes.parent,
                createParentMode: false,
            }
        });
        this.setState({
            dataSource: attendeeData,
            isLoading: false,
            originDataSource: attendeeData
        })
    };

    private handleAdd = async () => {
        const {dataSource} = this.state;
        const newData = {
            key: -1,
            firstName: intl.get('#ENTER_FIRST_NAME#'),
            lastName: intl.get('#ENTER_LAST_NAME#'),
            email: intl.get('#ENTER_E-MAIL#'),
            gender: intl.get('#ENTER_GENDER#'),
            birth: intl.get('#ENTER_BIRTH#'),
            death: intl.get('#DEATH#'),
            attendeeTags: [],
            parent: [],
            createParentMode: false
        };

        await this.setState({
            dataSource: [...dataSource, newData],
            createAttendeeMode: true
        });

        await this.myRef.current!.click();
    };

    componentDidMount(): void {
        this.setDataSource();
        const elements = document.getElementsByClassName("ant-table-hide-scrollbar");
        const element = elements[0] as HTMLElement;
        element.style.overflow = "hidden";
        element.style.marginBottom = "0px";
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot ?: any): void {
        if (this.props.data.attendees !== prevProps.data.attendees) {
            this.setDataSource();
        }
    }    

    handleTableChange = (pagination:any, filters:any, sorter:any) => {
        // console.log("pagination", pagination);
        // console.log("sorter", sorter);
        // console.log("filters", filters, this.state.originDataSource);
        // console.log("handleTableChange", this.state.originDataSource);
        let data:any[] = this.state.originDataSource, newData:any[] = [];
        if(filters.gender && filters.gender.length) {            
            for (let i = 0; i < filters.gender.length; i++) {
                for(let j = 0; j < data.length; j++) {
                    if (data[j].gender === filters.gender[i]) {
                        newData.push(data[j]);
                    }
                }
            }            
        } else if(this.state.searchValue) {
            let value:string = this.state.searchValue;
            for(let i = 0; i < data.length; i++) {
                if (data[i].firstName && data[i].firstName.indexOf(value) !== -1) {
                    newData.push(data[i]);
                } 
                else if (data[i].lastName && data[i].lastName.indexOf(value) !== -1) {
                    newData.push(data[i]);
                } 
                else if (data[i].email && data[i].email.indexOf(value) !== -1) {
                    newData.push(data[i]);
                }
                else {
                    continue;
                }
            }
        } else {
            newData = data;
        }
        this.setState({
            dataSource: newData,
            pagination: {
                current: pagination.current,
                pageSize: pagination.pageSize
            }
        });
    };

    handleChange = (value:any) => {
        this.setState({
            pagination: {
                current: 1,
                pageSize: parseInt(value)
            }
        });
    }

    onChangeSearch = (value:any) => {
        let data:any[] = this.state.originDataSource, newData:any[] = [];
        for(let i = 0; i < data.length; i++) {
            if (data[i].firstName && data[i].firstName.indexOf(value) !== -1) {
                newData.push(data[i]);
            } 
            else if (data[i].lastName && data[i].lastName.indexOf(value) !== -1) {
                newData.push(data[i]);
            } 
            else if (data[i].email && data[i].email.indexOf(value) !== -1) {
                newData.push(data[i]);
            }
            else {
                continue;
            }
        }
        this.setState({
            dataSource: newData,
            searchValue: value
        });
    }

    render() {
        const {createAttendeeMode} = this.state;

        let tagPosition = 0;

        const columnsBlueprint: Columns[] = [
            {
                title: (text: any, record: any) => {
                    if (createAttendeeMode) {
                        return intl.get('EDIT')
                    } else {
                        return (
                            <Popover content={intl.get('ADD_ATTENDEE')} placement="left">
                                <Icon type="usergroup-add" theme="outlined" onClick={this.handleAdd}
                                      style={{fontSize: '22px', color: 'rgba(176,31,95,1)'}}/>
                            </Popover>
                        )
                    }
                },
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
                                        > {intl.get('SAVE')} </a>)}
                                </EditableContext.Consumer>

                                <Popconfirm title={intl.get('CANCEL?')}
                                            onConfirm={() => this.cancel(record.key)}><a> {intl.get('CANCEL')} </a></Popconfirm>
                            </span>)
                            :
                            (<div disabled={editingRow !== ''}
                                  ref={this.myRef}
                                  onClick={() => this.edit(record.key)}>
                                <Popover content={intl.get('EDIT')} placement="left">
                                    <Icon type="user-add" theme="outlined"
                                          style={{fontSize: '18px', color: 'rgba(176,31,95,1)'}}/>
                                </Popover>
                            </div>);
                    }
                    return editable ?
                        (<span>
                            <EditableContext.Consumer>
                                {(form: any) => (
                                    <a
                                        onClick={() => this.save(form, record.key)}
                                        style={{marginRight: 8}}
                                    > {intl.get('SAVE')} </a>)}
                            </EditableContext.Consumer>

                            <Popconfirm title={intl.get('CANCEL?')}
                                        onConfirm={() => this.cancel(record.key)}><a> {intl.get('CANCEL')} </a></Popconfirm>
                        </span>)
                        :
                        (<div disabled={editingRow !== ''} onClick={() => this.edit(record.key)}>
                            <Popover content={intl.get('EDIT')} placement="left">
                                <Icon type="edit" theme="outlined"
                                      style={{fontSize: '18px', color: 'rgba(176,31,95,1)'}}/>
                            </Popover>
                        </div>);
                },
            },
            {
                title: intl.get('FIRST_NAME'),
                dataIndex: 'firstName',
                key: 'firstName',
                editable: true,
                sorter: (a, b) => {
                    a = a.firstName || 'zzz';
                    b = b.firstName || 'zzz';
                    return a.localeCompare(b);
                },
                sortDirections: ['ascend', 'descend'],
            },
            {
                title: intl.get('LAST_NAME'),
                dataIndex: 'lastName',
                key: 'lastName',
                editable: true,
                defaultSortOrder: 'ascend',
                sorter: (a, b) => {
                    a = a.lastName || 'zzz';
                    b = b.lastName || 'zzz';
                    return a.localeCompare(b);
                },
                sortDirections: ['ascend', 'descend'],
            },
            {
                title: intl.get('GENDER'),
                dataIndex: 'gender',
                key: 'gender',
                editable: true,
                filters: [
                    { text: 'Male', value: 'M' },
                    { text: 'Female', value: 'F' },
                ],
            },
            {
                title: intl.get('BIRTH'),
                dataIndex: 'birth',
                key: 'birth',
                editable: true,
                defaultSortOrder: 'ascend',
                sorter: (a, b) => {
                    a = a.lastName || 'zzz';
                    b = b.lastName || 'zzz';
                    return a.localeCompare(b);
                },
                sortDirections: ['ascend', 'descend'],
            },
            {
                title: intl.get('DEATH'),
                dataIndex: 'death',
                key: 'death',
                editable: true,
                defaultSortOrder: 'ascend',
                sorter: (a, b) => {
                    a = a.lastName || 'zzz';
                    b = b.lastName || 'zzz';
                    return a.localeCompare(b);
                },
                sortDirections: ['ascend', 'descend'],
            },
            {
                title: intl.get('EMAIL'),
                dataIndex: 'email',
                key: 'email',
                editable: createAttendeeMode,
                sorter: (a, b) => {
                    a = a.email || 'zzz';
                    b = b.email || 'zzz';
                    return a.localeCompare(b);
                },
                sortDirections: ['ascend', 'descend'],
            }, 
            {
                title: intl.get('ATTENDEE_TAGS'),
                dataIndex: 'attendeeTags',
                key: 'attendeeTags',
                editable: false,
                render: (tags, record, index) => {
                    if (record.key === -1) {
                        return (
                            <div>{intl.get('CREATE_NEW_ATTENDEE_BEFORE_TAGS')}</div>
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
                            <Icon type="plus"/> {intl.get('ADD_TAG')}
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
        
        const expandedRowRender = (dataSource:any) => {            
            console.log("expandedRowRender", dataSource);
            return (
                <EditableFormTable 
                    propsData={dataSource} 
                    XCSRFtoken={this.props.data.XCSRFtoken}
                    parentEventData={this.props.data.parentEventData}
                />
            );
        };

        return (
            this.state.fullscreenLoading ?
                <LoaderWrapper>
                    <LoaderComponent/>
                </LoaderWrapper>
                :
                <React.Fragment>
                    <EditableContext.Provider value={this.props.form}>
                        <div style={{width: "25%", marginLeft: "74%", marginTop: "-35px", marginBottom: "10px"}}>
                            <SearchBar
                                value={this.state.searchValue}
                                onChange={(newValue) => this.onChangeSearch(newValue)}
                                onCancelSearch={() => this.setState({searchValue: '', dataSource: this.state.originDataSource})}
                            />
                        </div>
                        <Table<Attendee>
                            components={components}
                            bordered
                            dataSource={this.state.dataSource}
                            columns={columns}
                            // @ts-ignore
                            rowClassName="editable-row"
                            // pagination={{
                            //     onChange: this.cancel,
                            // }}
                            pagination={this.state.pagination}
                            onChange={this.handleTableChange}
                            expandedRowRender={expandedRowRender}
                            scroll={{ y: 600 }}
                            id="parent-table"
                        />
                        <div style={{textAlign: "right", marginTop: "-47px"}}>
                            <Select defaultValue="10" style={{ width: 120 }} onChange={this.handleChange}>
                                <Option value="10">10 / page</Option>
                                <Option value="20">20 / page</Option>
                                <Option value="50">50 / page</Option>
                                <Option value="100">100 / page</Option>
                            </Select>
                        </div>
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
