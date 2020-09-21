import React, {AriaAttributes, DOMAttributes, PureComponent, createRef, createElement} from 'react';
import {connect} from 'react-redux';
import {RootState} from "../../store/store";
import {fetchPassword, fetchUsername, prodURL} from "../../shared/keys";
import axios from "axios";

import {DataState} from "../../store/data/reducer";
import {setAttendees, setEventTags} from "../../store/data/actions";
import {callMethod, toggleDrawer} from "../../store/view/actions";

import {
    Form, Input, InputNumber, Popconfirm, Spin, 
    Table, Tag, Popover, message, Icon, Select, Button, DatePicker
} from 'antd';
import Highlighter from 'react-highlight-words';
import {FormComponentProps} from 'antd/es/form';
import DrawerTagsComponent from "./drawer-tags-component"
import {ViewState} from "../../store/view/reducer";
import {catchError} from "../../shared/common-methods";
import LoaderComponent from "../loader-component";
import styled from "styled-components";
import intl from "react-intl-universal";
import moment from 'moment';

// import SearchBar from "material-ui-search-bar";
// import { filter } from 'lodash';

// import EditableFormTable from './expandable-editable-table';
import EditableFormTable from './dropdown-paremt-item';
import { RestaurantRounded } from '@material-ui/icons';

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
    searchText: string;
    searchedColumn: string;
    submitFatherID: string;
    submitMotherID: string;
    newCreateBirth: string;
    newCreaetDeath: string;
    newCreateGender: string;
    expandedRowKeys: any[];
}>;

declare module 'react' {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
        disabled?: boolean;
    }
}

const spinIcon = <Icon type="loading" style={{fontSize: 6, marginLeft: 7, marginRight: 5, verticalAlign: 3}} spin/>;

class AttendeeComponent extends PureComponent<Props, State> {
    readonly myRef: React.RefObject<HTMLDivElement>;
    searchInput: any;

    constructor(props: Props) {
        super(props);

        this.myRef = createRef<HTMLDivElement>();
        this.searchInput = HTMLInputElement;

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
                pageSize: 50,
            },
            searchValue: '',
            searchText: '',
            searchedColumn: '',
            submitFatherID: '',
            submitMotherID: '',
            newCreateBirth: '',
            newCreaetDeath: '',
            newCreateGender: 'M',
            expandedRowKeys: [],
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
        let fatherID = this.state.submitFatherID, motherID = this.state.submitMotherID, parentData:any[] = [];
        if (fatherID !== "") {
            parentData.push(
                {
                    "type": "node--attendee",
                    "id": fatherID,
                    "meta": {
                    "tid": 497
                    }
                }
            )
        }
        if (motherID !== "") {
            parentData.push(
                {
                    "type": "node--attendee",
                    "id": motherID,
                    "meta": {
                    "tid": 497
                    }
                }
            )
        }
        console.log("parentData", parentData);
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
                    "attributes": modifiedNewAttendee,
                    "relationships": {
                        "field_parents": {
                            "data": parentData
                        }
                    }
                }
            }
        })
            .then(res => {
                this.props.callMethod('fetchAttendees');
                // window.location.reload();
                let originData:any[] = this.state.dataSource;
                let index = parseInt(window.localStorage.getItem("cntUpdatedIndex") || "-1");
                if(index > -1) {
                    let newParent:any[] = [];
                    for (let i = 0; i < parentData.length; i++) {
                        let id = parentData[i].id;
                        for (let j = 0; j < originData.length; j++) {
                            if (id === originData[j].id) {
                                let newParentItem:any = {
                                    birth: originData[j].birth,
                                    death: originData[j].death,
                                    email: originData[j].email,
                                    fname: originData[j].firstName,
                                    gender: originData[j].gender,
                                    id: id,
                                    lname: originData[j].lastName
                                }
                                newParent.push(newParentItem);
                            }
                        }
                    }
                    originData[index].parent = newParent;
                }
                this.setState({dataSource: originData, originDataSource: originData});
                console.log("updatedData", originData[index]);
                alert(newAttendee.field_first_name + "'s data was updated successfully!");
            })
            .catch(
                catchError => {
                    alert("There is some error to update " + newAttendee.field_first_name + "'s data.")
                }
            );
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
                const updatedAttendee = newData[index];
                console.log("updatedAttendee", updatedAttendee, index);
                window.localStorage.setItem("cntUpdatedIndex", index.toString());
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
                let newData:any = {
                    key: this.state.originDataSource.length,
                    firstName: firstName,
                    lastName: lastName,
                    email: title,
                    gender: gender,
                    birth: birth,
                    death: death,
                    attendeeTags: [],
                    parent: [],
                    createParentMode: false
                };
                let data:any[] = this.state.originDataSource;
                data.push(newData);
                this.setState({
                    createAttendeeMode: false,
                    fullscreenLoading: false,
                    dataSource: data,
                    editingRow: ''
                });
                this.props.callMethod('fetchAttendees');
                alert(firstName + "'s data was created newly!");
                // window.location.reload();
            })
            .catch(error => {          
                let newData:any = {
                    key: this.state.originDataSource.length,
                    firstName: firstName,
                    lastName: lastName,
                    email: title,
                    gender: gender,
                    birth: birth,
                    death: death,
                    attendeeTags: [],
                    parent: [],
                    createParentMode: false
                };
                let data:any[] = this.state.originDataSource;
                data.push(newData);
                this.setState({
                    createAttendeeMode: false,
                    fullscreenLoading: false,
                    dataSource: data,
                    editingRow: ''
                });
                this.props.callMethod('fetchAttendees');
                // alert("There is some error to create " + firstName + "'s data.")
            });
    };

    private emailIsAlreadyRegistered = (): void => {
        message.error(intl.get('EMAIL_IS_ALREADY_REGISTERED'));
    };

    private createNewAttendee = (form: any, key: any): void => {        
        form.validateFields((error: any, row: any) => {
            console.log("createNew", key, row, this.state.newCreateBirth, this.state.newCreaetDeath, this.state.newCreateGender);
            // return;
            if (error) {
                console.log("error", error, "493-line")
                return;
            }
            this.initiateRegister(row.email, row.firstName, row.lastName, this.state.newCreateGender, this.state.newCreateBirth, this.state.newCreaetDeath);
        });
    };

    edit(key: any) {
        let cntItem = this.state.originDataSource[key], fatherID = "", motherID = "";
        if(key>-1) {
            if (cntItem.parent.length) {
                for (let i = 0; i < cntItem.parent.length; i++) {
                    if (cntItem.parent[i].gender === "M") {
                        fatherID = cntItem.parent[i].id;
                    } else {
                        motherID = cntItem.parent[i].id;
                    }
                }
            }
        }
        let expandedRows:any[] = this.state.expandedRowKeys;
        expandedRows.push(key);
        console.log("edit", cntItem, key, expandedRows);
        this.setState({
            editingRow: key,
            submitFatherID: fatherID,
            submitMotherID: motherID,
            expandedRowKeys: expandedRows
        });
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
                    // this.emailIsAlreadyRegistered();
                    // console.log("res", res.data);
                    // const userID = res.data.uuid[0].value;
                    const userID = res.data.data[0].id;
                    this.createAttendeeNode(enteredEmail, firstName, lastName, userID, gender, birth, death)
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
                id: attendeeName.attributes.id,
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
        document.getElementsByClassName("ant-table-body")[0].scrollTop = 0;
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
        if(element) {
            element.style.overflow = "hidden";
            element.style.marginBottom = "0px";
        }
        const svgs = document.getElementsByTagName("svg");
        for(let i = 0; i < svgs.length; i++) {
            let svg = svgs[i] as SVGElement;
            if (svg.dataset.icon === "filter") {
                svg.style.color = "white";
            }
        }
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

    getColumnSearchProps = (dataIndex:any) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }:any) => (
          <div style={{ padding: 8 }}>
            <Input
              ref={(node:any) => {
                this.searchInput = node;
              }}
              placeholder={`Search ${dataIndex}`}
              value={selectedKeys[0]}
              onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
              onPressEnter={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
              style={{ width: 188, marginBottom: 8, display: 'block' }}
            />
            <Button
              type="primary"
              onClick={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
              icon="search"
              size="small"
              style={{ width: 90, marginRight: 8 }}
            >
              Search
            </Button>
            <Button onClick={() => this.handleReset(clearFilters)} size="small" style={{ width: 90 }}>
              Reset
            </Button>
          </div>
        ),
        filterIcon: (filtered:any) => (
          <Icon type="search" style={{ color: filtered ? 'white' : 'white' }} />
        ),
        onFilter: (value:any, record:any[]) => (record[dataIndex]) ? 
          record[dataIndex]
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase()) : false,
        onFilterDropdownVisibleChange: (visible:any) => {
          if (visible) {
            setTimeout(() => this.searchInput.select());
          }
        },
        render: (text:any) =>
          this.state.searchedColumn === dataIndex ? (
            <Highlighter
              highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
              searchWords={[this.state.searchText]}
              autoEscape
              textToHighlight={(text) ? text.toString() : ""}
            />
          ) : (
            text
          ),
    });

    handleSearch = (selectedKeys:any, confirm:any, dataIndex:any) => {
        confirm();
        this.setState({
          searchText: selectedKeys[0],
          searchedColumn: dataIndex,
        });
    };

    handleReset = (clearFilters:any) => {
        clearFilters();
        this.setState({ searchText: '' });
    };

    onDatePickerBirth = (date:any, dateString:any) => {
        let data = this.state.dataSource, index = parseInt(this.state.editingRow);
        if(index>-1) {
            data[index].birth = dateString;
            this.setState({dataSource:data});
        } else {
            this.setState({newCreateBirth: dateString});
        }
    }

    onDatePickerDeath = (date:any, dateString:any) => {
        let data = this.state.dataSource, index = parseInt(this.state.editingRow);
        if(index>-1) {
            data[index].death = dateString;
            this.setState({dataSource:data});
        } else {
            this.setState({newCreaetDeath: dateString});
        }
    }

    onGenderChange = (value:string) => {
        let data = this.state.dataSource, index = parseInt(this.state.editingRow);
        if(index>-1) {
            data[index].gender = value;
            this.setState({dataSource:data});
        } else {
            this.setState({newCreateGender: value});
        }
    }

    updateSubmitFatherID = (id:string) => {
        this.setState({submitFatherID: id});
    }
    
    updateSubmitMotherID = (id:string) => {
        this.setState({submitMotherID: id});
    }

    onExpandRow = (expanded:boolean, record:any) => {
        console.log("onExpandRow", expanded, record);
        let expandedRows:any[] = this.state.expandedRowKeys;
        if(expanded) {
            expandedRows.push(record.key);
        } else {
            const index = expandedRows.indexOf(record.key);
            if (index > -1) {
                expandedRows.splice(index, 1);
            }
        }
        console.log("expandedRowsKey", expandedRows)
        this.setState({
            expandedRowKeys: expandedRows
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
                width: 80,
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
                ...this.getColumnSearchProps('firstName'),
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
                ...this.getColumnSearchProps('lastName'),
            },
            {
                // title: intl.get('GENDER'),
                title: "M/F",
                dataIndex: 'gender',
                key: 'gender',
                width: 85,
                // editable: true,
                filters: [
                    { text: 'Male', value: 'M' },
                    { text: 'Female', value: 'F' },
                ],
                render: (text:any, record:any) => {
                    const {editingRow} = this.state;
                    return editingRow === record.key ? (
                        <Select defaultValue={text ? text : "M"} style={{ width: "100%" }} onChange={this.onGenderChange}>
                            <Option value="M">M</Option>
                            <Option value="F">F</Option>
                        </Select>
                    ) : (
                        <div>{text}</div>
                    );
                },  
            },
            {
                title: intl.get('BIRTH'),
                dataIndex: 'birth',
                key: 'birth',
                // editable: true,                
                defaultSortOrder: 'ascend',
                sorter: (a, b) => {
                    a = a.lastName || 'zzz';
                    b = b.lastName || 'zzz';
                    return a.localeCompare(b);
                },
                sortDirections: ['ascend', 'descend'],
                ...this.getColumnSearchProps('birth'),
                render: (text:any, record:any) => {
                    const {editingRow} = this.state;
                    if(text) {
                        return editingRow === record.key ? (                        
                            <DatePicker 
                                onChange={this.onDatePickerBirth} 
                                defaultValue={moment(`${text}`, 'YYYY-MM-DD')}
                            />
                        ) : (
                            <div>{text}</div>
                        );
                    }
                    return editingRow === record.key ? (                        
                        <DatePicker 
                            onChange={this.onDatePickerBirth}
                        />
                    ) : (
                        <div>{text}</div>
                    );
                },
            },
            {
                title: intl.get('DEATH'),
                dataIndex: 'death',
                key: 'death',
                // editable: true,
                defaultSortOrder: 'ascend',
                sorter: (a, b) => {
                    a = a.lastName || 'zzz';
                    b = b.lastName || 'zzz';
                    return a.localeCompare(b);
                },
                sortDirections: ['ascend', 'descend'],
                ...this.getColumnSearchProps('death'),
                render: (text:any, record:any) => {
                    const {editingRow} = this.state;
                    if(text) {
                        return editingRow === record.key ? (
                            <DatePicker 
                                onChange={this.onDatePickerDeath} 
                                defaultValue={moment(`${text}`, 'YYYY-MM-DD')}
                            />
                        ) : (
                            <div>{text}</div>
                        );
                    }
                    return editingRow === record.key ? (
                        <DatePicker 
                            onChange={this.onDatePickerDeath}
                        />
                    ) : (
                        <div>{text}</div>
                    );
                },
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
                ...this.getColumnSearchProps('email'),
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
        
        const expandedRowRender = (record:any, index:any, indent:any, expanded:any) => {
            console.log("expandableRowRender", record, index, indent, expanded);
            return (
                <EditableFormTable 
                    // propsData={dataSource}
                    currentData={record}
                    propsData={this.state.originDataSource} 
                    XCSRFtoken={this.props.data.XCSRFtoken}
                    parentEventData={this.props.data.parentEventData}
                    editingRow={this.state.editingRow}
                    rootRecord={record.key}
                    updateFatherID={this.updateSubmitFatherID}
                    updateMotherID={this.updateSubmitMotherID}
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
                        {/* <div style={{width: "25%", marginLeft: "74%", marginTop: "-35px", marginBottom: "10px"}}>
                            <SearchBar
                                value={this.state.searchValue}
                                onChange={(newValue) => this.onChangeSearch(newValue)}
                                onCancelSearch={() => this.setState({searchValue: '', dataSource: this.state.originDataSource})}
                            />
                        </div> */}
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
                            // defaultExpandAllRows={false}
                            // defaultExpandedRowKeys={[1]}
                            // expandedRowKeys={this.state.expandedRowKeys}
                            // onExpand={this.onExpandRow}
                            // onExpandedRowsChange={(expandedRows)=>{console.log("expandedRows", expandedRows)}}
                            scroll={{ y: 600 }}
                            id="parent-table"
                        />
                        <div style={{textAlign: "right", marginTop: "-47px"}}>
                            <Select defaultValue={"50 / page"} style={{ width: 120 }} onChange={this.handleChange}>
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
