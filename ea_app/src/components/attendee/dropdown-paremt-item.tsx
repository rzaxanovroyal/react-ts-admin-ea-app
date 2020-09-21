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
  editingRow: string;
  rootRecord: string;
  updateFatherID(id: string): void;
  updateMotherID(id: string): void;
  callMethod(method: string): void;
}

const mapStateToProps = ({data, view}: RootState): { data: DataState, view: ViewState } => ({data, view});

type Props = OwnProps & ReturnType<typeof mapStateToProps>;

type State = Readonly<{
  data: any[];
  editingKey?: string;
  pntInfos: any[];
  fatherInfos: any[];
  fatherIDs: any[];
  motherInfos: any[];
  motherIDs: any[];
  totalDataSource: any[];
  willSubmitData: any;
  fatherValue: string;
  motherValue: string;
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
        fatherInfos: [],
        fatherIDs: [],
        motherInfos: [],
        motherIDs: [],
        fatherValue: "",
        motherValue: "",
        totalDataSource: [],
        willSubmitData: {
            rootData: props.currentData,
            fatherID: "",
            motherID: "",
        }
    };   
  }

  componentDidMount() {
    let currentRootData = this.state.willSubmitData;
    if(currentRootData.rootData.parent.length) {
        for (let i = 0; i < currentRootData.rootData.parent.length; i++) {
            let item = currentRootData.rootData.parent[i];
            if(item.gender === "M") {
                let fatherData = item.fname + " " + item.lname + " (" + item.birth + ")";
                let willSubmitData = this.state.willSubmitData;
                this.setState({
                  fatherValue: fatherData,
                  willSubmitData: {
                    rootData: willSubmitData.rootData,
                    fatherID: item.id,
                    motherID: willSubmitData.motherID,
                  }
                });
            }
            if(item.gender === "F") {
                let motherData = item.fname + " " + item.lname + " (" + item.birth + ")";
                let willSubmitData = this.state.willSubmitData;
                this.setState({
                  motherValue: motherData,
                  willSubmitData: {
                    rootData: willSubmitData.rootData,
                    fatherID: willSubmitData.fatherID,
                    motherID: item.id,
                  }
                });
            }
        }
    }
    let pntInfosData:any[] = [];
    let dataSource:any[] = this.props.propsData;
    // console.log("propsdata", dataSource);
    for(let i = 1; i <= dataSource.length; i++) {
        pntInfosData.push(i + ": " + dataSource[i-1].firstName + " " + dataSource[i-1].lastName + " (" + dataSource[i-1].birth + ")");
    }
    let fatherInfosData:any[] = [], fatherIDsData:any[] = [];
    for(let i = 1; i <= dataSource.length; i++) {
      if (dataSource[i-1].gender === "M") {
        let j = fatherInfosData.length + 1;
        fatherInfosData.push(j + ": " + dataSource[i-1].firstName + " " + dataSource[i-1].lastName + " (" + dataSource[i-1].birth + ")");
        fatherIDsData.push(dataSource[i-1].id);
      }      
    }
    let motherInfosData:any[] = [], motherIDsData:any[] = [];
    for(let i = 1; i <= dataSource.length; i++) {
      if (dataSource[i-1].gender === "F") {
        let j = motherInfosData.length + 1;
        motherInfosData.push(j + ": " + dataSource[i-1].firstName + " " + dataSource[i-1].lastName + " (" + dataSource[i-1].birth + ")");
        motherIDsData.push(dataSource[i-1].id);
      }      
    }
    this.setState({
      pntInfos: pntInfosData,
      fatherInfos: fatherInfosData,
      fatherIDs: fatherIDsData,
      motherInfos: motherInfosData,
      motherIDs: motherIDsData,
      totalDataSource: dataSource
    });
  }

  onSelectFather = (value: any) => {    
    let index = parseInt(value.split(":")[0])-1;
    let id = this.state.fatherIDs[index];
    this.props.updateFatherID(id);
    let willSubmitData = this.state.willSubmitData;
    console.log("onSelectFather", willSubmitData, id, value);
    this.setState({
        willSubmitData: {
            rootData: willSubmitData.rootData,
            fatherID: id,
            motherID: willSubmitData.motherID,
        },
        fatherValue: value,
    });
  }

  onChangeSelectFather = (value:any) => {
    let willSubmitData = this.state.willSubmitData;
    if (!value.length) {
      this.setState({
        willSubmitData: {
          rootData: willSubmitData.rootData,
          fatherID: "",
          motherID: willSubmitData.motherID
        }
      });
      this.props.updateFatherID("");
    }
    this.setState({fatherValue: value})
  }

  onSelectMother = (value: any, option:any) => {
    let index = parseInt(value.split(":")[0])-1;
    let id = this.state.motherIDs[index];
    this.props.updateMotherID(id);
    let willSubmitData = this.state.willSubmitData;
    console.log("onSelectMother", willSubmitData, id, value);
    this.setState({
        willSubmitData: {
            rootData: willSubmitData.rootData,
            fatherID: willSubmitData.fatherID,
            motherID: id,
        },
        motherValue: value,
    });
  }  

  onChangeSelectMother = (value:any) => {
    let willSubmitData = this.state.willSubmitData;
    if (!value.length) {
      this.setState({
        willSubmitData: {
          rootData: willSubmitData.rootData,
          fatherID: willSubmitData.fatherID,
          motherID: ""
        }
      });
      this.props.updateMotherID("");
    }
    this.setState({motherValue: value})
  }

//   submitData = () => {
//       console.log("submitData", this.state.willSubmitData);
//       this.updateAttendees(this.state.willSubmitData)
//   }

  // submitData = (): void => {
  //   console.log("submitData", this.state.willSubmitData);
  //   let data = this.state.willSubmitData;
  //   let parentData:any[] = [];
  //   if(data.fatherID !== "") {
  //       parentData.push({
  //           "type": "node--attendee",
  //           "id": data.fatherID,
  //           "meta": {
  //             "tid": 497
  //           }
  //       })
  //   }
  //   if(data.motherID !== "") {
  //       parentData.push({
  //           "type": "node--attendee",
  //           "id": data.motherID,
  //           "meta": {
  //             "tid": 497
  //           }
  //       })
  //   }
  //   let attributes:any = {
  //       "field_first_name": data.rootData.firstName,
  //       "field_full_name": data.rootData.firstName + " " + data.rootData.lastName,
  //       "field_last_name": data.rootData.lastName,
  //       "field_gender": data.rootData.gender,
  //       "field_birth": data.rootData.birth,
  //       "field_death": data.rootData.death
  //   }
  //   axios({
  //       method: 'patch',
  //       url: `${prodURL}/jsonapi/node/attendee/${data.rootData.id}`,
  //       auth: {
  //           username: `${fetchUsername}`,
  //           password: `${fetchPassword}`
  //       },
  //       headers: {
  //           'Accept': 'application/vnd.api+json',
  //           'Content-Type': 'application/vnd.api+json',
  //           'X-CSRF-Token': this.props.XCSRFtoken
  //       },
  //       data: {
  //           "data": {
  //               "type": "node--attendee",
  //               "id": data.rootData.id,
  //               "attributes": attributes,
  //               "relationships": {
  //                   "field_parents": {
  //                       "data": parentData
  //                   }
  //               }
  //           }
  //       }
  //   })
  //       .then(res => {
  //           this.props.callMethod('fetchAttendees');
  //           // window.location.reload();
  //       })
  //       .catch(catchError);
  // };

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
        render: (text:any, record:any) => {
          const editingRow = this.props.editingRow;
          // console.log("AutoComplete", "\ntext:", text, "\nrecord:", record, "\neditingRow:", editingRow);
          return editingRow === this.props.rootRecord ? (
            <AutoComplete
              style={{ width: "100%" }}
              dataSource={this.state.fatherInfos}
              placeholder="Father's info"
              filterOption={(inputValue:any, option:any) =>
                  option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
              onSelect={this.onSelectFather}
              value={this.state.fatherValue}
              onChange={this.onChangeSelectFather}
            />
          ) : (
              <div>{this.state.fatherValue}</div>
          );
        },
      },
      { 
        title: "Mother", 
        dataIndex: 'mother',
        key: 'mother',
        render: (text:any, record:any) => {
          const editingRow = this.props.editingRow;
          return editingRow === this.props.rootRecord ? (
            <AutoComplete
              style={{ width: "100%" }}
              dataSource={this.state.motherInfos}
              placeholder="Mother's info"
              filterOption={(inputValue:any, option:any) =>
                  option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
              onSelect={this.onSelectMother}
              value={this.state.motherValue}
              onChange={this.onChangeSelectMother}
            />
          ) : (
              <div>{this.state.motherValue}</div>
          );
        },
      },
      // {
      //   title: "Action",
      //   dataIndex: 'operation',
      //   render: () => {
      //       return(
      //           <div style={{cursor: "pointor"}} onClick={this.submitData}>Save</div>
      //       )
      //   }
      // }
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