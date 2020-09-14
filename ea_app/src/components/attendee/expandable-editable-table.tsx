import React, {PureComponent} from 'react';

import {
    Form, Input, InputNumber, Popconfirm, Spin, 
    Table, Tag, Popover, message, Icon, Select
} from 'antd';
import {FormComponentProps} from 'antd/es/form';
import { defaultProps } from 'antd-mobile/lib/search-bar/PropsType';
import axios from "axios";
import {fetchPassword, fetchUsername, prodURL} from "../../shared/keys";
import {RootState} from "../../store/store";
import {DataState} from "../../store/data/reducer";
import {ViewState} from "../../store/view/reducer";
import {catchError} from "../../shared/common-methods";
import intl from "react-intl-universal";
import {callMethod} from "../../store/view/actions";

// @ts-ignore
const EditableContext = React.createContext();
// // @ts-ignore
// const EditableRow = ({form, index, ...props}) => (
//   <EditableContext.Provider value={form}>
//       <tr {...props} />
//   </EditableContext.Provider>
// );
// const EditableFormRow = Form.create()(EditableRow);

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
      return <InputNumber />;
    }
    return <Input />;
  };

  renderCell = ({ getFieldDecorator }: any) => {
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
          <Form.Item style={{ margin: 0 }}>
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
  // callMethod(method: string): void;
  propsData: any[];
  XCSRFtoken: string;
  parentEventData: any;
}

const mapStateToProps = ({data, view}: RootState): { data: DataState, view: ViewState } => ({data, view});

type Props = OwnProps & ReturnType<typeof mapStateToProps>;

// interface OwnProps {
//   propsData: any[];
// }

// type Props = OwnProps & FormComponentProps;

type State = Readonly<{
  data: any[];
  editingKey: string;
}>;

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      disabled?: boolean;
  }
}

class EditableTable extends PureComponent<Props, State> {

  static defaultProps: Partial<Props> = {
    propsData: [],
    XCSRFtoken: ''
  }  

  constructor(props: Props) {
    super(props);
    this.state = { data: [], editingKey: '' };    
  }

  componentDidMount() {
    const data:any[] = [];
    let dataSource:any = this.props.propsData;
    for (let i = 0; i < dataSource.parent.length; ++i) {
      data.push({
          key: i,
          pntFName: dataSource.parent[i].fname,
          pntLName: dataSource.parent[i].lname,
          pntGender: dataSource.parent[i].gender,
          pntBirth: dataSource.parent[i].birth,
          pntDeath: dataSource.parent[i].death,
          pntEmail: dataSource.parent[i].email,
          pntId: dataSource.parent[i].id,
      });
    }
    this.setState({
      data: data,
    });    
  }

  private createParentData = (createData:any): void => {
    console.log("createData", createData);
    this.initiateRegister(createData.pntEmail, createData.pntFName, createData.pntLName, createData.pntGender, createData.pntBirth, createData.pntDeath);
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
                this.registerUser(enteredEmail, firstName, lastName, gender, birth, death);
            } else {
                this.emailIsAlreadyRegistered();
            }
        })
        .catch(catchError);
  };

  private emailIsAlreadyRegistered = (): void => {
    message.error(intl.get('EMAIL_IS_ALREADY_REGISTERED'));
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
            'X-CSRF-Token': this.props.XCSRFtoken
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

  private createAttendeeNode = (title: string, firstName: string, lastName: string | undefined, userID: string, gender: string, birth: string, death: string): void => {
    console.log("createAttendeeNode", userID);
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
            'X-CSRF-Token': this.props.XCSRFtoken
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
                            "id": this.props.parentEventData.eventID
                        }
                    }
                }
            }
        }
    })
        .then(res => {
            callMethod('fetchAttendees');
            console.log("res", res);
            // window.location.reload();
        })
        .catch(error => {
            callMethod('fetchAttendees');
        });
  };

  private updateParentData = (updateData: any): void => {
    // console.log("save here", attendeeID, newAttendee)
    const attendeeID:any = updateData.pntId
    let modifiedNewAttendee:any = {
        "field_first_name": updateData.pntFName,
        "field_full_name": updateData.pntFName + " " + updateData.pntLName,
        "field_last_name": updateData.pntLName,
        "field_gender": updateData.pntGender,
        "field_birth": updateData.pntBirth,
        "field_death": updateData.pntDeath
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
            'X-CSRF-Token': this.props.XCSRFtoken
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
            callMethod('fetchAttendees')            
        })
        .catch(catchError);
  };

  isEditing = (record:any) => record.key === this.state.editingKey;

  cancel = () => {
    let data:any[] = [];
    for (let i = 0; i < this.state.data.length; i++) {
      if (this.state.data[i].pntId != "") {
        data.push(this.state.data[i]);
      }
    }
    this.setState({ editingKey: '', data: data });
  };

  save(form:any, key:any) {
    form.validateFields((error:any, row:any) => {
      if (error) {
        return;
      }
      const newData = [...this.state.data];
      const index = newData.findIndex(item => key === item.key);
      if (newData[index].pntId === "") {        
        const item = newData[index];
        newData.splice(index, 1, {
          ...item,
          ...row,
        });
        this.createParentData(row);
        this.setState({ data: newData, editingKey: '' });
      } else {
        if (index > -1) {
          const item = newData[index];
          newData.splice(index, 1, {
            ...item,
            ...row,
          });
          console.log("updatedParentData", newData, key);
          this.updateParentData(newData[key]);
          this.setState({ data: newData, editingKey: '' });
        } else {
          newData.push(row);
          this.setState({ data: newData, editingKey: '' });
        }
      }      
    });
  }

  edit(key:any) {
    console.log("editParentItem", key);
    this.setState({ editingKey: key });
  }

  addParentItem() {
    console.log("addParentItem", this.state.data);
    let data:any[] = this.state.data;
    let item:any = {
      key: data.length.toString(),
      pntBirth: '',
      pntDeath: '',
      pntEmail: '',
      pntFName: '',
      pntLName: '',
      pntId: '',
      pntGender: ''
    };
    data.push(item);
    this.setState({
      data: data,
      editingKey: (data.length-1).toString()
    })
  }

  render() {
    const components:any = {
      body: {
        cell: EditableCell,
      },
    };

    const columns_cus:any[] = [
      {
        title: () => {
          return (
              <Icon 
                  type="usergroup-add" 
                  theme="outlined" 
                  onClick={()=>this.addParentItem()}
                  style={{fontSize: '22px', color: 'rgba(176,31,95,1)'}}
              />
          )
        },
        // title: (text: any, record: any) => {
        //   if (createAttendeeMode) {
        //       return intl.get('EDIT')
        //   } else {
        //       return (
        //           <Popover content={intl.get('ADD_ATTENDEE')} placement="left">
        //               <Icon type="usergroup-add" theme="outlined" onClick={this.handleAdd}
        //                     style={{fontSize: '22px', color: 'rgba(176,31,95,1)'}}/>
        //           </Popover>
        //       )
        //   }
        // },
        dataIndex: 'operation',
        render: (text:any, record:any) => {
          const { editingKey } = this.state;
          const editable = this.isEditing(record);
          return editable ? (
            <span>
              <EditableContext.Consumer>
                {form => (
                  <a
                    onClick={() => this.save(form, record.key)}
                    style={{ marginRight: 8 }}
                  >
                    Save
                  </a>
                )}
              </EditableContext.Consumer>
              <Popconfirm title="Sure to cancel?" onConfirm={() => this.cancel(/*record.key*/)}>
                <a>Cancel</a>
              </Popconfirm>
            </span>
          ) : (
            <a disabled={editingKey !== ''} onClick={() => this.edit(record.key)}>
              <Icon 
                type="edit"
                theme="outlined" 
                onClick={()=>console.log("edit parent data")}
                style={{fontSize: '22px', color: 'rgba(176,31,95,1)'}}
              />
            </a>
          );
        },
      },
      { title: 'First Name', dataIndex: 'pntFName', editable: true, key: 'pntFName' },
      { title: 'Last Name', dataIndex: 'pntLName', editable: true, key: 'pntLName' },
      { title: 'Gender', key: 'pntGender', editable: true, dataIndex: 'pntGender' },
      { title: 'Birth', dataIndex: 'pntBirth', editable: true, key: 'pntBirth' },
      { title: 'Death', dataIndex: 'pntDeath', editable: true, key: 'pntDeath' },
      { title: 'Email', dataIndex: 'pntEmail', editable: true, key: 'pntEmail' },
    ];

    const columns = columns_cus.map(col => {
      if (!col.editable) {
        return col;
      }
      return {
        ...col,
        onCell: (record:any) => ({
          record,
          inputType: col.dataIndex === 'age' ? 'number' : 'text',
          dataIndex: col.dataIndex,
          title: col.title,
          editing: this.isEditing(record),
        }),
      };
    });   

    return (
      <EditableContext.Provider value={this.props.form}>
        <Table
          components={components}
          bordered
          dataSource={this.state.data}
          columns={columns}
          // @ts-ignore
          rowClassName="editable-row"
          pagination={false}
          id="expandable-table"
        />
      </EditableContext.Provider>
    );
  }
}

export default Form.create<Props>()(EditableTable);