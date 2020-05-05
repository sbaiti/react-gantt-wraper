import React, {
  Component
} from 'react';
import FrappeGanttWrapper from './wrapperGantt';
import TaskInfoMultipleSelect from '../components/TaskInfoMultipleSelect/TaskInfoMultipleSelect';
import TaskInfoOneSelect from './TaskInfoOneSelect/TaskInfoOneSelect';
import Resizable from 're-resizable';
import PropTypes from 'prop-types';
import moment from 'moment';
import { reduce, isEqual, throttle, findIndex, find } from 'lodash';
import '../less/profil-gantt.less';
import {
  sortByStartDate,
  transfromDataProviderToTasks,
  getScrollLeftPos,
  dateChange,
  filterTasksByStartEndDate,
  filterTaskByNameItem,
  findBlockedTimeFrame,
  noActiveItem,
  renderlistItemsGrouped,
  prepareTasksAfterFilterEnd,
  prepareTasksAfterFilterStart,
  returnPosScroll,
  testIsTrue,
  isGrouping,
  getStringGrouping,
  verifyPropertyLabel,
  selectEventUpdated,
  getArrayOfGantt,
  translateActiveMonth,
  getActiveGanttAndHeader,
  scrollingLeftTheGantt,
  prepareTaskBeforeRequest,
  dateChangeGroupedTask,
  handleFacusTaskSelected,
  getPosMonth,
  focusMonthTaskActive,
  fixHour,
  generate_id
} from '../utile/utile';

class GanttDiagrammComponent extends Component {
  constructor(props) {

    super(props);
    this.scrollableContainerRef = React.createRef();
    this.ganttListRef = React.createRef();
    this.state = {
      tasks: null,
      headerWidth: null,
      startFilter: null,
      endFilter: null,
      BlockedTimeFrame: null,
      indexActive: null,
      itemActive: null,
      scrollXPos: null,
      scrollTop: null,
      tasksItems: null,
      toggleItemsSelect: null,
      listItemsSelected: null,
      isDragTask: false
    };
    this.handleDateChange = this.handleDateChange.bind(this);
    this.handleFilterChangeStart = this.handleFilterChangeStart.bind(this);
    this.handleFilterChangeEnd = this.handleFilterChangeEnd.bind(this);
    this.handleSelectItem = this.handleSelectItem.bind(this);
    this.setIndexActive = this.setIndexActive.bind(this);
    this.setScrollPos = this.setScrollPos.bind(this);
    this.getCurrentAndTargetRefs = this.getCurrentAndTargetRefs.bind(this);
    this.scrollTopFunction = this.scrollTopFunction.bind(this);
    this.debouncedScrollController = this.debouncedScrollController.bind(this);
    this.updateState = this.updateState.bind(this);
    this.updateStateAferFilterEnd = this.updateStateAferFilterEnd.bind(this);
    this.updateStateAferFilterStart = this.updateStateAferFilterStart.bind(this);
    this.ganttWithoutGrouping = this.ganttWithoutGrouping.bind(this);
  }

  /*-------------------------------------------------
  --------------- Component life cycle ---------------
    -------------------------------------------------*/
  componentWillMount() {
    const { dataProvider, groupingAttribute, fields, dateFormat } = this.props;
    if (dataProvider && dataProvider.length > 0) {
      let labelBarTask;
      let activePropertyLabel;
      const tasks = sortByStartDate({
        tasks: transfromDataProviderToTasks(dataProvider, fields, dateFormat)
      });
      if (fields.labelBar && fields.labelBar.length > 0) {
        labelBarTask = isGrouping(fields.labelBar, tasks[0]);
      }
      if (!labelBarTask || !fields.labelBar || fields.labelBar.length === 0)
        console.error('Please verify your labelBar !');
      if (fields.propertyLabel) {
        activePropertyLabel = verifyPropertyLabel(fields.propertyLabel, tasks[0]);
      }
      if (groupingAttribute && groupingAttribute.length > 0) {
        const validGroupedItem = isGrouping(groupingAttribute, tasks[0]);
        if (!validGroupedItem) console.error('Please verify your groupingAttribute ');
        if (validGroupedItem && validGroupedItem.length > 0) {
          let listItemsSelected = renderlistItemsGrouped(tasks, validGroupedItem);
          const tasksItems = listItemsSelected.map(elem =>
            findBlockedTimeFrame(filterTaskByNameItem(elem, tasks, validGroupedItem), validGroupedItem)
          );
          this.setState({
            tasks,
            allTaskss: reduce(tasksItems, (acc, elem) => {
              acc.push(...elem);
              return acc;
            }
              , []
            ),
            BlockedTimeFrame: tasksItems.map(elem => (this.updateState(elem))),
            toggleItemsSelect: listItemsSelected.map(() => false),
            tasksItems: tasks,
            listItemsSelected: listItemsSelected,
            groupingAttribute: validGroupedItem,
            idGantt: generate_id(tasks[0]),
            labelBar: labelBarTask,
            propertyLabel: activePropertyLabel
          });
        }
        else this.ganttWithoutGrouping(tasks, labelBarTask, activePropertyLabel);
      }
      else this.ganttWithoutGrouping(tasks, labelBarTask, activePropertyLabel);
    }
    else return null;
  }

  componentDidMount() {
    const { tasks, groupingAttribute, idGantt } = this.state;
    if (tasks) {
      if (tasks.length) {
        const gantt = document.getElementsByClassName('gantt');
        const arrayGantt = getArrayOfGantt();
        if (arrayGantt.length === 1) {
          gantt[0].getAttribute('width') ?
            this.setState({
              headerWidth: gantt[0].getAttribute('width')
            }) :
            this.setState({
              headerWidth: gantt[1].getAttribute('width')
            });
        }
        else {
          const index = getActiveGanttAndHeader(arrayGantt, idGantt)[2];
          gantt[index].getAttribute('width') ?
            this.setState({
              headerWidth: gantt[index].getAttribute('width')
            }) :
            this.setState({
              headerWidth: gantt[index + 1].getAttribute('width')
            });
        }
      }
      if (!groupingAttribute)
        handleFacusTaskSelected(tasks[0].id, this.setScrollPos, idGantt);
    }
  }

  componentWillReceiveProps(newProps) {
    if (!isEqual(newProps.dataProvider, this.props.dataProvider)) {
      this.setState({
        tasks: sortByStartDate({
          tasks: transfromDataProviderToTasks(
            newProps.dataProvider,
            newProps.fields,
            newProps.dateFormat
          )
        })
      });
    }
  }

  /*-------------------------------------------------
  --------------- Component Functions  ---------------
    -------------------------------------------------*/

  handleDateChange(task, start, end) {
    const { tasks, BlockedTimeFrame, tasksItems, groupingAttribute } = this.state;
    const { viewMode, dateFormat } = this.props;
    const scrollPos = getScrollLeftPos(this.scrollableContainerRef);
    const newDateStart = moment(start).locale(dateFormat).toISOString();
    const newDateEnd = moment(end).locale(dateFormat).toISOString();
    const taskChangedIndex = findIndex(tasks, { id: task.id });
    const timeStart = viewMode === 'Hour' ? newDateStart.substring(11) : (task.start).substring(11);
    const timeEnd = viewMode === 'Hour' ? fixHour(newDateEnd).substring(11) : (task.end).substring(11);
    const trueStart = newDateStart.substring(0, 11) + timeStart;
    const trueEnd = newDateEnd.substring(0, 11) + timeEnd;
    let taskrequest = { ...task, start: trueStart, end: trueEnd };
    if (groupingAttribute) {
      const taskMultiSelectIndex = findIndex(BlockedTimeFrame, { id: task.id });
      const taskMultiSelectIndexTasks = findIndex(tasksItems, { id: task.id });
      const newTasks = tasksItems;
      newTasks[taskMultiSelectIndexTasks] = taskrequest;
      this.setState(dateChangeGroupedTask(this.state, task, trueStart, trueEnd, taskMultiSelectIndex, newTasks, scrollPos, taskChangedIndex),
        () => (this.scrollableContainerRef.current.scrollLeft = scrollPos)
      );
    } else {
      this.setState(
        dateChange(this.state, task, trueStart, trueEnd, taskChangedIndex),
        () => (this.scrollableContainerRef.current.scrollLeft = scrollPos)
      );
    }
    const finalTaskResquest = prepareTaskBeforeRequest(this.props.fields, task, taskrequest, trueStart, trueEnd);
    selectEventUpdated(task);
    this.props.executeFunction(finalTaskResquest);
  }

  setScrollPos(posLeft, posTop, month) {
    this.setState({
      scrollXPos: posLeft,
      scrollTop: posTop
    }, () => {
      const arrayGantt = getArrayOfGantt();
      if (this.scrollableContainerRef)
        this.scrollableContainerRef.current.scrollLeft = posLeft;
      const { idGantt } = this.state;
      if (arrayGantt.length === 1) { this.scrollableContainerRef.current.scrollTop = posTop; }
      else {
        const ganttActive = find(arrayGantt, (elem) => elem.id === idGantt);
        ganttActive.scrollTop = posTop;
      }
      focusMonthTaskActive(month, idGantt, this.props.viewMode);
    });
  }

  getCurrentAndTargetRefs({ scrollSrc }, ref) {
    const posScroll = {
      currentRef: ref.current,
      targetRef: this.scrollableContainerRef.current
    };
    const { groupingAttribute } = this.state;
    if (!groupingAttribute) {
      if (scrollSrc === 'GANTT_LIST')
        return posScroll;
      else
        return returnPosScroll(ref, 'tasks__info__wrapper');
    } else {
      if (scrollSrc === 'GANTT_LIST') {
        return posScroll;
      } else
        return returnPosScroll(ref, 'items__info__wrapper');
    }
  }

  scrollTopFunction(...args) {
    const { currentRef, targetRef } = this.getCurrentAndTargetRefs(...args);
    const { scrollTop } = currentRef;
    targetRef.scrollTop = scrollTop;
    const arrayGantt = getArrayOfGantt();
    let pos;
    const { idGantt } = this.state;
    if (arrayGantt.length > 1) {
      const ganttActive = getActiveGanttAndHeader(arrayGantt, idGantt)[0];
      const headerActive = getActiveGanttAndHeader(arrayGantt, idGantt)[1];
      pos = ganttActive.scrollLeft;
      headerActive.scrollLeft = pos;
    }
    else {
      pos = this.scrollableContainerRef.current.scrollLeft;
      document.querySelector('.clonedHeader').scrollLeft = pos;
    }
    if (this.props.viewMode === 'Day') {
      const posMonth = getPosMonth(idGantt);
      const posScroll = posMonth.map(elem => elem.x.animVal[0].value);
      translateActiveMonth(posMonth, posScroll, pos);
    }
  }

  debouncedScrollController = throttle(this.scrollTopFunction, 30);

  handleFilterChangeStart(date) {
    const { groupingAttribute, tasks, listItemsSelected, endFilter } = this.state;
    let BlockedTime;
    if (groupingAttribute) { BlockedTime = prepareTasksAfterFilterStart(listItemsSelected, groupingAttribute, date, tasks, endFilter, this.props.dateFormat); }
    if (date) {
      if (groupingAttribute) {
        this.updateStateAferFilterStart(BlockedTime, listItemsSelected, tasks, moment(date).locale(this.props.dateFormat).toISOString(), endFilter);
      } else {
        this.setState({
          startFilter: moment(date).locale(this.props.dateFormat).toISOString()
        });
      }
    } else if (groupingAttribute) {
      this.updateStateAferFilterStart(BlockedTime, listItemsSelected, tasks, null, endFilter);
    } else {
      this.setState({
        startFilter: null
      });
    }
  }

  handleFilterChangeEnd(date) {
    const { groupingAttribute, tasks, listItemsSelected, startFilter } = this.state;
    let BlockedTime;
    if (groupingAttribute)
      BlockedTime = prepareTasksAfterFilterEnd(listItemsSelected, groupingAttribute, date, tasks, startFilter, this.props.dateFormat);
    if (date) {
      if (groupingAttribute) {
        this.updateStateAferFilterEnd(BlockedTime, listItemsSelected, tasks, startFilter, moment(date).locale(this.props.dateFormat).toISOString());
      } else {
        this.setState({
          endFilter: moment(date).locale(this.props.dateFormat).toISOString()
        });
      }
    } else if (groupingAttribute) {
      this.updateStateAferFilterEnd(BlockedTime, listItemsSelected, tasks, startFilter, null);
    } else {
      this.setState({
        endFilter: null
      });
    }
  }

  handleSelectItem(index) {
    const { toggleItemsSelect } = this.state;
    this.setState({
      toggleItemsSelect: [
        ...toggleItemsSelect.slice(0, index),
        !toggleItemsSelect[index],
        ...toggleItemsSelect.slice(index + 1)
      ]
    });
  }

  setIndexActive(isSelected, item) {
    const { BlockedTimeFrame, groupingAttribute, tasksItems } = this.state;
    const groupingString = getStringGrouping(groupingAttribute, item);
    const taskIndex = findIndex(BlockedTimeFrame, { global: groupingString });
    let ganttTasks = BlockedTimeFrame;
    if (!isSelected) {
      ganttTasks = [...BlockedTimeFrame.slice(0, taskIndex + 1),
      ...filterTaskByNameItem(item, tasksItems, groupingAttribute),
      ...BlockedTimeFrame.slice(taskIndex + 1)
      ];
    } else {
      ganttTasks = ganttTasks.filter(task => (!(task.ID && testIsTrue(task, groupingAttribute, item))));
    }

    this.setState({
      indexActive: taskIndex,
      itemActive: item,
      BlockedTimeFrame: ganttTasks
    }, () => {
      const lengthNewArrayTasks = this.state.BlockedTimeFrame.length;
      const { BlockedTimeFrame, idGantt } = this.state;
      if (taskIndex + 1 <= lengthNewArrayTasks - 1 && BlockedTimeFrame[taskIndex + 1].name !== 'Blocked')
        handleFacusTaskSelected(BlockedTimeFrame[taskIndex + 1].id, this.setScrollPos, idGantt);
    });
  }

  updateState(item) {
    return {
      start: item[0].start || null,
      end: item[item.length - 1].end || null,
      global: item[0].global || null,
      name: 'Blocked'
    };
  }

  updateStateAferFilterEnd(BlockedTime, listItemsSelected, tasks, startFilter, date) {
    this.setState({
      endFilter: date,
      LastBlockedTime: this.state.BlockedTimeFrame,
      BlockedTimeFrame: BlockedTime.map(elem => (elem.length ? {
        ...this.updateState(elem)
      } : {
          name: 'no task still after filter'
        })),
      toggleItemsSelect: listItemsSelected.map(() => false),
      tasksItems: filterTasksByStartEndDate(tasks, startFilter, date)
    });
  }

  updateStateAferFilterStart(BlockedTime, listItemsSelected, tasks, date, endFilter) {
    this.setState({
      startFilter: date,
      LastBlockedTime: this.state.BlockedTimeFrame,
      BlockedTimeFrame: BlockedTime.map(elem => (elem.length ? {
        ...this.updateState(elem)
      } : {
          name: 'no task still after filter'
        })),
      toggleItemsSelect: listItemsSelected.map(() => false),
      tasksItems: filterTasksByStartEndDate(tasks, date, endFilter)
    });
  }

  ganttWithoutGrouping(tasks, labelBarTask, activePropertyLabel) {
    this.setState({
      tasks,
      idGantt: generate_id(tasks[0]),
      labelBar: labelBarTask,
      propertyLabel: activePropertyLabel
    });
  }

  render() {
    if (this.state.tasks === null) {
      return (
        <div className="gantt__filter">
          <h1> the dataProvider is null !</h1>
        </div>
      );
    }
    if (!this.state.tasks) { return null; }

    const { fields, viewMode, handleClick, listWidth, dateFormat, duration, optionShowDate, unitDuration, glyphicon } = this.props;

    const { tasks, idGantt, propertyLabel, labelBar, startFilter, endFilter, BlockedTimeFrame, toggleItemsSelect, groupingAttribute, listItemsSelected, headerWidth, scrollTop } = this.state;

    const filteredTasks = filterTasksByStartEndDate(tasks, startFilter, endFilter);

    const effectiveTasks = startFilter || endFilter ? filteredTasks : tasks;

    if (!groupingAttribute) {
      return (
        <div className="gantt__container">
          <Resizable
            defaultSize={{ width: listWidth }}
            enable={{
              top: false,
              right: true,
              bottom: false,
              left: false,
              topRight: false,
              bottomRight: false,
              bottomLeft: false,
              topLeft: false
            }}
          >
            <div className="gantt__list">
              <TaskInfoOneSelect
                tasks={effectiveTasks}
                fields={fields}
                propertyLabel={propertyLabel}
                idGantt={idGantt}
                dateFormat={dateFormat}
                duration={duration}
                glyphicon={glyphicon}
                unitDuration={unitDuration}
                optionShowDate={optionShowDate}
                handleFilterChangeStart={this.handleFilterChangeStart}
                handleFilterChangeEnd={this.handleFilterChangeEnd}
                setScrollPos={this.setScrollPos}
                scrollTop={scrollTop}
                debouncedScrollController={this.debouncedScrollController}
              />
            </div>
          </Resizable>
          <div className="header__and__gantt">
            <div className="clonedHeader"
              id={idGantt}
              onScroll={throttle(() => {
                scrollingLeftTheGantt(idGantt, this.scrollableContainerRef);
              }, 40)}>
              <svg className="date" width={headerWidth} id={idGantt} />
            </div>
            <div
              className="gantt__component"
              id={idGantt}
              ref={this.scrollableContainerRef}
              onScroll={() =>
                this.debouncedScrollController(
                  { scrollSrc: 'GANTT_COMPONENT' },
                  this.scrollableContainerRef
                )
              }
            >
              <FrappeGanttWrapper
                idGantt={idGantt}
                effectiveTasks={effectiveTasks}
                dateFormat={dateFormat}
                labelBar={labelBar}
                appTasks={effectiveTasks}
                handleClick={handleClick}
                handleDateChange={this.handleDateChange}
                viewMode={viewMode}
              />
            </div>
          </div>
        </div>
      );
    } else {
      let allTasks;
      if (!isEqual(tasks, effectiveTasks) || this.state.isDragTask) {
        allTasks = findBlockedTimeFrame(effectiveTasks, groupingAttribute);
      }
      else allTasks = this.state.allTaskss;
      return (
        <div className="gantt__container">
          <Resizable
            defaultSize={{ width: listWidth }}
            enable={{
              top: false,
              right: true,
              bottom: false,
              left: false,
              topRight: false,
              bottomRight: false,
              bottomLeft: false,
              topLeft: false
            }}
          >
            <div className="gantt__list">
              <TaskInfoMultipleSelect
                tasks={tasks}
                tasksFiltred={effectiveTasks}
                fields={fields}
                propertyLabel={propertyLabel}
                dateFormat={dateFormat}
                idGantt={idGantt}
                duration={duration}
                glyphicon={glyphicon}
                unitDuration={unitDuration}
                optionShowDate={optionShowDate}
                listItemsSelected={listItemsSelected}
                groupingAttribute={groupingAttribute}
                BlockedTimeFrame={BlockedTimeFrame}
                toggleItemsSelect={toggleItemsSelect}
                setIndexActive={this.setIndexActive}
                setScrollPos={this.setScrollPos}
                handleSelectItem={this.handleSelectItem}
                debouncedScrollController={this.debouncedScrollController}
                handleFilterChangeStart={this.handleFilterChangeStart}
                handleFilterChangeEnd={this.handleFilterChangeEnd} />
            </div>
          </Resizable>
          <div className="header__and__gantt">
            <div className="clonedHeader"
              id={idGantt}
              onScroll={throttle(() => {
                scrollingLeftTheGantt(idGantt, this.scrollableContainerRef);
              }, 40)}>
              <svg className="date" width={headerWidth} id={idGantt} />
            </div>

            <div className="gantt__component"
              id={idGantt}
              ref={this.scrollableContainerRef}
              onScroll={() =>
                this.debouncedScrollController(
                  { scrollSrc: 'GANTT_COMPONENT' },
                  this.scrollableContainerRef
                )
              }>
              <FrappeGanttWrapper
                idGantt={idGantt}
                effectiveTasks={effectiveTasks}
                appTasks={BlockedTimeFrame}
                dateFormat={dateFormat}
                allTasks={allTasks}
                groupingAttribute={groupingAttribute}
                toggleItemsSelect={toggleItemsSelect}
                viewMode={viewMode}
                handleClick={handleClick}
                handleDateChange={this.handleDateChange}
                noActiveItem={noActiveItem}
                labelBar={labelBar}
              />
            </div>
          </div>
        </div>);
    }
  }
}
GanttDiagrammComponent.propTypes = {
  dataProvider: PropTypes.array,
  viewMode: PropTypes.string,
  dateRangeValue: PropTypes.object,
  fields: PropTypes.object,
  groupingAttribute: PropTypes.array,
  handleClick: PropTypes.func,
  executeFunction: PropTypes.func,
  listWidth: PropTypes.string,
  dateFormat: PropTypes.string,
  duration: PropTypes.bool,
  optionShowDate: PropTypes.string,
  glyphicon: PropTypes.string,
  unitDuration: PropTypes.string

};
export default GanttDiagrammComponent;