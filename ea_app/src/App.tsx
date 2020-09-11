import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import styled from "styled-components";
import intl from "react-intl-universal";

import {RootState} from "./store/store";
import {
    setEventCode,
    setAuthStatus,
    setEventTags,
    setMomentTags,
    setLanguage,
    setXCSRFtoken,
    setAttendees,
    setParentEventData,
    setTagTaxonomyVocabularies,
} from "./store/data/actions";
import {callMethod} from "./store/view/actions";
import {AttendeeData, DataState, EventTags} from "./store/data/reducer";
import axios from "axios";
import {fetchPassword, fetchUsername, prodURL} from "./shared/keys";
import SidebarComponent from "./components/sidebar-component";
import {catchError} from "./shared/common-methods";
import {ViewState} from "./store/view/reducer";
import LoaderComponent from "./components/loader-component";
import {ConfigProvider} from 'antd';
import frFR from 'antd/lib/locale-provider/fr_FR';
import enGB from 'antd/lib/locale-provider/en_GB';

import {
    ReactiveBase,
    ResultList,
    ReactiveList,
    SelectedFilters,
    DataSearch,
} from "@appbaseio/reactivesearch";


// CSS starts
const LoaderWrapper = styled.div`
 display: grid;
 grid-template-columns: 1fr;
 height: 70vh;
 align-items: center;
 justify-items: center;
`;

// CSS ends

const locales = {
    "en": require('./locales/en-US.json'),
    "fr": require('./locales/fr-FR.json'),
};

interface OwnProps {
    setXCSRFtoken(XCSRFtoken: string): void;

    setEventCode(eventCode: string): void;

    setLanguage(language: string): void;

    setAuthStatus(userIsAnonymous: boolean): void;

    setEventTags(eventTags: EventTags): void;

    setMomentTags(eventTags: EventTags): void;

    setParentEventData(eventID: string, attendeeEventID: string, momentEventID: string): void;

    setTagTaxonomyVocabularies(attendeeVocabularyID: string, momentVocabularyID: string): void;

    callMethod(method: string): void;

    setAttendees(attendees: AttendeeData): void;
}

const mapStateToProps = ({data, view}: RootState): { data: DataState, view: ViewState } => ({data, view});

type Props = OwnProps & ReturnType<typeof mapStateToProps>;

type State = Readonly<{
    isLoading: boolean;
    initDone: boolean;
}>;

class App extends PureComponent<Props, State> {
    readonly state: State = {
        isLoading: true,
        initDone: false,
    };

    private getXCSRFToken = (): void => {
        const fetchURL = `${prodURL}/rest/session/token`;

        axios({
            method: 'get',
            url: `${fetchURL}`,
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
            }
        })
            .then(response => {
                // console.log("getXCSRFToken", response.data);
                this.props.setXCSRFtoken(response.data)
            })
            .catch(catchError);
    };

    private fetchAttendees = (): void => {
        const fetchURL = `${prodURL}/jsonapi/node/attendee/?filter[field_event_reference.field_event_access_code][value]=${this.props.data.eventCode}&fields[user--user]=name,mail&include=field_attendee_tags.vid&fields[node--attendee]=title,field_first_name,field_last_name,field_attendee_tags,field_event_reference&fields[taxonomy_term--attendee_tags]=name`;
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
            .then((res) => {
                const attendees = res.data;
                console.log("attendees", attendees);
                // this.props.setAttendees(attendees);
                // this.setState({
                //     isLoading: false
                // });
            })
            .catch(catchError);
    };

    private fetchEventTags = (): void => {
        const fetchURL = `${prodURL}/jsonapi/taxonomy_term/attendee_tags?fields[taxonomy_term--attendee_tags]=name&filter[parent.name][value]=${this.props.data.eventCode}&include=parent,vid`;

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
            .then((res: any) => {
                const eventTags = res.data.data;
                // console.log("eventTags", eventTags);
                this.props.setEventTags(eventTags);
            })
            .catch(catchError);
    };

    private fetchMomentTags = (): void => {
        const fetchURL = `${prodURL}/jsonapi/taxonomy_term/moment_tags?fields[taxonomy_term--moment_tags]=name&filter[parent.name][value]=${this.props.data.eventCode}&include=parent,vid`;

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
            .then((res: any) => {
                const momentTags = res.data.data;
                // console.log("momentTags", momentTags);
                this.props.setMomentTags(momentTags);
            })
            .catch(catchError);
    };

    private fetchTagsParentEvent = (): void => {
        const fetchURL = `${prodURL}/jsonapi/node/event?filter[field_event_access_code]=${this.props.data.eventCode}&fields[node--event]=field_event_attendee_tags,field_event_moment_tags`;

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
            .then((res: any) => {
                const eventID = res.data.data[0].id;
                const attendeeEventID = res.data.data[0].relationships.field_event_attendee_tags.data.id;
                const momentEventID = res.data.data[0].relationships.field_event_moment_tags.data[0].id;
                // console.log("eventID, attendeeEventID, momentEventID", eventID, attendeeEventID, momentEventID);
                this.props.setParentEventData(eventID, attendeeEventID, momentEventID);
            })
            .catch(catchError);
    };

    private fetchTaxonomyVocabularyID = (): void => {
        const fetchURL = `${prodURL}/jsonapi/taxonomy_vocabulary/taxonomy_vocabulary?fields[taxonomy_vocabulary--taxonomy_vocabulary]=name`;

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
            .then((res: any) => {
                const taxonomyData = res.data.data;
                let attendeeVocabularyID = '';
                let momentVocabularyID = '';

                taxonomyData.map((vocabulary: any) => {
                    if (vocabulary.attributes.name === 'Attendee Tags') {
                        attendeeVocabularyID = vocabulary.id
                    } else if (vocabulary.attributes.name === 'Moment Tags') {
                        momentVocabularyID = vocabulary.id
                    }
                });
                // console.log("attendeeVocabularyID, momentVocabularyID", attendeeVocabularyID, momentVocabularyID);
                this.props.setTagTaxonomyVocabularies(attendeeVocabularyID, momentVocabularyID)
            })
            .catch(catchError);
    };

    loadLocales() {
        // init method will load CLDR locale data according to currentLocale
        // react-intl-universal is singleton, so you should init it only once in your app
        intl.init({
            currentLocale: this.props.data.language,
            locales,
        })
            .then(() => {
                // After loading CLDR locale data, start to render
                this.setState({initDone: true});
            });
    }

    async componentDidMount() {
        this.getXCSRFToken();
        /*global drupalSettings:true*/
        /*eslint no-undef: "error"*/
        // @ts-ignore
        await this.props.setAuthStatus(false);//false//drupalSettings.isAnonymous
        // @ts-ignore
        await this.props.setEventCode("390822");//'039214'//drupalSettings.eventAccessCode//'332280'
        // @ts-ignore
        await this.props.setLanguage("en");//drupalSettings.language//'en'
        await this.fetchEventTags();
        await this.fetchAttendees();
        await this.fetchMomentTags();
        await this.fetchTagsParentEvent();
        await this.fetchTaxonomyVocabularyID();
        await this.loadLocales();//do not remove locally
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        if (this.props.view.callMethod !== prevProps.view.callMethod) {
            switch (this.props.view.callMethod) {
                case 'fetchEventTags':
                    this.fetchEventTags();
                    this.props.callMethod('');
                    break;
                case 'fetchMomentTags':
                    this.fetchMomentTags();
                    this.props.callMethod('');
                    break;
                case 'fetchAttendees':
                    // this.fetchAttendees();
                    this.props.callMethod('');
                    break;
            }
        }
    }

    onUpdate = (data: any): void => {
        if (!data.data.length) {
            return;
        }
        console.log("elastic-data", data);

        // const fileName = "file";
        // const json = JSON.stringify(data);
        // const blob = new Blob([json],{type:'application/json'});
        // const href = URL.createObjectURL(blob);
        // const link = document.createElement('a');
        // link.href = href;
        // link.download = fileName + ".json";
        // document.body.appendChild(link);
        // link.click();
        // document.body.removeChild(link);
                
        let attendeesData:any[] = [], attendeesIncluded:any[] = [];
        for (let i = 0; i < data.data.length; i++) {
            let field_attendee_tags_data:any[] = [];
            if( JSON.parse(data.data[i].relationships[0]).tags ) {
                for (let j = 0; j < JSON.parse(data.data[i].relationships[0]).tags.length; j++) {
                    let childItem:any = {
                        "id": JSON.parse(data.data[i].relationships[0]).tags[j].id,
                        "type": "taxonomy_term--attendee_tags"
                    }
                    field_attendee_tags_data.push(childItem);
                    let includedChildItem:any = {
                        "attributes": {
                            "name": JSON.parse(data.data[i].relationships[0]).tags[j].label
                        },
                        "id": JSON.parse(data.data[i].relationships[0]).tags[j].id
                    }
                    let includedAppendAvailable:number = 1;
                    for (let k = 0; k < attendeesIncluded.length; k++) {
                        if(attendeesIncluded[k].id === includedChildItem.id) {
                            includedAppendAvailable = 0;
                        }
                    }
                    if(includedAppendAvailable) {
                        attendeesIncluded.push(includedChildItem);
                    }
                }
            }
            let parents:any[] = [];
            if (JSON.parse(data.data[i].relationships[0]).parents && JSON.parse(data.data[i].relationships[0]).parents.length) {
                for (let u = 0; u < JSON.parse(data.data[i].relationships[0]).parents.length; u++) {
                    let parentId:string = JSON.parse(data.data[i].relationships[0]).parents[u].id;
                    for (let v = 0; v < data.data.length; v++) {
                        if( parentId === JSON.parse(data.data[v].relationships[0]).id ) {
                            let parentItem:any = {
                                "fname": JSON.parse(data.data[v].relationships[0]).fname,
                                "lname": JSON.parse(data.data[v].relationships[0]).lname,
                                "gender": JSON.parse(data.data[v].relationships[0]).gender,
                                "birth": JSON.parse(data.data[v].relationships[0]).birth,
                                "death": JSON.parse(data.data[v].relationships[0]).death,
                                "email": JSON.parse(data.data[v].relationships[0]).email,
                            }
                            parents.push(parentItem);
                            break;
                        }
                    }
                }
            }
            let item:any = {
               "attributes": {
                   "title": JSON.parse(data.data[i].relationships[0]).email,
                   "field_first_name": JSON.parse(data.data[i].relationships[0]).fname,
                   "field_last_name": JSON.parse(data.data[i].relationships[0]).lname,
                   "gender": JSON.parse(data.data[i].relationships[0]).gender,
                   "birth": JSON.parse(data.data[i].relationships[0]).birth,
                   "death": JSON.parse(data.data[i].relationships[0]).death,
                   "parent": parents,
               },
               "id": JSON.parse(data.data[i].relationships[0]).id,
               "relationships": {
                   "field_attendee_tags": {
                       "data": field_attendee_tags_data,
                    },
                }
            }            
            attendeesData.push(item);
        }

        let attendees:any = {
            "data": attendeesData,
            "included": attendeesIncluded,
        }
        this.props.setAttendees(attendees);
        this.setState({
            isLoading: false,
        });
        console.log("cus-attendees", attendees);

    };

    render() {
        const {userIsAnonymous} = this.props.data;

        const currentLocale = this.props.data.language;
        let AntdLocale;
        switch (currentLocale) {
            case 'en': {
                AntdLocale = enGB;
                break;
            }
            case 'fr': {
                AntdLocale = frFR;
                break;
            }
            default: {
                AntdLocale = enGB;
                break;
            }
        }
        return (
            <>
                {this.state.isLoading || !this.state.initDone ?
                    <LoaderWrapper>
                        <LoaderComponent/>
                    </LoaderWrapper>
                    :
                    !userIsAnonymous ?
                        <ConfigProvider locale={AntdLocale}>
                            <SidebarComponent/>
                            {/* should be updated here for elastic search */}
                        </ConfigProvider>
                        :
                        <h2>Please log in to proceed</h2>}
                <div style={{display: "none"}}>
                    <ReactiveBase
                        app="elasticsearch_index_bitnami_drupal8_attendee"
                        credentials="elastic:Uh44gjyJ78iGYMzMez0WJI7L"
                        url="https://db170860be1944a39e20206e398f370c.eu-west-1.aws.found.io:9243"
                    >
                        <DataSearch
                            // value={drupalSettings.family_tree.eventAccessCode}
                            value="390822"
                            className="dataSearch"
                            dataField={["family_code"]}
                            componentId="Family Code"
                            placeholder="Family Code"
                        />
                        <ReactiveList
                            componentId="SearchResult"
                            dataField="family_code"
                            // from={0}
                            size={1000}
                            onData={this.onUpdate}
                            className="result-list-container"
                            // renderItem={this.booksList}
                            pagination={false}
                            react={{
                                and: ["Family Code"],
                            }}
                            render={({data}) => (
                                <div></div>
                            )}
                        />
                    </ReactiveBase>
                </div>
            </>
        );
    }
}

export default connect(mapStateToProps, {
    setAttendees,
    setAuthStatus,
    setEventCode,
    setLanguage,
    setXCSRFtoken,
    setEventTags,
    setMomentTags,
    setParentEventData,
    setTagTaxonomyVocabularies,
    callMethod
})(App);