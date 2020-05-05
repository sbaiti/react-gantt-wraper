import React from 'react';
import PropTypes from 'prop-types';
import {
    SetClassName,
    handleFacusTaskSelected,
    dateFormatFn,
    durationFN
} from './utile';

function TaskItem({
    task,
    propertyLabel,
    setScrollPos,
    isSelected,
    handleSelectTask,
    dateFormat,
    idGantt,
    optionShowDate,
    duration,
    unitDuration
}) {
    return (
        <div
            id={task.id}
            className={SetClassName('task__item', isSelected)}
            onClick={e => {
                e.preventDefault();
                handleFacusTaskSelected(task.id, setScrollPos, idGantt);
                handleSelectTask();
            }}
        >
            <div id={task.id} className="task__name">
                {propertyLabel ? task[propertyLabel[1]] : ''}
            </div>
            <div className="task__times">
                <div>
                    {dateFormatFn(dateFormat, task.start, optionShowDate)}
                </div>
                <div>
                    {dateFormatFn(dateFormat, task.end, optionShowDate)}
                </div>
                {duration ? <div>
                    {durationFN(unitDuration, task.dauer)}
                </div> : null}
            </div>
        </div>
    );
}
TaskItem.propTypes = {
    task: PropTypes.object,
    propertyLabel: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    setScrollPos: PropTypes.func,
    isSelected: PropTypes.bool,
    handleSelectTask: PropTypes.func,
    dateFormat: PropTypes.string,
    idGantt: PropTypes.string,
    duration: PropTypes.bool,
    optionShowDate: PropTypes.string,
    unitDuration: PropTypes.string
};
export default TaskItem;