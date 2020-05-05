import React from 'react';
import PropTypes from 'prop-types';
import {
    Button
} from 'react-bootstrap';

function ViewModeBtn({
    unit,
    viewMode,
    handleChangeViewMode
}) {

    return (
        <div className="view__mode__btn">
      <Button
        bsStyle="primary"
        bsSize="large"
        active={unit === viewMode}
        onClick={() => handleChangeViewMode(unit)}
      >
        {unit}
      </Button>
    </div>
    );
}
ViewModeBtn.propTypes = {
    unit: PropTypes.string,
    viewMode: PropTypes.string,
    handleChangeViewMode: PropTypes.func,
};
export default ViewModeBtn;