import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {RootState} from "../../store/store";
import {fetchPassword, fetchUsername, prodURL} from "../../shared/keys";
import axios from "axios";
import styled from "styled-components";
import {DataState} from "../../store/data/reducer";
import {Tag, Drawer, Button} from 'antd';
import {ViewState} from "../../store/view/reducer";
import {toggleDrawer, callMethod} from "../../store/view/actions";
import {eventTag} from "./attendee-component";
import _ from 'lodash';

// CSS starts
const DrawerButtonContainer = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    border-top: 1px solid #e8e8e8;
    padding: 10px 16px;
    text-align: center;
    background: #fff;
    border-radius: 0 0 4px 4px;
`;

// CSS ends

interface OwnProps {
    toggleDrawer(drawerStatus: boolean, record: any): void;
    callMethod(method: string): void;
}

const mapStateToProps = ({data, view}: RootState): { data: DataState, view: ViewState } => ({data, view});

type Props = OwnProps & ReturnType<typeof mapStateToProps>;

type State = Readonly<{
    selectedTags: eventTag[];
    eventTags: eventTag[];
    isLoading: boolean;
}>;

class DrawerTagsComponent extends PureComponent<Props, State> {

    readonly state: State = {
        selectedTags: [],
        eventTags: [{tagName: 'empty', tagID: 'empty'}],
        isLoading: false
    };

    private closeDrawer = (): void => {
        this.props.toggleDrawer(false, null);
        this.setState({selectedTags: []});

    };

    private handleChange = (tag: any, checked: any) => {
        const {selectedTags} = this.state;
        const nextSelectedTags = checked ? [...selectedTags, tag] : selectedTags.filter((t: any) => t !== tag);
        this.setState({selectedTags: nextSelectedTags});
    };

    private saveTags = (): void => {

        this.setState({isLoading: true});

        const {selectedTags} = this.state;
        const attendeeIndex = this.props.view.DrawerIsVisible.record.key;
        const attendeeID = this.props.data.attendees.data[attendeeIndex].id;
        const currentTags = this.props.data.attendees.data[attendeeIndex].relationships.field_attendee_tags.data;

        const newTags = selectedTags.map((tag: eventTag) => {
            return {
                type: 'taxonomy_term--attendee_tags',
                id: tag.tagID
            }
        });

        const allTagsWithDuplicates = [...currentTags, ...newTags];
        const allTags = _.uniqBy(allTagsWithDuplicates, 'id');

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
                            "data": allTags
                        }
                    }
                }
            }
        })
            .then(res => {
                this.props.callMethod('fetchAttendees');
                this.props.toggleDrawer(false, null);
                this.setState({
                    selectedTags: [],
                    isLoading: false
                });
            })
            .catch(error => console.log(error));
    };

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        const eventTags = this.props.data.eventTags;
        if (eventTags !== prevProps.data.eventTags) {
            const allTags = eventTags.map((tag: any) => {
                return {
                    tagName: tag.attributes.name,
                    tagID: tag.id
                }
            });
            this.setState({
                eventTags: allTags
            })
        }
    }

    render() {

        const {CheckableTag} = Tag;
        const {eventTags, selectedTags} = this.state;

        return (
            <Drawer
                title="Choose tags to add:"
                placement="right"
                closable={false}
                onClose={this.closeDrawer}
                visible={this.props.view.DrawerIsVisible.drawerStatus}
            >
                {eventTags.map((eventTag: any, index: number) => (
                    <CheckableTag
                        key={index}
                        checked={selectedTags.indexOf(eventTag) > -1}
                        onChange={checked => this.handleChange(eventTag, checked)}
                    >
                        {eventTag.tagName}
                    </CheckableTag>
                ))}

                <DrawerButtonContainer>
                    <Button loading={this.state.isLoading} style={{marginRight: 8}} onClick={this.closeDrawer}>Cancel</Button>

                    {this.state.selectedTags.length ?
                    <Button loading={this.state.isLoading} onClick={this.saveTags} type="primary">Submit</Button>
                        : null}
                </DrawerButtonContainer>

            </Drawer>
        );
    }

}

export default connect(mapStateToProps, {toggleDrawer, callMethod})(DrawerTagsComponent);
