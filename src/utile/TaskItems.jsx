import React from 'react';
import PropTypes from 'prop-types';
import TaskItem from './TaskItem';
import {
  getStringGrouping
} from "./utile";

class TaskItems extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      taskSelected: null
    };
  }
  render() {
    const {
      item,
      index,
      isSelected,
      handleSelectTask,
      listeItemSelected,
      tasksItem,
      propertyLabel,
      setIndexActive,
      setScrollPos,
      groupingAttribute,
      dateFormat,
      idGantt,
      duration,
      optionShowDate,
      unitDuration
    } = this.props;
    return (
      <div>
        <div id={index} className={`task__item__item${isSelected ? '__selected' : ''}`}
          onClick={e => {
            e.preventDefault();
            handleSelectTask();
            setIndexActive(isSelected, item);
            this.setState({ taskSelected: null });
          }}>
          <div className="span__class">
            {(groupingAttribute[0] === 'BENUTZER' && groupingAttribute.length === 1) ?
              <div className="one__item__icon">
                <span className="glyphicon glyphicon-user" />
              </div> : <div>{' '}</div>
            }
            <div className="one__item__icon__select">
              {!isSelected ? <span className="glyphicon glyphicon-play">{' '}</span>
                : <span className="glyphicon glyphicon-triangle-bottom	">{' '}</span>
              }
            </div>
          </div>
          <div id={index} className="task__name__item">
            {getStringGrouping(groupingAttribute, item)}
          </div>

        </div>
        <div className="tasks__items__info__wrapper">
          {isSelected && tasksItem.map((task, index) =>
            (
              <TaskItem
                handleSelectTask={() =>
                  this.setState({ taskSelected: task })
                }
                idGantt={idGantt}
                isSelected={this.state.taskSelected === task}
                task={task}
                unitDuration={unitDuration}
                optionShowDate={optionShowDate}
                duration={duration}
                key={index}
                dateFormat={dateFormat}
                listeItemSelected={listeItemSelected}
                setScrollPos={setScrollPos}
                propertyLabel={propertyLabel} />))}
        </div>
      </div>
    );
  }
}

TaskItems.propTypes = {
  item: PropTypes.object,
  index: PropTypes.number,
  handleSelectTask: PropTypes.func,
  listeItemSelected: PropTypes.array,
  tasksItem: PropTypes.array,
  propertyLabel: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  setIndexActive: PropTypes.func,
  setScrollPos: PropTypes.func,
  isSelected: PropTypes.bool,
  optionShowDate: PropTypes.string,
  groupingAttribute: PropTypes.array,
  dateFormat: PropTypes.string,
  idGantt: PropTypes.string,
  duration: PropTypes.bool,
  unitDuration: PropTypes.string
};

export default TaskItems;