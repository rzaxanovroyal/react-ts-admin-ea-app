import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import styled from "styled-components";
import Moment from 'react-moment';
import axios from "axios";

import {RootState} from "../store/store";
import {DataState} from "../store/data/reducer";
import {prodURL, fetchUsername, fetchPassword} from "../shared/keys";
import {catchError} from "../shared/common-methods";

//CSS starts
const StyledHeader = styled.div`
   font-size: 26px;
   font-weight: bold;
   padding-top: 10px;
`;

//CSS ends

interface OwnProps {
}

type Props = OwnProps & ReturnType<typeof mapStateToProps>;

type State = Readonly<{
    eventName: string | null,
    eventDate: string | null,
    eventLocation: string | null
}>;

const mapStateToProps = ({data}: RootState): { data: DataState } => ({data});

class HeaderComponent extends PureComponent<Props, State> {
    readonly state: State = {
        eventName: null,
        eventDate: null,
        eventLocation: null
    };

    private fetchEventInfo = (): void => {
        const fetchURL = `${prodURL}/jsonapi/node/event/?filter[field_event_access_code][value]=${this.props.data.eventCode}`;

        axios({
            method: 'get',
            url: `${fetchURL}`,
            auth: {
                username: `${fetchUsername}`,
                password: `${fetchPassword}`
            },
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
            }
        })
            .then((response: any) => {
                const attributes = response.data.data[0].attributes;

                this.setState({
                    eventName: attributes.title,
                    eventDate: attributes.field_event_date,
                    eventLocation: attributes.field_event_address ? attributes.field_event_address.locality : null
                })
            })
            .catch(catchError);
    };

    componentDidMount(): void {
        this.fetchEventInfo()
    }

    render() {
        const {eventName, eventDate, eventLocation} = this.state;
        const {language} = this.props.data;
        let dateFormat;
        switch (language) {
            case "fr":
                dateFormat = "DD-MM-YYYY";
                break;
            case "en":
                dateFormat = "MM-DD-YYYY";
                break;
            default:
                dateFormat = "MM-DD-YYYY";
        }

        return (
            <StyledHeader><i>
                {eventName ? `${eventName}, ` : null}

                {eventDate ?
                    <Moment format={dateFormat}>
                        {eventDate}
                    </Moment> : null}

                {eventLocation ?
                    `, ${eventLocation}` : null
                }</i>
            </StyledHeader>
        );
    }
}

export default connect(mapStateToProps, {})(HeaderComponent);
