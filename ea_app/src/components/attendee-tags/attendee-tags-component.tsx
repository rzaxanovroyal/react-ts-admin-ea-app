import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {RootState} from "../../store/store";
import {Form, Icon, Input, Modal, Spin, Table, Tag} from "antd";
import {ColumnProps} from 'antd/es/table';
import {FormComponentProps} from 'antd/es/form';
import {EventTag} from "../attendee/attendee-component";
import {DataState} from "../../store/data/reducer";
import styled from "styled-components";

// CSS starts
const Wrapper = styled.div`
 margin-top: 48px;
`;

// CSS ends

interface EventTagFormProps extends FormComponentProps {
    visible: boolean;
    onCancel: () => void;
    onCreate: () => void;
}

const FormInModal = Form.create<EventTagFormProps>({name: 'form_in_modal'})(
    // eslint-disable-next-line
    class extends React.Component<EventTagFormProps, any> {
        render() {
            //@ts-ignore
            const {visible, onCancel, onCreate, form} = this.props;
            const {getFieldDecorator} = form;
            return (
                <Modal
                    visible={visible}
                    onCancel={onCancel}
                    onOk={onCreate}
                >
                    <Form layout="vertical">
                        <Form.Item label="Attendee Tag">
                            {getFieldDecorator('tag', {
                                rules: [{required: true, message: 'Please enter the tag'}],
                            })(<Input/>)}
                        </Form.Item>
                    </Form>
                </Modal>
            );
        }
    },
);


const spinIcon = <Icon type="loading" style={{fontSize: 6, marginLeft: 7, marginRight: 5, verticalAlign: 3}} spin/>;

interface OwnProps {
}

interface TableRow {
    key: number,
    eventTags: EventTag[];
}

const mapStateToProps = ({data}: RootState): { data: DataState } => ({data});

type Props = OwnProps & ReturnType<typeof mapStateToProps>

type State = Readonly<{
    isLoading: boolean;
    visible: boolean;
    dataSource: TableRow[];
}>;

class AttendeeTagsComponent extends PureComponent<Props, State> {
    readonly state: State = {
        dataSource: [{
            key: 0,
            eventTags: [{
                tagID: '',
                tagName: ''
            }],
        }],
        isLoading: false,
        visible: false
    };

    private setEventTags = (): void => {
        const eventData = this.props.data.eventTags;

        const eventTags = eventData.map((tag: any) => {
            return {
                tagName: tag.attributes.name,
                tagID: tag.id
            }
        });

        this.setState({
            dataSource: [{
                key: 0,
                eventTags: eventTags
            }]
        })
    };


    private removeTag = (record: TableRow, tagID: string) => {
        this.setState({isLoading: true});
    };

    private openModalForm = (record: TableRow) => {
        this.setState({visible: true});
    };

    handleCancel = () => {
        this.setState({visible: false});
    };

    handleCreate = () => {
        // @ts-ignore
        const {form} = this.formRef.props;
        form.validateFields((err: any, values: any) => {
            if (err) {
                return;
            }
            console.log(values.tag);

            /*axios({
                method: 'post',
                url: `${prodURL}/jsonapi/taxonomy_term/attendee_tags`,
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
                        "type": "taxonomy_term--attendee_tags",
                        "attributes": {
                            "name": values.tag,
                        },
                        "relationships": {
                            "vid": {
                                "data": {
                                    "type": "taxonomy_vocabulary--taxonomy_vocabulary",
                                    "id": ''
                                }
                            },
                            "parent": {
                                "data": [
                                    {
                                        "type": "taxonomy_term--attendee_tags",
                                        "id": ''
                                    }
                                ]
                            }
                        }
                    }
                }
            })
                .catch(catchError);*/

            form.resetFields();
            this.setState({visible: false});
        });
    };

    saveFormRef = (formRef: any) => {
        // @ts-ignore
        this.formRef = formRef;
    };

    componentDidMount() {
        this.setEventTags()
    }

    render() {
        let tagPosition = 0;

        const columns: ColumnProps<TableRow>[] = [{
            title: 'Event tags',
            dataIndex: 'eventTags',
            key: 'eventTags',
            render: (tags, record, index) => {
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
                            this.openModalForm(record)
                        }} style={{background: '#fff', borderStyle: 'dashed'}}>
                            <Icon type="plus"/> Add Tag
                            </Tag>
                       </span>
                )
            }
        }
        ];

        return (
            <Wrapper>
                <Table<TableRow> bordered columns={columns} dataSource={this.state.dataSource}/>
                <FormInModal
                    wrappedComponentRef={this.saveFormRef}
                    visible={this.state.visible}
                    onCancel={this.handleCancel}
                    onCreate={this.handleCreate}
                />
            </Wrapper>
        );
    }
}

export default connect(mapStateToProps, {})(AttendeeTagsComponent);
