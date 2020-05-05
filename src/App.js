import React, { Component } from "react";
import { GanttDiagrammComponent } from "./components";
import GanttController from "./components/GanttController/index";
import pdplus from "./data/pdplus.json";

class App extends Component {
    state = {
        viewMode: "Hour",
        dateData: {
            optionShowDate: "date time",
            duration: true,
            unitDuration: 'd'
        },
        dataProvider: pdplus.slice(0,20),
        fields: {
            id: "ROWID",
            start: "Start",
            end: "Ende",
            name: "NAME",
            labelBar: ["BEnUTzER", "NAxwME"],
            propertyLabel: "naMe",
            labels: { start: "Start", end: "Ende", dauer: "Dauer" }
        },
        listWidth: "600px",
        glyphicon: 'resize-small',
        groupingAttribute: ["BENUTzsER", "stafftus"],
        dateFormat: "en",
        service: {
            name: "/API/ERP/Organization/Event",
            itemName: "Event",
            keys: ["ROWID"]
        }
    };

    handleChangeViewMode = value =>
        this.setState({
            viewMode: value
        });

    handleInitiateStartEndDate = () =>
        this.setState({
            startDate: null,
            endDate: null
        });

    handleEditTaskLabel = newTaskLabel => {
        this.setState({
            propertyLabel: newTaskLabel
        });
    };

    handleClick = task => console.log("task", task);

    handleViewChange = mode => {
        console.log("mode", mode);
    };

    handleOnDataProviderChange() {
        this.setState(() => ({
            dataProvider: pdplus
        }));
    }

    executeFunction = () => {
        console.log("");
    };

    render() {
        const {
            dataProvider,
            fields,
            viewMode,
            listWidth,
            propertyLabel,
            groupingAttribute,
            dateFormat,
            dateData,
            glyphicon
        } = this.state;

        const { handleClick, handleEditTaskLabel, handleChangeViewMode } = this;

        const controllerProps = {
            handleChangeViewMode,
            handleEditTaskLabel,
            propertyLabel,
            viewMode
        };

        return (
            <div className="gantt">
                <GanttController {...controllerProps} />
                <GanttDiagrammComponent
                    listWidth={(listWidth >= '600px') ? listWidth : '600px'}
                    viewMode={viewMode ? viewMode : 'Day'}
                    dataProvider={dataProvider}
                    glyphicon={glyphicon ? glyphicon : ''}
                    fields={fields}
                    duration={(dateData && dateData.duration) ? dateData.duration : false}
                    unitDuration={(dateData && dateData.unitDuration) ? dateData.unitDuration : ''}
                    optionShowDate={(dateData && dateData.optionShowDate) ? dateData.optionShowDate : 'date'}
                    groupingAttribute={groupingAttribute}
                    dateFormat={dateFormat}
                    handleClick={handleClick}
                    executeFunction={this.executeFunction}
                />
            </div>
        );
    }
}

export default App;
