import date_utils from './date_utils';
import {
    $,
    createSVG
} from './svg_utils';
import Bar from './bar';
//import Arrow from './arrow';
import Popup from './popup';
import moment from 'moment';
import { find } from 'lodash';
import { isAfter } from 'date-fns';
import { generate_id } from '../utile/utile';


export default class Gantt {
    constructor(wrapper, tasks, allTasks, options, idGantt, LabelBar, groupingAttribute, dateFormat, effectiveTasks) {
        this.setup_wrapper(wrapper);
        this.setup_options(options, allTasks, LabelBar, groupingAttribute, dateFormat, idGantt, effectiveTasks);
        this.setup_tasks(tasks);
        // initialize with default view mode
        this.change_view_mode();
        this.bind_events();
    }

    setup_wrapper(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!(element instanceof HTMLElement)) {
            throw new Error('Invalid argument passed for element');
        }

        // parent div element
        this.$container = document.createElement('div');
        this.$container.classList.add('gantt-container');
        element.appendChild(this.$container);

        // parent svg element
        this.$svg = createSVG('svg', {
            append_to: this.$container,
            class: 'gantt'
        });

        // popup wrapper
        this.popup_wrapper = document.createElement('div');
        this.popup_wrapper.classList.add('popup-wrapper');
        this.$svg.parentElement.appendChild(this.popup_wrapper);
    }

    setup_options(options, allTasks, LabelBar, groupingAttribute, dateFormat, idGantt, effectiveTasks) {
        const default_options = {
            header_height: 50,
            column_width: 30,
            step: 24,
            view_modes: ['Hour', 'Quarter Day', 'Half Day', 'Day', 'Week', 'Month', 'Year'],
            bar_height: 20,
            bar_corner_radius: 3,
            arrow_curve: 5,
            padding: 18,
            view_mode: 'Day',
            custom_popup_html: null,
            allTasks: allTasks,
            LabelBar: LabelBar,
            groupingAttribute: groupingAttribute,
            dateFormat: dateFormat,
            idGantt: idGantt,
            effectiveTasks: effectiveTasks
        };
        this.options = Object.assign({}, default_options, options);
    }

    setup_tasks(tasks) {
        let error = false;
        this.tasks = tasks.map((task, i) => {
            // convert to Date objects
            if (isAfter(task.start, task.end)) {
                error = true;
                let startt = task.start;
                task.start = task.end;
                task.end = startt;
            }

            task._start = moment(task.start).locale(this.options.dateFormat).toDate();
            task._end = moment(task.end).locale(this.options.dateFormat).toDate();

            task._index = i;
            // dependencies
            // if (typeof task.dependencies === 'string' || !task.dependencies) {
            //     let deps = [];
            //     if (task.dependencies) {
            //         deps = task.dependencies
            //             .split(',')
            //             .map(d => d.trim())
            //             .filter(d => d);
            //     }
            //     task.dependencies = deps;
            // }

            // // uids
            // if (!task.id) {
            //     task.id = generate_id(task);
            // }

            return task;
        });

        // this.setup_dependencies();
        if (error) {
            console.error('START date > END date please verify your DATES !');
        }
    }
    setup_task(task) {
        task._start = moment(task.start).locale(this.options.dateFormat).toDate();
        task._end = moment(task.end).locale(this.options.dateFormat).toDate();
        if (!task.id) {
            task.id = generate_id(task);
        }
        return task;
    }

    // setup_dependencies() {
    //   this.dependency_map = {};
    //   for (let t of this.tasks) {
    //     for (let d of t.dependencies) {
    //       this.dependency_map[d] = this.dependency_map[d] || [];
    //       this.dependency_map[d].push(t.id);
    //     }
    //   }
    // }

    refresh(tasks, options, newtasksblocked, dateFormat, idGantt, effectiveTasks, LabelBar, groupingAttribute, BooleanItem, fn) {
        if (effectiveTasks.length >= 1) {
            this.setup_tasks(tasks);
        }
        else {
            this.hide_popup();
        }
        //this.change_view_mode();
        this.setup_options(options, newtasksblocked, LabelBar, groupingAttribute, dateFormat, idGantt, effectiveTasks);
        if (fn && fn(BooleanItem)) {
            this.hide_popup();
        }
        if (this.popup && fn) {
            const pos = BooleanItem.filter(elem => elem === true);
            if (pos.length > 1) {
                this.hide_popup();
            }
        }
    }

    change_view_mode(mode = this.options.view_mode) {
        this.update_view_scale(mode);
        this.setup_dates();
        this.render();
        // fire viewmode_change event
        this.trigger_event('view_change', [mode]);
    }

    update_view_scale(view_mode) {
        this.options.view_mode = view_mode;

        if (view_mode === 'Hour') {
            this.options.step = 24 / 24;
            this.options.column_width = 32;
        } else if (view_mode === 'Day') {
            this.options.step = 24;
            this.options.column_width = 32;
        } else if (view_mode === 'Half Day') {
            this.options.step = 24 / 2;
            this.options.column_width = 32;
        } else if (view_mode === 'Quarter Day') {
            this.options.step = 24 / 4;
            this.options.column_width = 32;
        } else if (view_mode === 'Week') {
            this.options.step = 24 * 7;
            this.options.column_width = 300;
        } else if (view_mode === 'Month') {
            this.options.step = 24 * 30;
            this.options.column_width = 120;
        }
        else if (view_mode === 'Year') {
            this.options.step = 24 * 365;
            this.options.column_width = 120;
        }
    }

    setup_dates() {
        if (this.options.effectiveTasks.length >= 1) {
            this.setup_gantt_dates();
            this.setup_date_values();
        }
    }

    setup_gantt_dates() {
        this.gantt_start = this.tasks[0]._start;
        this.gantt_end = this.tasks[this.tasks.length - 1]._end;
        // add date padding on both sides
        if (this.view_is(['Hour', 'Quarter Day', 'Half Day'])) {
            this.gantt_start = moment(this.gantt_start).subtract(5, 'days').locale(this.options.dateFormat).toDate();
            this.gantt_end = moment(this.gantt_end).add(5, 'days').locale(this.options.dateFormat).toDate();
        } else if (this.view_is('Month')) {
            this.gantt_start = moment(this.gantt_start).subtract(2, 'M').locale(this.options.dateFormat).toDate();
            this.gantt_end = moment(this.gantt_end).add(4, 'M').locale(this.options.dateFormat).toDate();
        } else if (this.view_is('Year')) {
            this.gantt_start = moment(this.gantt_start).subtract(5, 'Y').locale(this.options.dateFormat).toDate();
            this.gantt_end = moment(this.gantt_end).add(5, 'Y').locale(this.options.dateFormat).toDate();
        }
        else {
            this.gantt_start = moment(this.gantt_start).subtract(30, 'days').locale(this.options.dateFormat).toDate();
            this.gantt_end = moment(this.gantt_end).add(30, 'days').locale(this.options.dateFormat).toDate();
        }
    }

    setup_date_values() {
        this.dates = [];
        let cur_date = null;

        while (cur_date === null || cur_date < this.gantt_end) {
            if (!cur_date) {
                cur_date = this.gantt_start;
            } else
                if (this.view_is('Year')) {
                    cur_date = moment(cur_date).add(1, 'Y').locale(this.options.dateFormat).toDate();
                }
                else {
                    cur_date = this.view_is('Month') ?
                        moment(cur_date).add(1, 'M').locale(this.options.dateFormat).toDate() :
                        moment(cur_date).add(this.options.step, 'hours').locale(this.options.dateFormat).toDate();
                }
            this.dates.push(cur_date);
        }
    }

    bind_events() {
        if (this.options.effectiveTasks.length >= 1) {
            this.bind_grid_click();
            this.bind_bar_events();
        }
    }

    render() {
        this.clear();
        this.setup_layers();
        if (this.options.effectiveTasks.length >= 1) {
            this.make_grid();
            this.make_dates();
            this.make_bars();
            // this.make_arrows();
            // this.map_arrows_on_bars();
            this.set_width();
            this.set_scroll_position();
        }
    }

    setup_layers() {
        this.layers = {};
        const layers = ['grid', 'date', 'arrow', 'progress', 'bar', 'details'];
        // make group layers
        for (let layer of layers) {
            if (layer === 'date') {
                const headerDate = Array.from(document.getElementsByClassName('date'));
                if (headerDate.length > 1) {
                    const headerActive = find(headerDate, (elem) => elem.id === this.options.idGantt);
                    this.layers[layer] = createSVG('g', {
                        class: layer,
                        append_to: headerActive
                    });
                }
                else {
                    this.layers[layer] = createSVG('g', {
                        class: layer,
                        append_to: document.querySelector('.date')
                    });

                }
                continue;
            }
            this.layers[layer] = createSVG('g', {
                class: layer,
                append_to: this.$svg
            });
        }
    }

    make_grid() {
        this.make_grid_background();
        this.make_grid_rows();
        // this.make_grid_header();
        this.make_grid_ticks();
        //this.make_grid_highlights();
    }

    make_grid_background() {
        const grid_width = this.dates.length * this.options.column_width;
        const grid_height =
            this.options.header_height +
            this.options.padding +
            (this.options.bar_height + this.options.padding) * this.tasks.length;

        createSVG('rect', {
            x: 0,
            y: 0,
            width: grid_width,
            height: grid_height,
            class: 'grid-background',
            append_to: this.layers.grid
        });

        $.attr(this.$svg, {
            height: grid_height + this.options.padding - 25,
            width: '100%'
        });
    }

    make_grid_rows() {
        const rows_layer = createSVG('g', {
            append_to: this.layers.grid
        });
        const lines_layer = createSVG('g', {
            append_to: this.layers.grid
        });

        const row_width = this.dates.length * this.options.column_width;
        const row_height = this.options.bar_height + this.options.padding;

        let row_y = 0 + this.options.padding / 2;

        for (let task of this.tasks) {
            createSVG('rect', {
                id: task.id,
                x: 0,
                y: row_y,
                style: " fill:white; stroke: 1px solid silver",
                width: row_width,
                height: row_height,
                class: 'grid-row',
                append_to: rows_layer
            });

            createSVG('line', {
                x1: 0,
                y1: row_y + row_height,
                x2: row_width,
                y2: row_y + row_height,
                class: 'row-line',
                append_to: lines_layer
            });

            row_y += this.options.bar_height + this.options.padding;
        }
    }

    // make_grid_header() {
    //     const header_width = this.dates.length * this.options.column_width;
    //     const header_height = this.options.header_height + 10;
    //     createSVG('rect', {
    //         x: 0,
    //         y: 0,
    //         width: header_width,
    //         height: header_height,
    //         class: 'grid-header',
    //         append_to: this.layers.grid
    //     });
    // }

    make_grid_ticks() {
        let tick_x = 0;
        let tick_y = this.options.padding / 2;
        let tick_height =
            (this.options.bar_height + this.options.padding) * this.tasks.length;

        for (let date of this.dates) {
            let tick_class = 'tick';
            // thick tick for monday
            if (this.view_is('Day') && moment(date).locale(this.options.dateFormat).format('DD') === '01') {
                tick_class += ' thick';
            }
            if (this.view_is('Hour') && moment(date).locale(this.options.dateFormat).format('HH') === '00') {
                tick_class += ' thick';
            }
            // thick tick for first week
            // if (this.view_is('Week') && new Date(date).getDate() >= 1 && new Date(date).getDate() < 8) {
            //     tick_class += ' thick';
            // }
            //thick ticks for quarters
            // if (this.view_is('Month') && (date.getMonth() + 1) % 3 === 0) {
            //     tick_class += ' thick';
            // }

            //thick ticks for month
            // if (this.view_is('Month')) {
            //     tick_x +=
            //         (date_utils.get_days_in_month(date) * this.options.column_width) / 30;
            // } else if (this.view_is('Year')) {
            //     tick_x += (date_utils.get_days_in_month(date) * this.options.column_width) / 12;
            // }
            // else {
            tick_x += this.options.column_width;
            // }
            if (this.view_is('Hour')) {
                createSVG('path', {
                    d: `M ${tick_x - (this.options.column_width / 2)} ${tick_y} v ${tick_height}`,
                    class: tick_class,
                    append_to: this.layers.grid
                });
            }
            else if (this.view_is('Day')) {
                createSVG('path', {
                    d: `M ${tick_x - this.options.column_width} ${tick_y} v ${tick_height}`,
                    class: tick_class,
                    append_to: this.layers.grid
                });
            }
        }
    }

    //  make_grid_highlights() {
    //      // highlight today's date
    //      if (this.view_is('Day')) {
    //          const x =
    //              (date_utils.diff(date_utils.today(), this.gantt_start, 'hour') /
    //                  this.options.step) *
    //              this.options.column_width;
    //          const y = 0
    //          const width = this.options.column_width;
    //          const height =
    //              (this.options.bar_height + this.options.padding) * this.tasks.length +
    //              this.options.header_height +
    //              this.options.padding / 2
    //          createSVG('rect', {
    //              x,
    //              y,
    //              width,
    //              height,
    //              class: 'today-highlight',
    //              append_to: this.layers.grid
    //          });
    //      }
    //  }

    make_dates() {
        const tabDate = this.get_dates_to_draw();
        for (let i = 0; i <= (tabDate.length) - 1; i++) {
            let date = tabDate[i];
            //if (this.view_is('Day')) {
            createSVG('text', {
                id: this.options.idGantt,
                x: date.lower_x,
                y: date.lower_y,
                innerHTML: date.lower_text,
                class: 'lower-text',
                append_to: this.layers.date
            });
            //  }

            if (date.upper_text) {
                const $upper_text = createSVG('text', {
                    id: this.options.idGantt,
                    x: date.upper_x + 30,
                    y: date.upper_y,
                    innerHTML: date.upper_text,
                    class: 'upper-text',
                    append_to: this.layers.date
                });

                // remove out-of-bound dates
                if ($upper_text.getBBox().x2 > this.layers.grid.getBBox().width) {
                    $upper_text.remove();
                }
            }
        }
    }

    get_dates_to_draw() {
        let last_date = null;
        const dates = this.dates.map((date, i) => {
            const d = this.get_date_info(date, last_date, i);
            last_date = date;
            return d;
        });
        return dates;
    }

    get_date_info(date, last_date, i) {
        if (!last_date) {
            last_date = moment(date).add(1, 'Y').locale(this.options.dateFormat).toDate();
        }
        const date_text = {
            Hour_lower: moment(date).format('HH'),
            'Quarter Day_lower': moment(date).format('HH'),
            'Half Day_lower': moment(date).format('HH'),
            Day_lower: (moment(date).format('DD') !== moment(last_date).format('DD')) ?
                moment(date).format('DD') : '',
            Week_lower: moment(date).format('MM') !== moment(last_date).format('MM') ?
                (moment(date).locale(this.options.dateFormat).format('DD MMMM')) : (moment(date).locale(this.options.dateFormat).format('DD')),
            Month_lower: (moment(date).locale(this.options.dateFormat).format('MMMM YYYY')),
            Hour_upper: (moment(date).format('DD') !== moment(last_date).format('DD')) ?
                moment(date).format('MM') !== moment(last_date).format('MM') ?
                    (moment(date).locale(this.options.dateFormat).format('DD MMMM')) :
                    (moment(date).locale(this.options.dateFormat).format('DD MMMM')) +
                    ' ' +
                    (moment(date).locale(this.options.dateFormat).format('YYYY')) : '',
            'Quarter Day_upper': (moment(date).format('DD') !== moment(last_date).format('DD')) ?
                (moment(date).locale(this.options.dateFormat).format('DD MMMM')) +
                ' ' +
                (moment(date).locale(this.options.dateFormat).format('YYYY')) : '',
            'Half Day_upper':
                (moment(date).format('MM') === moment(last_date).format('MM') && i % 4 === 0) ?
                    (moment(date).locale(this.options.dateFormat).format('DD MMMM YYYY')) : '',
            Day_upper: (moment(date).format('MMMM') !== moment(last_date).format('MMMM') || (i == 2 && Number(moment(date).format('DD')) < 28)) ?
                (moment(date).locale(this.options.dateFormat).format('MMMM YYYY')) : '',
            Week_upper: moment(date).format('MM') !== moment(last_date).format('MM') ?
                (moment(date).locale(this.options.dateFormat).format('MMMM YYYY')) : '',
            Year_lower: (moment(date).locale(this.options.dateFormat).format('YYYY'))
            // Year_upper:
            //     date.getFullYear() !== last_date.getFullYear()
            //         ? date_utils.format(date, 'YYYY', this.options.language)
            //         : '',
            // Month_upper: date.getFullYear() !== last_date.getFullYear() ?
            //     date_utils.format(date, 'YYYY') : ''
        };

        const base_pos = {
            x: i * this.options.column_width,
            lower_y: this.options.header_height,
            upper_y: this.options.header_height - 25
        };
        const x_pos = {
            Hour_lower: (this.options.column_width * 2) / 2,
            Hour_upper: 0,
            'Quarter Day_lower': (this.options.column_width * 4) / 2,
            'Quarter Day_upper': 0,
            'Half Day_lower': (this.options.column_width * 2) / 2,
            'Half Day_upper': 0,
            Day_lower: this.options.column_width / 2,
            Day_upper: (this.options.column_width * 4) / 2,
            Week_lower: 0,
            Week_upper: (this.options.column_width * 4) / 2,
            Month_lower: this.options.column_width / 2,
            Month_upper: (this.options.column_width * 12) / 2,
            Year_lower: this.options.column_width / 2,
            //Year_upper: this.options.column_width * 30 / 2
        };

        return {
            upper_text: date_text[`${this.options.view_mode}_upper`],
            lower_text: date_text[`${this.options.view_mode}_lower`],
            upper_x: base_pos.x + x_pos[`${this.options.view_mode}_upper`],
            upper_y: base_pos.upper_y,
            lower_x: base_pos.x + x_pos[`${this.options.view_mode}_lower`],
            lower_y: base_pos.lower_y
        };
    }

    make_bars() {
        this.bars = [];
        let test = this.tasks;
        let test2 = this.options.allTasks;
        for (let j = 0; j <= test.length - 1; j++) {
            if (test[j].name === 'Blocked') {
                for (let i = 0; i <= test2.length - 1; i++) {
                    if (test2[i].global === test[j].global || test2[i][this.options.groupingAttribute[0]] === test[j].global) {
                        let task = this.setup_task({
                            start: test2[i].start,
                            end: test2[i].end,
                            _index: test[j]._index,
                            name: '',
                            global: test2[i].global
                        });
                        let bar = new Bar(this, task);
                        this.layers.bar.appendChild(bar.group);
                        this.bars = [...this.bars, bar];
                    }
                }
            } else {
                let bar = new Bar(this, test[j]);
                this.layers.bar.appendChild(bar.group);
                this.bars = [...this.bars, bar];
            }
        }
        return this.bars;
    }

    // make_arrows() {
    //     this.arrows = [];
    //     for (let task of this.tasks) {
    //         let arrows = [];
    //         arrows = task.dependencies
    //             .map(task_id => {
    //                 const dependency = this.get_task(task_id);
    //                 if (!dependency) return console.log('no dependancy');
    //                 const arrow = new Arrow(
    //                     this,
    //                     this.bars[dependency._index], // from_task
    //                     this.bars[task._index] // to_task
    //                 );
    //                 this.layers.arrow.appendChild(arrow.element);
    //                 return arrow;
    //             })
    //             .filter(Boolean); // filter falsy values
    //         this.arrows = this.arrows.concat(arrows);
    //     }
    // }

    // map_arrows_on_bars() {
    //     for (let bar of this.bars) {
    //         bar.arrows = this.arrows.filter(arrow => {
    //             return (
    //                 arrow.from_task.task.id === bar.task.id ||
    //                 arrow.to_task.task.id === bar.task.id
    //             );
    //         });
    //     }
    // }

    set_width() {
        const cur_width = this.$svg.getBoundingClientRect().width;
        const actual_width = this.$svg
            .querySelector('.grid .grid-row')
            .getAttribute('width');
        if (cur_width < actual_width) {
            this.$svg.setAttribute('width', actual_width);
        }
    }

    set_scroll_position() {
        const parent_element = this.$svg.parentElement;
        if (!parent_element) return;

        const hours_before_first_task = date_utils.diff(
            this.get_oldest_starting_date(),
            this.gantt_start,
            'hour'
        );

        const scroll_pos =
            (hours_before_first_task / this.options.step) *
            this.options.column_width -
            this.options.column_width;

        parent_element.scrollLeft = scroll_pos;
    }

    bind_grid_click() {
        $.on(this.$svg, 'click', '.grid-row, .grid-header', () => {
            this.unselect_all();
            this.hide_popup();
        });
    }

    bind_bar_events() {
        let is_dragging = false;
        let x_on_start = 0;
        //let y_on_start = 0;
        let is_resizing_left = false;
        let is_resizing_right = false;
        let parent_bar_id = null;
        let bars = []; // instanceof Bar
        this.bar_being_dragged = null;
        this.hide_popup();

        function action_in_progress() {
            return is_dragging || is_resizing_left || is_resizing_right;
        }

        $.on(this.$svg, 'mousedown', '.bar-wrapper, .handle', (e, element) => {
            const bar_wrapper = $.closest('.bar-wrapper', element);

            if (element.classList.contains('left')) {
                is_resizing_left = true;
            } else if (element.classList.contains('right')) {
                is_resizing_right = true;
            } else if (element.classList.contains('bar-wrapper')) {
                is_dragging = true;
            }

            bar_wrapper.classList.add('active');

            x_on_start = e.offsetX;
            //y_on_start = e.offsetY;

            parent_bar_id = bar_wrapper.getAttribute('data-id');
            const ids = [
                parent_bar_id
            ];
            bars = ids.map(id => this.get_bar(id));

            this.bar_being_dragged = parent_bar_id;

            bars.forEach(bar => {
                if (bar.task.name !== '') {
                    const $bar = bar.$bar;
                    $bar.ox = $bar.getX();
                    $bar.oy = $bar.getY();
                    $bar.owidth = $bar.getWidth();
                    $bar.finaldx = 0;
                }
            });
        });

        $.on(this.$svg, 'mousemove', e => {
            if (!action_in_progress()) return;
            const dx = e.offsetX - x_on_start;
            //const dy = e.offsetY - y_on_start;
            this.hide_popup();
            bars.forEach(bar => {
                if (bar.task.name !== '') {
                    const $bar = bar.$bar;
                    $bar.finaldx = this.get_snap_position(dx);
                    if (is_resizing_left) {
                        if (parent_bar_id === bar.task.id) {
                            bar.update_bar_position({
                                x: $bar.ox + $bar.finaldx,
                                width: $bar.owidth - $bar.finaldx
                            });
                            //if (this.popup){this.popup.parent.style.left=`${dx}+px`;}
                        } else {
                            bar.update_bar_position({
                                x: $bar.ox + $bar.finaldx
                            });
                            //if (this.popup){this.popup.parent.style.left=`${dx}+px`;}

                        }
                    } else if (is_resizing_right) {
                        if (parent_bar_id === bar.task.id) {
                            bar.update_bar_position({
                                width: $bar.owidth + $bar.finaldx
                            });
                            //if (this.popup){this.popup.parent.style.left=`${dx}+px`;}

                        }
                    } else if (is_dragging) {
                        bar.update_bar_position({
                            x: $bar.ox + $bar.finaldx
                        });
                        //if (this.popup){this.popup.parent.style.left=`${dx}+px`;}

                    }
                }
            });
        });

        document.addEventListener('mouseup', e => {
            e.preventDefault();
            if (is_dragging || is_resizing_left || is_resizing_right) {
                bars.forEach(bar => bar.group.classList.remove('active'));
            }

            is_dragging = false;
            is_resizing_left = false;
            is_resizing_right = false;
        });

        $.on(this.$svg, 'mouseup', e => {
            e.preventDefault();
            this.bar_being_dragged = null;
            bars.forEach(bar => {
                const $bar = bar.$bar;
                if (!$bar.finaldx) return;
                bar.date_changed();
                bar.set_action_completed();
            });
        });

        this.bind_bar_progress();
    }

    bind_bar_progress() {
        let x_on_start = 0;
        //let y_on_start = 0;
        let is_resizing = null;
        let bar = null;
        let $bar_progress = null;
        let $bar = null;

        $.on(this.$svg, 'mousedown', '.handle.progress', (e, handle) => {
            is_resizing = true;
            x_on_start = e.offsetX;
            //y_on_start = e.offsetY;

            const $bar_wrapper = $.closest('.bar-wrapper', handle);
            const id = $bar_wrapper.getAttribute('data-id');
            bar = this.get_bar(id);

            $bar_progress = bar.$bar_progress;
            $bar = bar.$bar;

            $bar_progress.finaldx = 0;
            $bar_progress.owidth = $bar_progress.getWidth();
            $bar_progress.min_dx = -$bar_progress.getWidth();
            $bar_progress.max_dx = $bar.getWidth() - $bar_progress.getWidth();
        });

        $.on(this.$svg, 'mousemove', e => {
            if (!is_resizing) return;
            let dx = e.offsetX - x_on_start;
            //let dy = e.offsetY - y_on_start;

            if (dx > $bar_progress.max_dx) {
                dx = $bar_progress.max_dx;
            }
            if (dx < $bar_progress.min_dx) {
                dx = $bar_progress.min_dx;
            }

            const $handle = bar.$handle_progress;
            $.attr($bar_progress, 'width', $bar_progress.owidth + dx);
            $.attr($handle, 'points', bar.get_progress_polygon_points());
            $bar_progress.finaldx = dx;
        });

        $.on(this.$svg, 'mouseup', () => {
            is_resizing = false;
            if (!($bar_progress && $bar_progress.finaldx)) return;
            bar.progress_changed();
            bar.set_action_completed();
        });
    }

    // get_all_dependent_tasks(task_id) {
    //   let out = [];
    //   let to_process = [task_id];
    //   while (to_process.length) {
    //     const deps = to_process.reduce((acc, curr) => {
    //       acc = acc.concat(this.dependency_map[curr]);
    //       return acc;
    //     }, []);

    //     to_process = deps.filter(d=> !to_process.includes(d));
    //     out = out.concat(deps);
    //   }

    //   return out.filter(Boolean);
    // }

    get_snap_position(dx) {
        let odx = dx,
            rem,
            position;

        if (this.view_is('Week')) {
            rem = dx % (this.options.column_width / 7);
            position =
                odx -
                rem +
                (rem < this.options.column_width / 14 ?
                    0 :
                    this.options.column_width / 7);
        } else if (this.view_is('Month')) {
            rem = dx % (this.options.column_width / 30);
            position =
                odx -
                rem +
                (rem < this.options.column_width / 60 ?
                    0 :
                    this.options.column_width / 30);
        } else {
            rem = dx % this.options.column_width;
            position =
                odx -
                rem +
                (rem < this.options.column_width / 2 ? 0 : this.options.column_width);
        }
        return position;
    }

    unselect_all() {
        [...this.$svg.querySelectorAll('.bar-wrapper')].forEach(el => {
            el.classList.remove('active');
        });
    }

    view_is(modes) {
        if (typeof modes === 'string') {
            return this.options.view_mode === modes;
        }

        if (Array.isArray(modes)) {
            return modes.some(mode => this.options.view_mode === mode);
        }

        return false;
    }

    get_task(id) {
        return this.tasks.find(task => {
            return task.id === id;
        });
    }

    get_bar(id) {
        return this.bars.find(bar => {
            return bar.task.id === id;
        });
    }

    show_popup(options) {

        if (!this.popup) {
            if (options.task.name !== '') {
                this.popup = new Popup(
                    this.popup_wrapper,
                    this.options.custom_popup_html
                );
            }
        }
        if (options.task.name !== '') {
            this.popup.show(options);
        }
    }

    hide_popup() {
        this.popup && this.popup.hide();
    }

    trigger_event(event, args) {
        if (this.options['on_' + event]) {
            this.options['on_' + event].apply(null, args);
        }
    }

    /**
     * Gets the oldest starting date from the list of tasks
     *
     * @returns Date
     * @memberof Gantt
     */
    get_oldest_starting_date() {
        return this.tasks
            .map(task => task._start)
            .reduce(
                (prev_date, cur_date) => (cur_date <= prev_date ? cur_date : prev_date)
            );
    }

    /**
     * Clear all elements from the parent svg element
     *
     * @memberof Gantt
     */
    clear() {
        this.$svg.innerHTML = '';
    }
}