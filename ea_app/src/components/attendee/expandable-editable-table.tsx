import React, {PureComponent} from 'react';

import {
    Form, Input, InputNumber, Popconfirm, Spin, 
    Table, Tag, Popover, message, Icon, Select
} from 'antd';
import {FormComponentProps} from 'antd/es/form';
import { defaultProps } from 'antd-mobile/lib/search-bar/PropsType';

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

interface OwnProps {
  propsData: any[];
}

type Props = OwnProps & FormComponentProps;

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
      });
    }
    this.setState({
      data: data,
    });    
  }

  // componentDidUpdate() {
  //   const expandable_table = document.getElementById("expandable-table");
  //   const expandable_element = expandable_table as HTMLElement;
  //   const child_table_head = expandable_element.getElementsByClassName("ant-table-thead")[0];
  //   const th_elements = child_table_head.getElementsByTagName("th");
  //   for (let i = 0; i < th_elements.length; i++) {
  //     console.log(th_elements[i])
  //     th_elements[i].style.backgroundColor = "white !important";
  //     th_elements[i].style.color = "grey !important";
  //     // th_elements[i].classList.add("th_customize_class");
  //   }
  // }

  isEditing = (record:any) => record.key === this.state.editingKey;

  cancel = () => {
    this.setState({ editingKey: '' });
  };

  save(form:any, key:any) {
    form.validateFields((error:any, row:any) => {
      if (error) {
        return;
      }
      const newData = [...this.state.data];
      const index = newData.findIndex(item => key === item.key);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, {
          ...item,
          ...row,
        });
        console.log("updatedParentData", newData);
        this.setState({ data: newData, editingKey: '' });
      } else {
        newData.push(row);
        this.setState({ data: newData, editingKey: '' });
      }
    });
  }

  edit(key:any) {
    this.setState({ editingKey: key });
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
                  onClick={()=>console.log('add parent data')}
                  style={{fontSize: '22px', color: 'rgba(176,31,95,1)'}}
              />
          )
        },
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