import React from 'react';
import TaskItems from '../../utile/TaskItems';
import PropTypes from 'prop-types';
import {
  filterTaskByNameItem, TasksInfoHeader
} from '../../utile/utile';
import '../../less/TaskInfoMultipleSelect.less';

class TaskInfoMultipleSelect extends React.Component {
  constructor(props) {
    super(props);
    this.RefTaskInfoMultiItem = React.createRef();
  }
  render() {
    const {
      listItemsSelected,
      propertyLabel,
      setScrollPos,
      BlockedTimeFrame,
      handleFilterChangeStart,
      handleFilterChangeEnd,
      debouncedScrollController,
      toggleItemsSelect,
      handleSelectItem,
      setIndexActive,
      groupingAttribute,
      dateFormat,
      duration,
      optionShowDate,
      fields,
      unitDuration,
      tasksFiltred,
      glyphicon,
      idGantt
    } = this.props;

    if (tasksFiltred.length >= 1) {
      return (
        <div className="task__info__container">
          {TasksInfoHeader(handleFilterChangeStart, handleFilterChangeEnd, propertyLabel, duration, fields, unitDuration, glyphicon)}
          <div className="items__info__wrapper"
            id={idGantt}
            ref={this.RefTaskInfoMultiItem}
            onScroll={() => {
              debouncedScrollController(
                { scrollSrc: 'GANTT_LIST' },
                this.RefTaskInfoMultiItem
              );
            }
            }>
            {listItemsSelected.map((item, index) => {
              let fiterTasks = filterTaskByNameItem(item, BlockedTimeFrame, groupingAttribute);
              return <TaskItems item={item} index={index}
                key={index}
                optionShowDate={optionShowDate}
                idGantt={idGantt}
                duration={duration}
                unitDuration={unitDuration}
                isSelected={toggleItemsSelect[index]}
                handleSelectTask={() => handleSelectItem(index)}
                tasksItem={fiterTasks}
                propertyLabel={propertyLabel}
                dateFormat={dateFormat}
                listItemsSelected={listItemsSelected}
                setIndexActive={setIndexActive}
                setScrollPos={setScrollPos}
                groupingAttribute={groupingAttribute}
              />;
            })
            }
            <div className="list__buttom" />
          </div>
        </div>
      );
    }
    else {
      return (
        <div className="task__info__container">
          {TasksInfoHeader(handleFilterChangeStart, handleFilterChangeEnd, propertyLabel, duration, fields, unitDuration, glyphicon)}
          <div className="items__info__wrapper"
            id={idGantt}
            ref={this.RefTaskInfoMultiItem}
            onScroll={() => {
              debouncedScrollController(
                { scrollSrc: 'GANTT_LIST' },
                this.RefTaskInfoMultiItem
              );
            }
            }>
            <div className="filter__msg">NO EVENTS STILL AFTER FILTER !</div>
          </div>
        </div>
      );

    }
  }
}
TaskInfoMultipleSelect.propTypes = {
  listItemsSelected: PropTypes.array,
  propertyLabel: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  setScrollPos: PropTypes.func,
  BlockedTimeFrame: PropTypes.array,
  handleFilterChangeStart: PropTypes.func,
  handleFilterChangeEnd: PropTypes.func,
  toggleItemsSelect: PropTypes.array,
  handleSelectItem: PropTypes.func,
  debouncedScrollController: PropTypes.func,
  setIndexActive: PropTypes.func,
  groupingAttribute: PropTypes.array,
  tasksFiltred: PropTypes.array,
  dateFormat: PropTypes.string,
  tasks: PropTypes.array,
  duration: PropTypes.bool,
  optionShowDate: PropTypes.string,
  idGantt: PropTypes.string,
  glyphicon: PropTypes.string,
  fields: PropTypes.object,
  unitDuration: PropTypes.string
};
export default TaskInfoMultipleSelect;