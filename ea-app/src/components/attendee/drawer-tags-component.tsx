import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {RootState} from "../../store/store";
import {fetchPassword, fetchUsername, prodURL} from "../../shared/keys";
import axios from "axios";
import styled from "styled-components";
import {DataState, AttendeeData, EventTags} from "../../store/data/reducer";
import {Tag, Drawer, Button} from 'antd';
import {ViewState} from "../../store/view/reducer";
import {toggleDrawer} from "../../store/view/actions";

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
    toggleDrawer(DrawerStatus: boolean): void;
}

const mapStateToProps = ({data, view}: RootState): { data: DataState, view: ViewState } => ({data, view});

type Props = OwnProps & ReturnType<typeof mapStateToProps>;

interface eventTag {
    tagName: string;
    tagID: string;
}

type State = Readonly<{
    selectedTags: any;
    eventTags: eventTag[];
}>;

class DrawerTagsComponent extends PureComponent<Props, State> {

    readonly state: State = {
        selectedTags: [],
        eventTags: [{tagName: 'empty', tagID: 'empty'}],
    };

    private onClose = (): void => {
        this.props.toggleDrawer(false);

    };

    private handleChange = (tag: any, checked: any) => {
        const {selectedTags} = this.state;
        const nextSelectedTags = checked ? [...selectedTags, tag] : selectedTags.filter((t: any) => t !== tag);
        console.log('You are interested in: ', nextSelectedTags);
        this.setState({selectedTags: nextSelectedTags});
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
                    onClose={this.onClose}
                    visible={this.props.view.DrawerIsVisible}
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
                        <Button style={{marginRight: 8}} onClick={this.onClose}>Cancel</Button>
                        <Button onClick={this.onClose} type="primary">Submit</Button>
                    </DrawerButtonContainer>

                </Drawer>
        );
    }

}

export default connect(mapStateToProps, {toggleDrawer})(DrawerTagsComponent);
