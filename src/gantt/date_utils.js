
const DAY = 'day';
import moment from 'moment';
import differenceInMilliseconds from 'date-fns/difference_in_milliseconds';

export default {
    diff(date_a, date_b, scale = DAY) {
        let milliseconds, seconds, hours, minutes, days, months, years;
        milliseconds = differenceInMilliseconds(date_a, date_b);
        seconds = milliseconds / 1000;
        minutes = seconds / 60;
        hours = minutes / 60;
        days = hours / 24;
        months = days / 30;
        years = months / 12;
        if (!scale.endsWith('s')) {
            scale += 's';
        }

        return Math.floor({
            milliseconds,
            seconds,
            minutes,
            hours,
            days,
            months,
            years
        }[scale]);
    }
    ,
    diffHour(date_a, date_b, scale = DAY) {
        let milliseconds, seconds, hours, minutes, days, months, years;
        milliseconds = differenceInMilliseconds(date_a, date_b);
        seconds = milliseconds / 1000;
        minutes = seconds / 60;
        hours = minutes / 60;
        days = hours / 24;
        months = days / 30;
        years = months / 12;
        if (!scale.endsWith('s')) {
            scale += 's';
        }
        const x = Math.floor({
            milliseconds,
            seconds,
            minutes,
            hours,
            days,
            months,
            years
        }[scale]);
        let minuteStart = Number(moment(date_a).get('minute'));
        if (minuteStart > 9 && minuteStart <= 15)
            return x + 0.25;
        else if (minuteStart > 15 && minuteStart <= 30)
            return x + 0.5;
        else if (minuteStart > 30 && minuteStart <= 45)
            return x + 0.75;
        else if (minuteStart > 45)
            return x + 1;
        else if (minuteStart == 0)
            return x ;
        else if (minuteStart > 0 && minuteStart <= 9)
            return x + 1.25;
    }
};