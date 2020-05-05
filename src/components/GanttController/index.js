import React from 'react';
import PropTypes from 'prop-types';
import ViewModeController from './ViewModeController';
import '../../less/styles.less';

function GanttController(props) {
    const {
        handleChangeViewMode,
        viewMode
    } = props;
    return (
        <div className="controller__container">
      <div className="diag__title">Digramm gantt for React</div>
      <div className="controllers__wrapper">
        <ViewModeController
          handleChangeViewMode={handleChangeViewMode}
          viewMode={viewMode}
        />
      </div>
    </div>
    );
}
GanttController.propTypes = {
    viewMode: PropTypes.string,
    handleChangeViewMode: PropTypes.func,
};
export default GanttController;