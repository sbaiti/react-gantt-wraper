import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import { Button, Label } from 'react-bootstrap';
import 'react-datepicker/dist/react-datepicker.css';
import '../../less/TaskInfoOneSelect.less';


class DateFilterController extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isFilterOpenStart: false,
      isFilterOpenEnd: false,
      startDate: moment(),
      endDate: moment()
    };
    this.handleChangeStart = this.handleChangeStart.bind(this);
    this.handleChangeEnd = this.handleChangeEnd.bind(this);
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
    this.handleToggleFilterStart = this.handleToggleFilterStart.bind(this);
    this.handleToggleFilterEnd = this.handleToggleFilterEnd.bind(this);
  }

  handleToggleFilterStart() {
    if (!this.state.isFilterOpenStart) {
      document.addEventListener('click', this.handleOutsideClick, false);
    } else {
      document.removeEventListener('click', this.handleOutsideClick, false);
    }

    this.setState({
      isFilterOpenStart: !this.state.isFilterOpenStart,
      isFilterOpenEnd: false
    });
  }
  handleToggleFilterEnd() {
    if (!this.state.isFilterOpenEnd) {
      document.addEventListener('click', this.handleOutsideClick, false);
    } else {
      document.removeEventListener('click', this.handleOutsideClick, false);
    }

    this.setState(({
      isFilterOpenEnd
    }) => ({
      isFilterOpenStart: false,
      isFilterOpenEnd: !isFilterOpenEnd
    }));
  }


  handleChangeStart(date) {
    date.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    this.setState({
      startDate: date,
      isFilterOpenStart: !this.state.isFilterOpenStart
    }, () =>
        this.props.handleFilterChangeStart(this.state.startDate));
  }
  handleChangeEnd(date) {
    date.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    this.setState({
      endDate: date,
      isFilterOpenEnd: !this.state.isFilterOpenEnd
    }, () =>
        this.props.handleFilterChangeEnd(this.state.endDate));
  }

  handleOutsideClick(e) {
    if (this.node && this.node.contains(e.target)) {
      return;
    }
    if (this.state.isFilterOpenStart) {
      this.handleToggleFilterStart();
    }
    if (this.state.isFilterOpenEnd) {
      this.handleToggleFilterEnd();
    }
  }

  render() {
    const { fields, unitDuration, duration } = this.props;
    return (
      <div className="task__item__header__filter" ref={node => { this.node = node; }}>
        <div className="task__header__name">{''}
        </div>
        <div className={`task__times${duration ? '__header' : ''}`}>
          <div>
            <Button
              bsStyle="primary"
              bsSize="small"
              onClick={this.handleToggleFilterStart}
            >
              {fields.labels ? fields.labels.start : "Start"}
            </Button>
            {this.state.isFilterOpenStart && (
              <div className="date__filter__wrapperr" ref={node => { this.node = node; }}>
                <div className="arrow__upp" />
                <DatePicker
                  inline
                  className="date__picker__style"
                  isClearable={true}
                  selected={this.state.startDate}
                  onChange={this.handleChangeStart}
                />
                <center>
                  <Button
                    bsStyle="primary"
                    bsSize="small"
                    onClick={() => {
                      this.setState({ startDate: moment(), isFilterOpenStart: !this.state.isFilterOpenStart });
                      this.props.handleFilterChangeStart(null);
                    }}
                  >
                    reset start filter
            </Button>
                </center>
              </div>
            )}
          </div>
          <div>
            <Button
              bsStyle="primary"
              bsSize="small"
              onClick={this.handleToggleFilterEnd}
            >
              {fields.labels ? fields.labels.end : "End"}
            </Button>
            {this.state.isFilterOpenEnd && (
              <div className="date__filter__wrapperr" ref={node => { this.node = node; }}>
                <div className="arrow__upp" />
                <DatePicker
                  inline
                  className="date__picker__style"
                  isClearable={true}
                  selected={this.state.endDate}
                  onChange={this.handleChangeEnd} />
                <center>
                  <Button
                    bsStyle="primary"
                    bsSize="small"
                    onClick={() => {
                      this.setState({ endDate: moment(), isFilterOpenEnd: !this.state.isFilterOpenEnd });
                      this.props.handleFilterChangeEnd(null);
                    }}
                  >
                    reset end filter
            </Button>
                </center>
              </div>
            )}
          </div>
          {duration ? <div>
            <Label
              bsStyle="default"
              bsSize="small"
            >
              {(fields.labels ? fields.labels.dauer : "Dauer") + ` (${unitDuration && unitDuration !== '' ? unitDuration : 'h'})`}
            </Label>
          </div> : null}
        </div>
      </div>
    );
  }
}
DateFilterController.propTypes = {
  handleFilterChangeStart: PropTypes.func,
  handleFilterChangeEnd: PropTypes.func,
  fields: PropTypes.object,
  unitDuration: PropTypes.string,
  duration: PropTypes.bool

};

export default DateFilterController;
