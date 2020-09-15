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
import { AutoComplete } from 'antd';

// @ts-ignore
const EditableContext = React.createContext();

interface EditableCellProps extends FormComponentProps {
  editing?: boolean;
  dataIndex?: any;
  title?: string;
  inputType?: string;
  record?: any;
  index?: number;
  width?: number;
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
  propsData: any[];
  XCSRFtoken: string;
  parentEventData: any;
  currentData: any;
  callMethod(method: string): void;
}

const mapStateToProps = ({data, view}: RootState): { data: DataState, view: ViewState } => ({data, view});

type Props = OwnProps & ReturnType<typeof mapStateToProps>;

type State = Readonly<{
  data: any[];
  editingKey?: string;
  pntInfos: any[];
  totalDataSource: any[];
  willSubmitData: any;
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
    this.state = {
        data: [
            {
                key: 1,
                father: "",
                mother: "",
            },
        ], 
        pntInfos: [],
        totalDataSource: [],
        willSubmitData: {
            rootData: props.currentData,
            fatherID: "",
            motherID: "",
        }
    };   
  }

  componentDidMount() {
    let pntInfosData:any[] = [];
    let dataSource:any[] = this.props.propsData;    
    for(let i = 1; i <= dataSource.length; i++) {
        pntInfosData.push(i + ": " + dataSource[i-1].firstName + " " + dataSource[i-1].lastName + " " + dataSource[i-1].birth);
    }
    this.setState({pntInfos: pntInfosData, totalDataSource: dataSource});
  }

  onSelectFather = (value: any) => {    
    let index = parseInt(value.split(":")[0])-1;
    let id = this.state.totalDataSource[index].id;
    let willSubmitData = this.state.willSubmitData;
    this.setState({
        willSubmitData: {
            rootData: willSubmitData.rootData,
            fatherID: id,
            motherID: willSubmitData.motherID,
        }
    });
  }

  onSelectMother = (value: any) => {
    let index = parseInt(value.split(":")[0])-1;
    let id = this.state.totalDataSource[index].id;
    let willSubmitData = this.state.willSubmitData;
    this.setState({
        willSubmitData: {
            rootData: willSubmitData.rootData,
            fatherID: willSubmitData.fatherID,
            motherID: id,
        }
    });
  }

//   submitData = () => {
//       console.log("submitData", this.state.willSubmitData);
//       this.updateAttendees(this.state.willSubmitData)
//   }

  submitData = (): void => {
    console.log("submitData", this.state.willSubmitData);
    let data = this.state.willSubmitData;
    let parentData:any[] = [];
    if(data.fatherID !== "") {
        parentData.push({
            "type": "node--attendee",
            "id": data.fatherID,
            "meta": {
              "tid": 497
            }
        })
    }
    if(data.motherID !== "") {
        parentData.push({
            "type": "node--attendee",
            "id": data.motherID,
            "meta": {
              "tid": 497
            }
        })
    }
    let attributes:any = {
        "field_first_name": data.rootData.firstName,
        "field_full_name": data.rootData.firstName + " " + data.rootData.lastName,
        "field_last_name": data.rootData.lastName,
        "field_gender": data.rootData.gender,
        "field_birth": data.rootData.birth,
        "field_death": data.rootData.death
    }
    axios({
        method: 'patch',
        url: `${prodURL}/jsonapi/node/attendee/${data.rootData.id}`,
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
                "id": data.rootData.id,
                "attributes": attributes,
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
        })
        .catch(catchError);
  };

  render() {
    const components:any = {
      body: {
        cell: EditableCell,
      },
    };

    const columns_cus:any[] = [
      { 
        title: "Father", 
        dataIndex: 'father',
        key: 'father',
        render: () => {
            return (
                <AutoComplete
                    // style={{ width: 200 }}
                    dataSource={this.state.pntInfos}
                    placeholder="try to type `b`"
                    filterOption={(inputValue:any, option:any) =>
                        option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                    }
                    onSelect={this.onSelectFather}
                />
            )
        },
      },
      { 
        title: "Mother", 
        dataIndex: 'mother',
        key: 'mother',
        render: () => {
            return (
                <AutoComplete
                    // style={{ width: 200 }}
                    dataSource={this.state.pntInfos}
                    placeholder="try to type `b`"
                    filterOption={(inputValue:any, option:any) =>
                        option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                    }
                    onSelect={this.onSelectMother}
                />
            )
        },
      },
      {
        title: "Action",
        dataIndex: 'operation',
        render: () => {
            return(
                <div style={{cursor: "pointor"}} onClick={this.submitData}>Save</div>
            )
        }
      }
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