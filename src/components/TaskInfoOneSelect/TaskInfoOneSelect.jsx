import React from 'react';
import PropTypes from 'prop-types';
import TaskItem from '../../utile/TaskItem';
import {
  TasksInfoHeader
} from '../../utile/utile';
import '../../less/TaskInfoOneSelect.less';

class TaskInfoOneSelect extends React.Component {
  constructor(props) {
    super(props);
    this.taskInfoRef = React.createRef();
    this.state = {
      selectedItemId: null
    };
  }

  render() {

    const {
      tasks,
      propertyLabel,
      setScrollPos,
      scrollTop,
      handleFilterChangeStart,
      handleFilterChangeEnd,
      debouncedScrollController,
      dateFormat,
      duration,
      optionShowDate,
      fields,
      unitDuration,
      glyphicon,
      idGantt
    } = this.props;

    if (tasks.length >= 1) {
      return (
        <div className="task__info__container">
          {TasksInfoHeader(handleFilterChangeStart, handleFilterChangeEnd, propertyLabel, duration, fields, unitDuration, glyphicon)}
          <div
            className="tasks__info__wrapper"
            id={idGantt}
            ref={this.taskInfoRef}
            onScroll={() => debouncedScrollController({ scrollSrc: 'GANTT_LIST' }, this.taskInfoRef)}
          >
            {tasks.map((task, index) => (
              <TaskItem
                optionShowDate={optionShowDate}
                idGantt={idGantt}
                isSelected={task.id === this.state.selectedItemId}
                handleSelectTask={() => { this.setState({ selectedItemId: task.id }); }}
                task={task}
                duration={duration}
                unitDuration={unitDuration}
                propertyLabel={propertyLabel}
                key={index}
                dateFormat={dateFormat}
                setScrollPos={setScrollPos}
                scrollTop={scrollTop}
              />
            ))}
            <div className="list__buttom" />
          </div>
        </div>
      );
    }
    else {
      return (

        <div className="task__info__container">
          {TasksInfoHeader(handleFilterChangeStart, handleFilterChangeEnd, propertyLabel, duration, fields, unitDuration, glyphicon)}
          <div
            className="tasks__info__wrapper"
            id={idGantt}
            ref={this.taskInfoRef}
            onScroll={() => debouncedScrollController({ scrollSrc: 'GANTT_LIST' }, this.taskInfoRef)}
          >
            <div className="filter__msg">NO EVENTS STILL AFTER FILTER !</div>
          </div>
        </div>
      );

    }
  }
}
TaskInfoOneSelect.propTypes = {
  tasks: PropTypes.array,
  propertyLabel: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  setScrollPos: PropTypes.func,
  scrollTop: PropTypes.number,
  handleFilterChangeStart: PropTypes.func,
  handleFilterChangeEnd: PropTypes.func,
  debouncedScrollController: PropTypes.func,
  dateFormat: PropTypes.string,
  duration: PropTypes.bool,
  optionShowDate: PropTypes.string,
  glyphicon: PropTypes.string,
  idGantt: PropTypes.string,
  fields: PropTypes.object,
  unitDuration: PropTypes.string
};
export default TaskInfoOneSelect;