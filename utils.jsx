import {aggregationType} from './constant';

export const formatDataTypeName = (dataTypeName) => {
    switch (dataTypeName) {
        case 'STRING': 
            return 'Text';
        case 'NUMBER':
            return 'Number';
        case 'PERCENT':
            return 'Percent';
        case 'CURRENCY':
            return 'Currency';
        case 'DATE':
            return 'Date';
        case 'YEAR':
            return 'Date';
        case 'YEAR_QUARTER': 
            return 'Date';
        case 'QUARTER': 
            return 'Date';
        case 'YEAR_MONTH':
            return 'Date';
        case 'MONTH':
            return 'Date';
        case 'MONTH_DAY':
            return 'Date';
        case 'WEEK':
            return 'Date';
        case 'DAY_OF_WEEK':
            return 'Date';
        case 'DATE_HOUR':
            return 'Date';
        case 'DAY_OF_MONTH':
            return 'Date';
        case 'MINUTE':
            return 'Date';
        case 'HOUR':
            return 'Date';
        case 'COUNTRY':
            return 'Country';
        case 'CITY':
            return 'City';
        default:
            return 'Unknow';
    }
};

export const convertAggregation = (aggregationName) => {
    switch (aggregationName) {
        case aggregationType.NONE:
            return 'None';
        case aggregationType.COUNT:
            return 'Count';
        case aggregationType.COUNT_DISTINCT:
            return 'Count Distinct';
        case aggregationType.SUM:
            return 'Sum';
        case aggregationType.AVERAGE: 
            return 'Average';
        case aggregationType.MIN:
            return 'Min';
        case aggregationType.MAX: 
            return 'Max';
        default:
            return 'Unknow';
    }
};
