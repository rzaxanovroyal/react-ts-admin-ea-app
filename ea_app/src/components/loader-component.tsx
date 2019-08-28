import React, {FunctionComponent} from 'react';

interface OwnProps {
}

type Props = OwnProps;

const LoaderComponent: FunctionComponent<Props> = (props) => {

    return (
        <div>
            <img
                src="https://eventstory.live/sites/default/files/loader.gif"
                alt="Loading..."
                height="45px"
                width="45px"
            />
        </div>
    );
};

export default LoaderComponent;