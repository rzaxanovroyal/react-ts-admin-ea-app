import React, {AriaAttributes, DOMAttributes, PureComponent, SyntheticEvent} from 'react';
import styled from "styled-components";

import AttendeeComponent from './attendee/attendee-component';
import AttendeeTagsComponent from './attendee-tags/attendee-tags-component';
import MomentTagsComponent from './moment-tags/moment-tags-component';

//CSS starts
const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  margin: 15px;
`;
const SidebarWrapper = styled.div`
  min-width: 180px;
  display: flex;
  flex-direction: column;
  margin: 50px 15px 0 0;
`;
const SidebarItem = styled.div`
   cursor: pointer;
   font-weight: bold;
   padding: 10px;
   &:hover {background-color: rgba(247, 247, 247, 1);}
   background-color: ${props => props.isActive ? `rgba(247, 247, 247, 1)` : `white`};
   border-right: ${props => props.isActive ? `3px solid ${props.theme.colorSecondary}` : `3px solid white`};
`;
const ComponentWrapper = styled.div`
`;

//CSS Ends
declare module 'react' {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
        isActive?: boolean;
    }
}
type componentState = 'Attendee' | 'Attendee tags' | 'Moment tags';

interface OwnProps {
}

type Props = OwnProps;

type State = Readonly<{
    component: componentState;
}>;

class SidebarComponent extends PureComponent<Props, State> {
    readonly state: State = {
        component: 'Attendee'
    };

    private setComponent = (component: componentState) => (e: SyntheticEvent) => {
        e.preventDefault();

        this.setState({
            component: component
        });
    };

    render() {
        const {component} = this.state;
        let currentComponent;
        switch (component) {
            case 'Attendee':
                currentComponent = <AttendeeComponent/>;
                break;
            case 'Attendee tags':
                currentComponent = <AttendeeTagsComponent/>;
                break;
            case 'Moment tags':
                currentComponent = <MomentTagsComponent/>;
                break;
            default:
                currentComponent = <AttendeeComponent/>;

        }
        return (
            <Wrapper>
                <SidebarWrapper>
                    <SidebarItem onClick={this.setComponent('Attendee')}
                                 isActive={component === 'Attendee'}>ATTENDEE</SidebarItem>
                    <SidebarItem onClick={this.setComponent('Attendee tags')}
                                 isActive={component === 'Attendee tags'}>ATTENDEE TAGS</SidebarItem>
                    <SidebarItem onClick={this.setComponent('Moment tags')}
                                 isActive={component === 'Moment tags'}>MOMENT TAGS</SidebarItem>
                </SidebarWrapper>

                <ComponentWrapper>
                    {currentComponent}
                </ComponentWrapper>
            </Wrapper>
        );
    }
}

export default SidebarComponent;

