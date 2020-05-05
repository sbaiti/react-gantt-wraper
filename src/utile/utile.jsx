import React from 'react';
import DateFilterController from './filterUtile/DateFilterController';
import { filter, reduce, keys, isEmpty, find, findIndex, omit, map } from 'lodash';
import { Glyphicon } from 'react-bootstrap';
import moment from 'moment';
import { format, isAfter, isBefore, compareAsc, compareDesc, areRangesOverlapping, differenceInMinutes } from 'date-fns';


/*-------------------------------------------------
    --------------- GanttDiagrammComponent---------------
    -------------------------------------------------*/

const compareDates = asc => (...dates) =>
    asc ? compareAsc(...dates) : compareDesc(...dates);

function sortByStartDate({
    tasks,
    asc = true
}) {
    if (tasks && tasks.length) {
        tasks.sort((...dates) => compareDates(asc)(...dates.map(date => date.start)));
        return tasks;
    }
    else
        return null;
}

function prepareTasks(dataProvider, fields) {
    return reduce(dataProvider, (acc, item) => {
        const transformedItem = reduce(
            fields,
            (acc, val, key) => {
                if (['start', 'end', 'name', 'id'].includes(key) && item[val.toUpperCase()]) {
                    return {
                        ...acc,
                        [key]: item[val.toUpperCase()]
                    };
                }
                return acc;
            }, {}
        );


        if (keys(transformedItem).length > 0) {
            return [...acc, {
                ...transformedItem,
                ...item,
                dauer: differenceInMinutes(transformedItem.end, transformedItem.start)
            }];
        }
        return [...acc, {
            ...item
        }];
    }, []);
}


function transfromDataProviderToTasks(dataProvider, fields) {
    if (!fields) {
        console.error("Gantt couldn't be loaded. Please verify your fields");
        return null;
    }
    let objFields = Object.keys(fields);
    let isExist = (objFields.includes('start')) && (objFields.includes('end'))
        && (objFields.includes('name')) && (objFields.includes('id'));
    if (!isExist) {
        console.error("Gantt couldn't be loaded. Please verify your fields");
        return null;
    }
    else
        return map(prepareTasks(dataProvider || [], fields), task => ({
            ...task,
            start: moment(task.start).format(),
            end: moment(task.end).format()
        })
        );
}

function getScrollLeftPos(ref) {
    return ref.current.scrollLeft;
}

function dateChange({
    scrollPos,
    tasks
}, task, start, end, taskIndex) {
    return {
        taskChanged: task,
        scrollXPos: scrollPos,
        tasks: sortByStartDate({
            tasks: [
                ...tasks.slice(0, taskIndex),
                {
                    ...task,
                    start: start,
                    end: end,
                    isDraged: true,
                    dauer: differenceInMinutes(end, start)
                },
                ...tasks.slice(taskIndex + 1, tasks.length)
            ]
        })
    };
}

function dateChangeGroupedTask({ BlockedTimeFrame, tasks }, task, start, end, taskMultiSelectIndex, newTasks, scrollPos, taskChangedIndex) {
    return {
        indexTaskChanged: taskMultiSelectIndex,
        scrollXPos: scrollPos,
        BlockedTimeFrame: [
            ...BlockedTimeFrame.slice(0, taskMultiSelectIndex),
            {
                ...task, start, end, dauer: differenceInMinutes(end, start)
            },
            ...BlockedTimeFrame.slice(taskMultiSelectIndex + 1)
        ],
        tasks: sortByStartDate({
            tasks: [
                ...tasks.slice(0, taskChangedIndex),
                {
                    ...task, start, end, dauer: differenceInMinutes(end, start)
                },
                ...tasks.slice(taskChangedIndex + 1)
            ]
        }),
        tasksItems: sortByStartDate({
            tasks: newTasks
        }),
        isDragTask: true
    };
}


function filterTasksByStartEndDate(tasks, start, end) {
    if (start && end)

        return filter(tasks, task => isAfter(task.start, start) && isBefore(task.end, end));
    else if (start)

        return filter(tasks, task => isAfter(task.start, start));

    else if (end)
        return filter(tasks, task => isBefore(task.end, end));
    else
        return tasks;
}

/*-------------------------------------------------
    --------------- Task info ---------------
    -------------------------------------------------*/

function handleFacusTaskSelected(id, setScrollPos, idGantt) {
    const barWrappersElements = Array.from(
        document.getElementsByClassName('bar-wrapper')
    );
    const barWrappersElementsPosition = Array.from(
        document.getElementsByClassName('bar')
    );
    let listLeftScrollLeft;
    let listMultiItems;
    let month = [];
    if (getArrayOfGantt().length === 1) {
        const taskIndex = barWrappersElements.findIndex(
            elem => elem.dataset.id == id
        );
        const targetElement = barWrappersElements.filter(el =>
            el.dataset.id == id);
        month = FocusTask(targetElement[0], month);
        const pos = barWrappersElementsPosition[taskIndex + 1].x.animVal.value;
        listLeftScrollLeft = document.querySelector('.tasks__info__wrapper');
        listMultiItems = document.querySelector('.items__info__wrapper');
        if (listMultiItems) {
            setScrollPos(pos - 250, listMultiItems.scrollTop, month);
        } else {
            setScrollPos(pos - 250, listLeftScrollLeft.scrollTop, month);
        }
    }
    else {
        const barWrappersElementsGanttActive = barWrappersElements.filter(elem => elem.id === idGantt);
        const barWrapperTab = barWrappersElementsGanttActive.filter(elem => elem.attributes.name.nodeValue !== '');
        const taskIndex = barWrapperTab.findIndex(
            elem => elem.dataset.id == id
        );
        const barWrappersElementsPositionGanttActive = barWrappersElementsPosition.filter(elem => elem.id === idGantt);
        const targetElement = barWrappersElementsGanttActive.filter(el =>
            el.dataset.id == id);
        month = FocusTask(targetElement[0], month);
        const pos = barWrappersElementsPositionGanttActive[taskIndex].x.animVal.value;
        listLeftScrollLeft = Array.from(document.getElementsByClassName('tasks__info__wrapper'));
        listMultiItems = Array.from(document.getElementsByClassName('items__info__wrapper'));
        const listTasksActive = find(listLeftScrollLeft, (elem) => elem.id === idGantt);
        const listItemsActive = find(listMultiItems, (elem) => elem.id === idGantt);
        if (listItemsActive) {
            setScrollPos(pos - 250, listItemsActive.scrollTop, month);
        } else {
            setScrollPos(pos - 250, listTasksActive.scrollTop, month);
        }
    }
}

function FocusTask(task, month) {
    task.focus();
    month.push(task.getAttribute('monthActiveStart'));
    month.push(task.getAttribute('monthActiveEnd'));
    return month;
}

const TasksInfoHeader = (handleFilterChangeStart, handleFilterChangeEnd, propertyLabel, duration, fields, unitDuration, glyphicon) => (
    <div className="header__filter__container">
        <div className="filter">
            <DateFilterController
                duration={duration}
                unitDuration={unitDuration}
                fields={fields}
                handleFilterChangeStart={handleFilterChangeStart}
                handleFilterChangeEnd={handleFilterChangeEnd}
            />
        </div>
        <div className="task__item__header">
            <div className="task__header__name">
                <div className="Glyphicon__propertyLabel">
                    <div className="Glyphicon__gantt">
                        <Glyphicon glyph={glyphicon} />
                    </div>
                    <div>
                        {propertyLabel ? propertyLabel[0] : ''}
                    </div>
                </div>
            </div>
            {duration ?
                <div className="task__times__header">
                    <div>{fields.labels ? fields.labels.start : ' ' + "Start"}</div>
                    <div className="end__button">{fields.labels ? fields.labels.end : ' ' + "End"}</div>
                    <div>{(fields.labels ? ' ' + fields.labels.dauer : ' ' + "Dauer") + `(${unitDuration && unitDuration !== '' ? unitDuration : 'h'})`}</div>
                </div> :
                <div className="task__times">
                    <div>{fields.labels ? fields.labels.start : "Start"}</div>
                    <div>{fields.labels ? fields.labels.end : "End"}</div>
                </div>}
        </div>
    </div>
);

function testIsTrue(task, groupingAttribute, item) {
    const isTrue = reduce(groupingAttribute, (acc, elem) => {
        return ((item[elem] === task[elem]) && (task.name !== 'Blocked'));
    }
        , false
    );
    return isTrue;
}

function filterTaskByNameItem(item, tasks, groupingAttribute) {
    const tasksItem = tasks.filter(task => testIsTrue(task, groupingAttribute, item));
    return tasksItem;
}

function findBlockedTimeFrame(tasksItem, groupingAttribute) {
    const unionRange = reduce(tasksItem, (acc, task) => {
        const { start, end } = task;
        if (isEmpty(acc)) {
            return [{ start, end, id: task.id, global: getStringGrouping(groupingAttribute, task), name: 'Blocked' }];
        }
        if (acc[acc.length - 1].start > acc[acc.length - 1].end) {
            const container = acc[acc.length - 1].start;
            acc[acc.length - 1].start = acc[acc.length - 1].end;
            acc[acc.length - 1].end = container;
        }
        if (task.start > task.end) {
            const container = task.start;
            task.start = task.end;
            task.end = container;
        }
        const overLap = areRangesOverlapping(acc[acc.length - 1].start, acc[acc.length - 1].end, task.start, task.end);
        if (overLap) {
            return [...[...acc].slice(0, acc.length - 1), {
                start: acc[acc.length - 1].start,
                end: (acc[acc.length - 1].end > end) ? acc[acc.length - 1].end : end,
                id: task.id,
                global: getStringGrouping(groupingAttribute, task),
                name: 'Blocked'
            }];
        }
        return [...acc, { start, end, id: task.id, global: getStringGrouping(groupingAttribute, task), name: 'Blocked' }];
    }, []);
    const finaleUnionRange = reduce(unionRange, (acc, task) => {
        const { start, end } = task;
        if (isEmpty(acc)) {
            return [{ start, end, id: task.id, global: task.global, name: 'Blocked' }];
        }
        if (acc[acc.length - 1].end === task.start) {
            return [...[...acc].slice(0, acc.length - 1), {
                start: acc[acc.length - 1].start,
                end: end,
                id: task.id,
                global: task.global,
                name: 'Blocked'
            }];
        }
        return [...acc, { start, end, id: task.id, global: task.global, name: 'Blocked' }];
    }, []);
    return finaleUnionRange;
}

function findIndexOfScroll(tab, pos) {
    let i = 0;
    while (i < tab.length - 1) {
        if ((pos >= tab[i]) && (pos <= tab[i + 1] - 200))
            return i;
        else
            i = i + 1;
    }
    return null;
}

function noActiveItem(tab) {
    const tab2 = tab.filter(elem => elem === true);
    if (!tab2.length) return true;
    else
        return false;
}

function getStringGrouping(groupingAttribute, obj) {
    const stringGrp = reduce(groupingAttribute, (acc, value, key) => {
        let attribute = obj[value];
        if (key > 0 && key < groupingAttribute.length) {
            return acc + ' ' + '-' + ' ' + attribute;
        }
        else
            return acc + attribute;
    }
        , ' '
    );
    return stringGrp;
}

function renderObjectAfterGrouping(obj, groupingAttribute) {
    const helper = reduce(groupingAttribute, (acc, item) => {
        return { ...acc, [item]: obj[item] };
    }
        , {}
    );
    return helper;
}

function renderlistItemsGrouped(tab, groupingAttribute) {
    let helper = {};
    let listItemsAfterFilter = tab.reduce(function (res, obj) {
        let key = getStringGrouping(groupingAttribute, obj);
        if (!helper[key]) {
            helper[key] = renderObjectAfterGrouping(obj, groupingAttribute);
            res.push(helper[key]);
        }
        return res;
    }, []);
    return listItemsAfterFilter;
}

function prepareTasksAfterFilterEnd(validList, groupingAttribute, date, tasks, startFilter, dateFormat) {
    const dateFilter = date ? moment(date).locale(dateFormat).toISOString() : null;
    const filterTasks = filterTasksByStartEndDate(tasks, startFilter, dateFilter);
    const preparedArray = validList.map(item => {
        let filterTasksByNameItemSelect = filterTaskByNameItem(item, filterTasks, groupingAttribute);
        return findBlockedTimeFrame(filterTasksByNameItemSelect, groupingAttribute);
    });
    return preparedArray;
}

function prepareTasksAfterFilterStart(validList, groupingAttribute, date, tasks, endFilter, dateFormat) {
    const dateFilter = date ? moment(date).locale(dateFormat).toISOString() : null;
    const filterTasks = filterTasksByStartEndDate(tasks, dateFilter, endFilter);
    const preparedArray = validList.map(item => {
        let filterTasksByNameItemSelect = filterTaskByNameItem(item, filterTasks, groupingAttribute);
        return findBlockedTimeFrame(filterTasksByNameItemSelect, groupingAttribute);
    });
    return preparedArray;
}

function returnPosScroll(ref, className) {
    return {
        currentRef: ref.current,
        targetRef: Array.from(
            document.getElementsByClassName(className)
        )[0]
    };
}

function isGrouping(groupingAttribute, task) {
    const tabLabel = Object.keys(task);
    let validGroupingAttribute = [];
    for (let item of groupingAttribute) {
        if (tabLabel.includes(item))
            validGroupingAttribute.push(item);
        else if (tabLabel.includes(item.toLowerCase()))
            validGroupingAttribute.push(item.toLowerCase());
        else if (tabLabel.includes(item.toUpperCase()))
            validGroupingAttribute.push(item.toUpperCase());
    }
    if (validGroupingAttribute.length === 0) {
        return null;
    }
    else
        return validGroupingAttribute;
}

function verifyPropertyLabel(propertyLabel, task) {
    const tabAttribute = Object.keys(task);
    if ((tabAttribute.includes(propertyLabel.toUpperCase()))) {
        return [propertyLabel, propertyLabel.toUpperCase()];
    }
    else if (tabAttribute.includes(propertyLabel.toLowerCase())) {
        return [propertyLabel, propertyLabel.toLowerCase()];
    }
    else {
        console.error("Your propertyLabel doesn't exist ! ");
        return null;
    }
}

function selectEventUpdated(task) {
    const barWrappersElements = Array.from(
        document.getElementsByClassName('task__item')
    );
    const targetElement = barWrappersElements.filter(el => el.id === task.id);
    if (targetElement.length) {
        targetElement[0].setAttribute('style', 'border : 3px solid #ff9f00');
    }
}

function getArrayOfGantt() {
    const arrayGantt = Array.from(document.getElementsByClassName('gantt__component'));
    return arrayGantt;
}

function translateActiveMonth(posMonth, posScroll, pos) {
    const indexScroll = findIndexOfScroll(posScroll, pos);
    if (indexScroll !== null) {
        posMonth[indexScroll].setAttribute('transform', `translate(${pos - (posMonth[indexScroll].x.animVal[0].value - 70)},0)`);
    }
}

function focusMonthTaskActive(month, idGantt, viewMode) {
    const posMonth = getPosMonth(idGantt, viewMode);
    posMonth.map(elem => {
        (elem.innerHTML !== month[0] && elem.innerHTML !== month[1]) ? elem.style.fill = "#555" : elem.style.fill = "#ff9f00";
    });
}

function getPosMonth(idGantt, viewMode) {
    let posMonth;
    if (viewMode === 'Month') {
        posMonth = Array.from(document.getElementsByClassName('lower-text'));
    }
    else {
        posMonth = Array.from(document.getElementsByClassName('upper-text'));
    }
    const arrayGantt = getArrayOfGantt();
    if (arrayGantt.length === 1) {
        return posMonth;
    }
    else {
        const posMonthActiveGantt = posMonth.filter(elem => elem.id === idGantt);
        return posMonthActiveGantt;
    }
}

function getActiveGanttAndHeader(arrayGantt, idGantt) {
    const arrayDate = Array.from(document.getElementsByClassName('clonedHeader'));
    const ganttActive = find(arrayGantt, (elem) => elem.id === idGantt);
    const headerActive = find(arrayDate, (elem) => elem.id === idGantt);
    const indexActive = findIndex(arrayGantt, ganttActive);
    return [ganttActive, headerActive, indexActive];
}
function scrollingHeaderLeft(arrayGantt, idGantt) {
    const ganttActive = getActiveGanttAndHeader(arrayGantt, idGantt)[0];
    const headerActive = getActiveGanttAndHeader(arrayGantt, idGantt)[1];
    headerActive.scrollLeft = ganttActive.scrollLeft;
}

function scrollingLeftTheGantt(idGantt, scrollableContainerRef) {
    const arrayGantt = getArrayOfGantt();
    if (arrayGantt.length > 1) {
        scrollingHeaderLeft(arrayGantt, idGantt);
    }
    else
        (scrollableContainerRef.current.scrollLeft = document.querySelector(
            '.clonedHeader'
        ).scrollLeft);
}

function prepareTaskBeforeRequest(fields, task, taskrequest, trueStart, trueEnd) {
    taskrequest[fields.start] = trueStart;
    taskrequest[fields.end] = trueEnd;
    taskrequest[fields.id] = task.id;
    taskrequest[fields.name] = task.name;
    taskrequest.BDATUM = null;
    taskrequest.MELDESTATUS = 0;
    taskrequest = omit(taskrequest, ['start', 'end', 'id', 'isDraged', 'name', 'dependencies']);
    if (fields.start === 'START') {
        // taskrequest.VERSION = 0;
        taskrequest.DAUER = 0;
        taskrequest.COMPLETE = 0;
        taskrequest.MDATUM = null;
        taskrequest.EDATUM = null;
    }
    return taskrequest;
}


function dateFormatFn(dateFormat, date, optionShowDate) {
    moment.locale(dateFormat);
    const dateF = moment(date).format('L');
    if (optionShowDate === 'time')
        return date.slice(11, 16);
    else if (optionShowDate === 'date time') return dateF + ' ' + date.slice(11, 16);
    else return dateF;
}

function durationFN(unit, dauer) {
    if (unit === 'm') {
        return dauer;
    }
    else if (unit === 'd') {
        let res = (Number(dauer) / (60 * 24));
        if (String(res).indexOf('.') > -1)
            return Math.round(Number(res).toFixed(2));
        else return res;
    }
    else {
        let res = (Number(dauer) / 60);
        if (String(res).indexOf('.') > -1)
            return Math.round(Number(res).toFixed(2));
        else return Math.round(Number(res));
    }
}

function generate_id(task) {
    return (
        task.name +
        '_' +
        Math.random()
            .toString(36)
            .slice(2, 12)
    );
}

function fixHour(date) {
    const h = format(date, 'H');
    let time = ':00:00.000Z';
    if (Number(h) < 9) {
        time = '0' + h + time;
    }
    else
        time = h + time;
    return date.substring(0, 11) + time;
}

function SetClassName(className, isSelected) {
    if (isSelected) {
        let spans = Array.from(document.getElementsByClassName(className + '__selected'));
        if (spans.length) {
            spans.map((div) => {
                { div.className = className; }
            }
            );
        }
        return className + '__selected';
    } else
        return className;
}

export {
    sortByStartDate,
    transfromDataProviderToTasks,
    getScrollLeftPos,
    dateChange,
    filterTasksByStartEndDate,
    TasksInfoHeader,
    filterTaskByNameItem,
    findBlockedTimeFrame,
    handleFacusTaskSelected,
    noActiveItem,
    renderlistItemsGrouped,
    prepareTasksAfterFilterEnd,
    prepareTasksAfterFilterStart,
    returnPosScroll,
    getStringGrouping,
    testIsTrue,
    isGrouping,
    verifyPropertyLabel,
    selectEventUpdated,
    getArrayOfGantt,
    translateActiveMonth,
    getActiveGanttAndHeader,
    scrollingLeftTheGantt,
    prepareTaskBeforeRequest,
    dateChangeGroupedTask,
    getPosMonth,
    focusMonthTaskActive,
    dateFormatFn,
    durationFN,
    fixHour,
    generate_id,
    SetClassName
};