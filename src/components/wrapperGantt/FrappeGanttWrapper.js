import React, { Component } from 'react';
import Gantt from '../../gantt';
import PropTypes from 'prop-types';
import { isEqual } from 'lodash';
import '../../less/css.less';

class FrappeGanttWrapper extends Component {
    constructor() {
        super();
        this.ganttRef = React.createRef();
    }
    componentDidMount() {
        const {
            handleDateChange,
            handleClick,
            handleProgressChange,
            appTasks,
            viewMode,
            allTasks,
            labelBar,
            dateFormat,
            groupingAttribute,
            idGantt,
            effectiveTasks

        } = this.props;

        this.gantt_chart = new Gantt(this.ganttRef.current, appTasks, allTasks, {
            on_click: handleClick,
            on_date_change: handleDateChange,
            on_progress_change: handleProgressChange
        }, idGantt, labelBar, groupingAttribute, dateFormat, effectiveTasks);
        this.gantt_chart.change_view_mode(viewMode);
    }

    componentDidUpdate(prevProps) {
        if (!isEqual([prevProps], [this.props])) {
            const { handleClick, handleDateChange, handleProgressChange, groupingAttribute,
                toggleItemsSelect, noActiveItem, labelBar, allTasks, appTasks, viewMode,
                dateFormat, idGantt, effectiveTasks } = this.props;
            const param = {
                on_click: handleClick,
                on_date_change: handleDateChange,
                on_progress_change: handleProgressChange
            };
            if (toggleItemsSelect) {
                this.gantt_chart.refresh(appTasks,
                    param
                    , allTasks, dateFormat, idGantt, effectiveTasks, labelBar, groupingAttribute, toggleItemsSelect, noActiveItem);
                this.gantt_chart.change_view_mode(viewMode);
            } else {
                this.gantt_chart.refresh(appTasks,
                    param
                    , allTasks, dateFormat, idGantt, effectiveTasks, labelBar);
                this.gantt_chart.change_view_mode(viewMode);
            }
        }
    }

    render() {
        return (
            <div className="gantt__wrapper">
                <div ref={this.ganttRef} />
            </div>
        );
    }
}

FrappeGanttWrapper.propTypes = {
    handleDateChange: PropTypes.func,
    handleClick: PropTypes.func,
    handleProgressChange: PropTypes.func,
    appTasks: PropTypes.array,
    viewMode: PropTypes.string,
    allTasks: PropTypes.array,
    effectiveTasks: PropTypes.array,
    noActiveItem: PropTypes.func,
    labelBar: PropTypes.array,
    toggleItemsSelect: PropTypes.array,
    groupingAttribute: PropTypes.array,
    dateFormat: PropTypes.string,
    idGantt: PropTypes.string
};
export default FrappeGanttWrapper;