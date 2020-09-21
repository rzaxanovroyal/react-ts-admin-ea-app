import React, {AriaAttributes, DOMAttributes, PureComponent, SyntheticEvent} from 'react';
import styled from "styled-components";

import AttendeeComponent from './attendee/attendee-component';
import AttendeeTagsComponent from './attendee-tags-component';
import MomentTagsComponent from './moment-tags-component';
import HeaderComponent from "./header-component";
import intl from "react-intl-universal";

//CSS starts
const Wrapper = styled.div`
  display: grid;
  margin: 15px;
     @media(min-width: 800px) {
      grid-template-columns: 1fr 4fr;
   }
    @media(min-width: 1400px) {
      grid-template-columns: 1fr 2fr 8fr 1fr;
   }
`;
const SidebarWrapper = styled.div`
    @media(min-width: 1400px) {
      grid-column-start: 2;
  }
  margin: 48px 15px 0 0;
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
  flex-shrink: 1;
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
                                 isActive={component === 'Attendee'}>{intl.get('ATTENDEES')}</SidebarItem>
                    <SidebarItem onClick={this.setComponent('Attendee tags')}
                                 isActive={component === 'Attendee tags'}>{intl.get('ATTENDEE_TAGS')}</SidebarItem>
                    <SidebarItem onClick={this.setComponent('Moment tags')}
                                 isActive={component === 'Moment tags'}>{intl.get('MOMENT_TAGS')}</SidebarItem>
                </SidebarWrapper>
                
                <ComponentWrapper>
                    {/* <HeaderComponent/> */}
                    <div style={{marginTop: "40px"}}>{currentComponent}</div>
                </ComponentWrapper>
            </Wrapper>
        );
    }
}

export default SidebarComponent;

