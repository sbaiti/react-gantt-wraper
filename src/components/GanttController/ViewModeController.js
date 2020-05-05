import React, {
    Fragment
} from 'react';
import ViewModeBtn from './ViewModeBtn';
import PropTypes from 'prop-types';
import {
    map
} from 'lodash';

const units = {
    hour: 'Hour',
    quarterDay: 'Quarter Day',
    day: 'Day',
    halfDay: 'Half Day',
    week: 'Week',
    month: 'Month',
    year: 'Year'
};

function ViewModeController(props) {
    const {
        handleChangeViewMode,
        viewMode
    } = props;
    return (
        <Fragment>
            {map(units, (unitVal, key) => (
                <ViewModeBtn
                    key={key}
                    unit={unitVal}
                    viewMode={viewMode}
                    handleChangeViewMode={handleChangeViewMode}
                />
            ))}
        </Fragment>
    );
}
ViewModeController.propTypes = {
    viewMode: PropTypes.string,
    handleChangeViewMode: PropTypes.func,
};
export default ViewModeController;