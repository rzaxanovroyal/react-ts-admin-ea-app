import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {RootState} from "../../store/store";
import {Icon, Spin, Table, Tag} from "antd";
import {ColumnProps} from 'antd/es/table';
import {EventTag} from "../attendee/attendee-component";

const spinIcon = <Icon type="loading" style={{fontSize: 6, marginLeft: 7, marginRight: 5, verticalAlign: 3}} spin/>;

interface OwnProps {
}

interface TableRow {
    key: number,
    eventTags: EventTag[];
}

type Props = OwnProps & ReturnType<typeof mapStateToProps> & typeof mapDispatchToProps;

type State = Readonly<{
    isLoading: boolean;
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
        isLoading: false
    };

    private removeTag = (record: TableRow, tagID: string) => {
        this.setState({isLoading: true});

    };

    private addTag = (record: TableRow) => {

    };

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
                            this.addTag(record)
                        }} style={{background: '#fff', borderStyle: 'dashed'}}>
                            <Icon type="plus"/> Add Tag
                            </Tag>
                       </span>
                )
            }
        }
        ];
        
        return (
            <Table<TableRow> columns={columns} dataSource={this.state.dataSource}/>
        );
    }
}

const mapStateToProps = (state: RootState) => {
    return {};
};

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(AttendeeTagsComponent);
