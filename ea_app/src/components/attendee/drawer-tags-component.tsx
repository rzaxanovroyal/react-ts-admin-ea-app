import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {fetchPassword, fetchUsername, prodURL} from "../../shared/keys";
import axios from "axios";
import styled from "styled-components";
import {Button, Drawer, Tag} from 'antd';
import _ from 'lodash';

import {RootState} from "../../store/store";
import {DataState} from "../../store/data/reducer";
import {ViewState} from "../../store/view/reducer";
import {callMethod, toggleDrawer} from "../../store/view/actions";
import {EventTag} from "./attendee-component";
import {catchError} from "../../shared/common-methods";
import intl from "react-intl-universal";

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
    selectedTags: EventTag[];
    eventTags: EventTag[];
    isLoading: boolean;
    allowedTagsPerAttendee: number;
}>;

class DrawerTagsComponent extends PureComponent<Props, State> {

    readonly state: State = {
        selectedTags: [],
        eventTags: [{tagName: 'empty', tagID: 'empty'}],
        isLoading: false,
        allowedTagsPerAttendee: 5
    };

    private clearAllowedTagsPerAttendee = (): void => {
        this.setState({allowedTagsPerAttendee: 5});
    };

    private closeDrawer = (): void => {
        this.props.toggleDrawer(false, null);
        this.setState({
            selectedTags: []
        });
        setTimeout(this.clearAllowedTagsPerAttendee, 500);
    };

    private handleChange = (tag: any, checked: any) => {
        const {selectedTags} = this.state;
        const nextSelectedTags = checked ? [...selectedTags, tag] : selectedTags.filter((t: any) => t !== tag);

        let {allowedTagsPerAttendee} = this.state;
        let tagsAllowed = allowedTagsPerAttendee - nextSelectedTags.length;

        if (tagsAllowed > -1) {
            this.setState({
                selectedTags: nextSelectedTags
            });
        }
    };

    private saveTags = (): void => {

        this.setState({isLoading: true});

        const {selectedTags} = this.state;
        const attendeeIndex = this.props.view.DrawerIsVisible.record.key;
        const attendeeID = this.props.data.attendees.data[attendeeIndex].id;
        const currentTags = this.props.data.attendees.data[attendeeIndex].relationships.field_attendee_tags.data;

        const newTags = selectedTags.map((tag: EventTag) => {
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
                setTimeout(this.clearAllowedTagsPerAttendee, 500);
            })
            .catch(catchError);
    };

    private setTagsForCurrentAttendee = (): void => {
        let uniqueTags: { tagID: any; tagName: string }[];
        const eventData = this.props.data.eventTags;
        const attendeeTags = this.props.view.DrawerIsVisible.record.attendeeTags;

        const eventTags = eventData.map((tag: any) => {
            return {
                tagName: tag.attributes.name,
                tagID: tag.id
            }
        });

        uniqueTags = eventTags.filter((o: EventTag) => attendeeTags.every((p: EventTag) => !['tagID'].some(k => o.tagID === p.tagID)));

        this.setState({
            eventTags: uniqueTags,
            allowedTagsPerAttendee: this.state.allowedTagsPerAttendee - attendeeTags.length
        })
    };

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        if (this.props.view.DrawerIsVisible !== prevProps.view.DrawerIsVisible && this.props.view.DrawerIsVisible.drawerStatus) {
            this.setTagsForCurrentAttendee();
        }
    }

    render() {

        const {CheckableTag} = Tag;
        const {eventTags, selectedTags, allowedTagsPerAttendee} = this.state;

        return (
            <Drawer
                title={`${intl.get('CHOOSE_TAGS')} (${allowedTagsPerAttendee} max)`}
                placement="right"
                closable={false}
                onClose={this.closeDrawer}
                visible={this.props.view.DrawerIsVisible.drawerStatus}
                width={300}
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
                    <Button loading={this.state.isLoading} style={{marginRight: 8}}
                            onClick={this.closeDrawer}>{intl.get('CANCEL')}</Button>

                    {this.state.selectedTags.length ?
                        <Button loading={this.state.isLoading} onClick={this.saveTags}
                                type="primary">{intl.get('SAVE')}</Button>
                        : null}
                </DrawerButtonContainer>
            </Drawer>
        );
    }
}

export default connect(mapStateToProps, {toggleDrawer, callMethod})(DrawerTagsComponent);
