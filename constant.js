export const aggregationType = {
    NONE: 1,
    COUNT: 2,
    COUNT_DISTINCT: 3,
    SUM: 4,
    AVERAGE: 5,
    MIN: 6,
    MAX: 7
};

export const dataType = {
    STRING: 1,
    NUMBER: 2,
    PERCENT: 3,
    CURRENCY: 4,
    DATE: 5,
    COUNTRY: 6,
    CITY: 7
};

export const semanticType = {
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    PERCENT: 'PERCENT',
    CURRENCY: 'CURRENCY',
    DATE: 'DATE',
    COUNTRY: 'COUNTRY',
    CITY: 'CITY'
};

export const statusType = {
    FIELD_DISABLE: 0,
    FIELD_ENABLE: 1,
    FIELD_REMOVED: 2
};

export const dataSourceConnectorType = {
    DATASOURCE_CUSTOM_TYPE: 1,
    DATASOURCE_DEFAULT_TYPE: 2
};