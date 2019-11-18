// Libraries
import React, {Fragment, useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
import _ from 'lodash';
import {DndProvider} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import produce from 'immer';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';

// Actions
import {onProcessLoadingActive, onProcessLoadingDeactive} from 'Components/ProcessLoading/actions';
import {createReport, updateWorkspace} from 'Modules/Report/components/Workspace/actions';
import {changeReportMode} from 'Modules/Report/components/Toolbar/actions';
import {updateBreadcrumbTextTitle} from 'Src/components/BreadcrumbV2/actions';
import {updateToogleDrawer, updateSchemaForDataSource} from 'Modules/Report/components/SidePanel/actions';

// Components
import DataFreshness from './components/DataFreshness';
import Field from './components/Field';
import ModalRefreshField from 'Src/components/ModalRefreshField';

// Assets
import styles from './styles.module.less';
import Loading from 'Assets/images/loading.gif';
import {statusType} from './constant';

// Services
import * as customFieldServices from 'Services/Report/customField';
import * as schemaListServices from 'Services/Report/schema';
import * as fieldServices from 'Services/v3.1/DataSource/field';
import * as datasourceServices from 'Services/v3.1/DataSource';

// Actions
import {updateToggleDrawer} from 'Modules/Report/components/SidePanel/actions';

// Utils
import {withTranslation} from 'Locale/withTranslation';
import {appConfig} from 'Src/constant';
import {handleError} from 'Src/handleError';
import {getLinkFromState, getObjectPropSafely} from 'Src/utils';
import usePrevious from 'Hooks/usePrevious';
import {dataSourceConnectorType} from './constant';
import {clearSchemaCache} from 'Modules/Report/components/Workspace/utils';

const PATH = 'modules/Report/containers/DataSources/containers/Fields/index.jsx';

const defaultState = {
    fields: [],
    inputDescription: [],
    inputSearch: '',
    isLoading: false,
    schemas: [],
    limit: 15,
    isShowEditDataFreshness: false,
    isShowRefreshData: false,
    isUpdateField: false,
    dataSourceInfo: {
        dataSourceId: '',
        dataSourceName: '',
        timeRefresh: 1,
        status: 1,
        connector: {
            type: 1
        }
    }
};

const formattedDataType = {
    STRING: 1,
    NUMBER: 2,
    PERCENT: 3,
    CURRENCY: 4,
    DATE: 5,
    COUNTRY: 6,
    CITY: 7
};

const formatDataFreshness = {
    1: '15 minutes',
    2: '4 hours',
    3: '12 hours'
};

const DetailDataSource = (props) => {
    const tableRef = useRef(null);

    const [schemas, setSchemas] = useState(defaultState.schemas); // schemas array include all fields of current datasource
    const [fields, setFields] = useState(defaultState.fields); // fields array include only limit of schemas
    const [isShowEditDataFreshness, setIsShowEditDataFreshness] = useState(defaultState.isShowEditDataFreshness); // Show EditDataFreshness or not
    const [isShowRefreshData, setIsShowRefreshData] = useState(defaultState.isShowRefreshData); // Show EditDataFreshness or not
    const [isUpdateField, setIsUpdateField] = useState(defaultState.isUpdateField); // Refreshing schemas or not
    const [isLoading, setIsLoading] = useState(defaultState.isLoading); // your function is busy or not
    const [limit, setLimit] = useState(defaultState.limit); // Number of field is rendered
    const [dataSourceInfo, setDataSourceInfo] = useState(defaultState.dataSourceInfo); // We get this from API
    const [inputSearch, setInputSearch] = useState(defaultState.inputSearch);
    const [draggedFieldIndex, setDraggedFieldIndex] = useState(-1);
    const [droppedFieldIndex, setDroppedFieldIndex] = useState(-1);
    const needDirect = useRef(false);

    const previousDataSourceInfo = usePrevious(dataSourceInfo);

    const {
        // states
        modeType = 'Default',
        // functions
        onClickMoveToEditConnection,
        reportId = '',
        onClickDone,
        dataSourceId = '',
        dataSourceSidePanel = {}
    } = props;

    useEffect(() => {
        if (reportId && needDirect.current) {
            needDirect.current = false;

            props.onProcessLoadingDeactive();

            const url = `#/${props.userId}/report/design/${reportId}/edit`;

            const newTab = window.open(url, '_blank');

            newTab.focus();
            // props.history.push('/' + props.userId + `/report/design/${reportId}/edit`);
        }
    }, [reportId]);

    // After we enter value for input search, system will automatically call api with related params to get filtered data
    useEffect(() => {
        try {
            if (inputSearch !== '' && isLoading === false) {
                let timerSearching = setTimeout(() => {
                    setIsLoading(true);

                    let fieldArr = _.concat([], schemas);

                    fieldArr = schemas.filter((field) => {
                        return field.label.toLowerCase().search(
                            inputSearch.toLowerCase()) !== -1;
                    });

                    setFields(fieldArr);
                    setIsLoading(false);
                }, 300);

                return () => clearTimeout(timerSearching);
            } else if ((inputSearch === '' && isLoading === false)) {
                setIsLoading(true);

                let fieldArr = schemas.filter((field, index) => {return index < 50});

                setFields(fieldArr);
                setIsLoading(false);
            }

        } catch (e) {
            handleError(e, {
                component: PATH,
                action: 'useEffect-inputSearch',
                args: {}
            });
        }
    }, [inputSearch]);

    // This Effect will run automatically before rendering first time - ComponentDidMount
    useEffect(() => {
        try {
            fetchDataSourceInfo();
            fetchFieldOfDataSource();

            return () => {props.updateBreadcrumbTextTitle('')};
        } catch (e) {
            handleError(e, {
                component: PATH,
                action: 'useEffect-componentDidMount',
                args: {}
            });
        }
    }, []);

    // After setting isUpdateField = true, we call api to get current data - refreshed
    useEffect(() => {
        try {
            if (isUpdateField) {
                fetchFieldOfDataSource();
            }

            return () => setIsUpdateField(false);
        } catch (e) {
            handleError(e, {
                component: PATH,
                action: 'useEffect-isUpdateField',
                args: {
                    isUpdateField
                }
            });
        }
    }, [isUpdateField]);

    // This effect will run after schemas or limit is changed, then accepting limited number of fields to render
    useEffect(() => {
        try {
            if (schemas !== undefined) {
                let fieldArr = schemas.filter((field, index) => {return index < limit});

                setFields(fieldArr);
            }
        } catch (e) {
            handleError(e, {
                component: PATH,
                action: 'useEffect-schemas-limit',
                args: {}
            });
        }

    }, [schemas, limit]);

    // After this function is called, we set IsUpdateDataGrid = true then -> isUpdateField-Effect
    const handleRefreshData = () => {
        try {
            isLoading === false && setIsShowRefreshData(true);

        } catch (e) {
            handleError(e, {
                component: PATH,
                action: 'handleRefreshData',
                args: {}
            });
        }
    };

    const fetchDataSourceInfo = async () => {
        try {
            setIsLoading(true);

            let responseDataSourceServices = await datasourceServices.get({
                id: dataSourceId || props.match.params.dataSourceId || '',
                type: 'data-source'
            });

            responseDataSourceServices &&
            responseDataSourceServices.data &&
            responseDataSourceServices.data.data &&
            responseDataSourceServices.data.data.dataSourceInfo
                ?
                setDataSourceInfo(
                    responseDataSourceServices.data.data.dataSourceInfo
                )
                :
                props.history.push(getLinkFromState('report.datasources', {
                    ...props.match.params
                }));

            const dataSourceName = responseDataSourceServices.data && responseDataSourceServices.data.data &&
            responseDataSourceServices.data.data.dataSourceInfo && responseDataSourceServices.data.data.dataSourceInfo.dataSourceName;

            if (dataSourceName) {
                props.updateBreadcrumbTextTitle(dataSourceName);
            }

            setIsLoading(false);
        } catch (e) {
            handleError(e, {
                component: PATH,
                action: 'fetchDataSourceInfo'
            });
        }
    };

    // we need a props for filter function in the future
    const fetchFieldOfDataSource = async () => {
        try {
            const {match, updateSchemaForDataSource} = props;
            let payload = {};

            setIsLoading(true);

            let responseSchemaServices = await schemaListServices.getList({
                data_source_id: dataSourceId || props.match.params.dataSourceId || defaultState.dataSourceInfo.dataSourceId || ''
            });

            if ((dataSourceSidePanel && dataSourceSidePanel.dataSourceId) || (match && match.params && match.params.dataSourceId) || (dataSourceInfo && dataSourceInfo.dataSourceId)) {
                payload = {
                    dataSourceId: dataSourceSidePanel.dataSourceId || match.params.dataSourceId || dataSourceInfo.dataSourceId || '',
                    schemas: responseSchemaServices.data.data.schemas,
                    status: 2
                };

                updateSchemaForDataSource(payload);
            }

            responseSchemaServices &&
            responseSchemaServices.data &&
            responseSchemaServices.data.data && setSchemas(responseSchemaServices.data.data.schemas);

            setIsLoading(false);

        } catch (e) {
            handleError(e, {
                component: PATH,
                action: 'fetchFieldOfDataSource',
                args: {
                    props
                }
            });
        }
    };

    const updateDescription = async (description, fieldName) => {
        try {
            setIsLoading(true);

            await fieldServices.update({
                id: 1,
                fieldCode: fieldName || '',
                dataSourceId: props.match.params.dataSourceId || dataSourceInfo.dataSourceId || defaultState.dataSourceInfo.dataSourceId || '',
                type: 'update-field',
                description: description || ''
            });

            setIsUpdateField(true);
            setIsLoading(false);

        } catch (e) {
            handleError(e, {
                component: PATH,
                action: 'ApiSetDescription',
                args: {
                    description,fieldName
                }
            });
        }
    };

    // Drap and Drop
    const getDropIndex = (dropIndex) => setDroppedFieldIndex(dropIndex);

    const getDragIndex = (dragIndex) => {
        if (draggedFieldIndex === -1) {
            setDraggedFieldIndex(dragIndex);
        }
    };

    const handleSortWhenDrag = (dragIndex, hoverIndex) => {
        try {
            if (typeof dragIndex === 'number' && typeof hoverIndex === 'number') {
                const results = fields.slice();
                const firstItem = fields[dragIndex];

                results[dragIndex] = fields[hoverIndex];
                results[hoverIndex] = firstItem;

                setFields(results);
            }
        } catch (error) {
            handleError(error, {
                component: PATH,
                action: 'handleSortWhenDrag',
                args: {
                    dragIndex, hoverIndex
                }
            });
        }
    };

    const toggleShowEditDataFreshness = () => {
        setIsShowEditDataFreshness(!isShowEditDataFreshness);
        if (!_.isEqual(dataSourceInfo, previousDataSourceInfo)) {
            fetchDataSourceInfo();
        }
    };

    const toggleShowRefreshData = () => setIsShowRefreshData(!isShowRefreshData);

    const onClickCreateNewReport = () => {
        try {
            const {dataSourceName = '', dataSourceId, connector = {}} = dataSourceInfo;
            const {id: connectorId = ''} = connector;

            if (dataSourceName && connectorId) {
                needDirect.current = true;

                props.createReport({
                    dataSource: {
                        id: dataSourceId,
                        name: dataSourceName,
                        connectorId
                    }
                });
            }
        } catch (error) {
            handleError(e, {
                component: PATH,
                action: 'onClickCreateNewReport',
                args: {}
            });
        }
    };

    const onChangeFieldStatus = async (isFieldDisable, fieldName) => {
        try {
            setIsLoading(true);

            const response = await fieldServices.update({
                id: 1,
                'fieldCode': fieldName || '',
                'dataSourceId': dataSourceInfo.dataSourceId || defaultState.dataSourceInfo.dataSourceId || '',
                'type': 'update-field',
                'status': isFieldDisable === statusType.FIELD_ENABLE ? 2 : isFieldDisable === statusType.FIELD_DISABLE ? 1 : isFieldDisable === statusType.FIELD_REMOVED ? 0 : 1
            });

            setIsLoading(false);
            setIsUpdateField(true);

            if (response && response.data && response.data.data && response.data.data.status === 1) {
                checkCustomFieldValid();

                clearSchemaCache({
                    dataSourceId: dataSourceInfo.dataSourceId || defaultState.dataSourceInfo.dataSourceId || ''
                });
            }
        } catch (e) {
            handleError(e, {
                component: PATH,
                action: 'onChangeIsDisable',
                args: {}
            });
        }
    };

    /**
     * Just call, no need check response
     */
    const checkCustomFieldValid = () => {
        const dataSourceId = getObjectPropSafely(() => dataSourceInfo.dataSourceId, '');

        if (dataSourceId) {
            customFieldServices.getList({
                type: 'check-field-valid',
                data_source_id: dataSourceId
            });
        }
    };

    const onClickChangeDataType = async (fieldDataType, fieldName) => {
        try {
            setIsLoading(true);

            await fieldServices.update({
                id: 1,
                'fieldCode': fieldName || '',
                'dataSourceId': dataSourceInfo.dataSourceId || defaultState.dataSourceInfo.dataSourceId || '',
                'type': 'update-field',
                'fieldType': formattedDataType[`${fieldDataType}`] || 1
            });

            setIsLoading(false);
            setIsUpdateField(true);

        } catch (e) {
            handleError(e, {
                component: PATH,
                action: 'onClickChangeDataType',
                args: {
                    fieldDataType, fieldName
                }
            });
        }
    };

    const onClickChangeAggregation = async (fieldAggregation, fieldName) => {
        try {
            setIsLoading(true);

            await fieldServices.update({
                id: 1,
                'fieldCode': fieldName || '',
                'dataSourceId': dataSourceInfo.dataSourceId || defaultState.dataSourceInfo.dataSourceId || '',
                'type': 'update-field',
                'aggregationId': fieldAggregation || 1
            });

            setIsLoading(false);
            setIsUpdateField(true);

        } catch (e) {
            handleError(e, {
                component: PATH,
                action: 'onClickChangeAggregation',
                args: {
                    fieldAggregation, fieldName
                }
            });
        }
    };

    const onChangeInputSearch = (event) => {
        try {
            setInputSearch(event.target.value);

        } catch (e) {
            handleError(e, {
                component: PATH,
                action: 'onChangeInputSearch',
                args: {}
            });
        }
    };

    const onScrollFieldList = event => {
        try {
            if ((fields.length < schemas.length && inputSearch === '')
                && (event.target.scrollHeight - event.target.scrollTop - event.target.clientHeight) < 50) {
                setLimit( prevProp => prevProp + 20);
            }

        } catch (error) {
            handleError(error, {
                component: PATH,
                action: 'onScrollProductList',
                args: {event}
            });
        }
    };

    const onClickEditConnection = () => {
        try {
            const {history,match} = props;

            if (history && match && match.params && match.params.userId && match.params.dataSourceId) {
                props.history.push(getLinkFromState('report.datasources.connection', {
                    ...props.match.params
                }));
            }

        } catch (error) {
            handleError(error, {
                component: PATH,
                action: 'onClickEditConnection',
                args: {}
            });
        }
    };

    const onClickAddField = () => {
        try {
            const {history,match, updateToggleDrawer} = props;

            if (modeType === appConfig.MODE_EDIT_CONNECTION) {
                const payload = {
                    isOpenDataSource: false,
                    isOpenCreateNewField: true
                };

                updateToggleDrawer(payload);
            } else {
                const dataSourceId = dataSourceInfo.dataSourceId || match.params.dataSourceId || '';

                if (history && match && match.params && match.params.userId && dataSourceId) {

                    props.history.push(getLinkFromState('report.datasources.fields.customField', {
                        ...props.match.params,
                        dataSourceId: dataSourceId || '',
                        dataSourceInfo: dataSourceSidePanel ? dataSourceSidePanel : dataSourceInfo || {}
                    }));
                }
            }

        } catch (e) {
            handleError(e, {
                component: PATH,
                action: 'onClickDoneToDatasource',
                args: {}
            });
        }
    };

    const onClickDoneToDatasource = () => {
        try {
            const {match, updateSchemaForDataSource} = props;
            let payload = {};

            if (modeType === appConfig.MODE_EDIT_CONNECTION) {
                onClickDone({type: 'cancel'});

                if (dataSourceSidePanel && dataSourceSidePanel.dataSourceId && typeof updateSchemaForDataSource !== undefined) {
                    payload = {
                        dataSourceId: dataSourceSidePanel.dataSourceId || '',
                        schemas: schemas,
                        status: 2
                    };

                    updateSchemaForDataSource(payload);
                }

            } else {
                history.push(getLinkFromState('report.datasources', {
                    ...match.params
                }));
            }
        } catch (e) {
            handleError(e, {
                component: PATH,
                action: 'onClickDoneToDatasource',
                args: {}
            });
        }
    };

    // get width table
    let widthTable = 750;

    if (tableRef.current) {
        widthTable = tableRef.current.offsetWidth;
    }

    try {
        return (
            <Fragment>
                <div className={classnames(styles['block-inner-content-data-source'])}>
                    <div className={classnames(styles['header'])}>
                        {modeType === appConfig.MODE_EDIT_CONNECTION
                            ?
                            <Fragment>
                                <div className={classnames(styles['title-header-popup'])}>
                                    <div style={{display: 'flex'}}>
                                        <p>
                                            {
                                                dataSourceSidePanel && dataSourceSidePanel.dataSourceName
                                                    ? dataSourceSidePanel.dataSourceName : dataSourceInfo.dataSourceName
                                                        ? dataSourceInfo.dataSourceName : ''
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div style={{float: 'right'}}>
                                    <button type="button" className='btn btn-green'
                                        onClick={onClickDoneToDatasource}
                                    >
                                        {props.translate('Done', 'Done')}
                                    </button>
                                </div>
                            </Fragment>
                            :
                            <Fragment>
                                <div style={{float: 'left', display: 'flex'}} className={classnames(
                                    dataSourceInfo.connector.type === dataSourceConnectorType.DATASOURCE_DEFAULT_TYPE ? styles['disabled'] : ''
                                )}>
                                    <div style={{display: 'flex'}}>
                                        <p>{props.translate('Data freshness', 'Data freshness')}:</p>
                                        <p style={{color: dataSourceInfo.connector.type === dataSourceConnectorType.DATASOURCE_DEFAULT_TYPE ? '#b8bcbf' : '#0b83a6'}} className='ml-5'>
                                            {dataSourceInfo.timeRefresh
                                                ? props.translate(formatDataFreshness[`${dataSourceInfo.timeRefresh}`], formatDataFreshness[`${dataSourceInfo.timeRefresh}`])
                                                : props.translate('Unknown', 'Unknown')
                                            }
                                        </p>
                                    </div>
                                    <button className={classnames(styles['btn-edit'], 'btn-edit ml-5')}
                                        onClick={toggleShowEditDataFreshness}
                                        disabled={dataSourceInfo.connector.type === dataSourceConnectorType.DATASOURCE_DEFAULT_TYPE || false}
                                    >
                                        <i style={{transform: 'scale(0.8, 0.8)'}}
                                            className={classnames(styles['icon-edit'], 'icon-edit')}
                                        />
                                    </button>
                                    {isShowEditDataFreshness &&
                                        <DataFreshness
                                            dataSourceInfo={dataSourceInfo}
                                            isShow={isShowEditDataFreshness }
                                            toggle={toggleShowEditDataFreshness}
                                            fetchDataSourceInfo={fetchDataSourceInfo}
                                        />
                                    }
                                </div>
                                <div style={{float: 'right'}}>
                                    <button
                                        disabled={dataSourceInfo.connector.type === dataSourceConnectorType.DATASOURCE_DEFAULT_TYPE || false}
                                        className={
                                            classnames(
                                                styles['btn-full'],
                                                dataSourceInfo.connector.type === dataSourceConnectorType.DATASOURCE_DEFAULT_TYPE ? styles['disabled'] : '',
                                                'btn btn-default mr-10')
                                        }
                                        onClick={() => onClickEditConnection()}
                                    >
                                        {props.translate('Edit Connection', 'Edit Connection')}
                                    </button>
                                    <button className={'btn btn-green'}
                                        onClick={onClickCreateNewReport}>{props.translate('Create report', 'Create report')}</button>
                                </div>
                            </Fragment>
                        }
                    </div>
                    <div className={classnames(styles['body'])} ref={tableRef}>
                        {modeType === appConfig.MODE_EDIT_CONNECTION &&
                        <div className={classnames(styles['navigator'])}>
                            <div className={classnames(styles['go-back'])}>
                                <button
                                    className="btn"
                                    onClick={onClickMoveToEditConnection}
                                >
                                    <i className="icon-arrow-pre" />
                                    <div className={classnames(styles['title'])}>{props.translate('Edit Connection','Edit Connection')}</div>
                                </button>
                            </div>
                        </div>
                        }
                        <div className={classnames(styles['header-body'])}>
                            <div style={{float: 'left'}}
                                className={classnames(styles['split-v'], 'group-add-field mt-15')}>
                                <button type="button" className='btn btn-green' onClick={onClickAddField}>
                                    <i className='icon-plus-white mr-10' />
                                    {props.translate('Add a field', 'Add a field')}
                                </button>
                            </div>
                            <div style={{float: 'left', display: modeType === appConfig.MODE_EDIT_CONNECTION && 'none'}}
                                className={classnames(styles['search-block'])}>
                                <form>
                                    <div className={classnames(styles['search-input'])}>
                                        <input value={inputSearch} type="text"
                                            placeholder={props.translate('Search field', 'Search field')}
                                            onChange={onChangeInputSearch} />
                                        <button disabled={true}><i
                                            className={classnames(styles['icon-ants-search'], 'icon-ants-search')} /></button>
                                    </div>
                                </form>
                            </div>
                            {isLoading &&
                            <div id="loading">
                                <img src={Loading} alt="Loading" style={{marginLeft: '50px'}} /><br />
                                <span style={{marginLeft: '35px'}}>{props.translate('Loading', 'Loading')}...</span>
                            </div>
                            }
                            <div
                                style={{
                                    float: modeType === appConfig.MODE_EDIT_CONNECTION ? 'left' : 'right',
                                    paddingTop: '15px',
                                    marginLeft: modeType === appConfig.MODE_EDIT_CONNECTION ? '10px' : '0px'
                                }}
                            >
                                <button
                                    className={classnames(
                                        styles['btn btn-default btn-full'],
                                        dataSourceInfo.connector.type === dataSourceConnectorType.DATASOURCE_DEFAULT_TYPE ? styles['disabled'] : '',
                                        'btn btn-default btn-full')}
                                    style={{width: '130px', float: 'right', padding: '5px'}}
                                    onClick={handleRefreshData}
                                    disabled={dataSourceInfo.connector.type === dataSourceConnectorType.DATASOURCE_DEFAULT_TYPE || false}
                                >
                                    <i className={classnames(styles['icon-rotate mr-10'], 'icon-rotate mr-10')} />
                                    <label style={{cursor: 'pointer'}}>{props.translate('Refresh Fields', 'Refresh Fields')}</label>
                                </button>
                                <ModalRefreshField isOpen={isShowRefreshData}
                                    fetchFieldOfDataSource={fetchFieldOfDataSource}
                                    dataSource={dataSourceInfo} toggle={toggleShowRefreshData} />
                            </div>
                        </div>

                        <DndProvider backend={HTML5Backend}>
                            <table className={classnames(styles['table-bordered'], 'table table-bordered')}>
                                <thead>
                                    <tr>
                                        <th style={{width: '100px'}}>
                                            {props.translate('Index', 'Index')}
                                        </th>
                                        <th>
                                            {props.translate('Field', 'Field')}
                                        </th>
                                        <th>
                                            {props.translate('Type', 'Type')}
                                        </th>
                                        <th>
                                            {props.translate('Aggregation', 'Aggregation')}
                                        </th>
                                        <th style={widthTable > 730 ? {width: '400px'} : {}}>
                                            {props.translate('Description', 'Description')}
                                        </th>
                                    </tr>
                                </thead>
                            </table>
                            <div
                                onScroll={onScrollFieldList}
                                style={{
                                    position: 'relative',
                                    overflowY: 'scroll',
                                    height: modeType === appConfig.MODE_EDIT_CONNECTION ? '310px' : '70vh'
                                }}
                                className={classnames(styles['table-responsive'], 'table-responsive')}
                            >
                                <table className={classnames(styles['table-bordered'], 'table table-bordered')}>
                                    <thead
                                        style={{
                                            overflow: 'hidden',
                                            visibility: 'collapse',
                                            height: '0 !important',
                                            width: 0
                                        }}
                                    >
                                        <tr>
                                            <th style={{width: '100px'}}>
                                                {props.translate('Index', 'Index')}
                                            </th>
                                            <th>
                                                {props.translate('Field', 'Field')}
                                            </th>
                                            <th>
                                                {props.translate('Type', 'Type')}
                                            </th>
                                            <th>
                                                {props.translate('Aggregation', 'Aggregation')}
                                            </th>
                                            <th style={widthTable > 730 ? {width: '400px'} : {}}>
                                                {props.translate('Description', 'Description')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fields.length > 0
                                            ?
                                            fields.map((field, index) => (
                                                <Field
                                                    {...props}
                                                    key={index}
                                                    index={index}
                                                    field={field}
                                                    onChangeFieldStatus={onChangeFieldStatus}
                                                    updateDescription={updateDescription}
                                                    onClickChangeDataType={onClickChangeDataType}
                                                    onClickChangeAggregation={onClickChangeAggregation}

                                                    handleSortWhenDrag={handleSortWhenDrag}
                                                    dataSourceSidePanel={dataSourceSidePanel}
                                                    modeType={modeType}
                                                    getDragIndex={getDragIndex}
                                                    getDropIndex={getDropIndex}
                                                />
                                            ))
                                            :
                                            null
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </DndProvider>
                    </div>
                </div>
            </Fragment>
        );
    } catch (e) {
        handleError(e, {
            component: PATH
        });
    }
};

const mapDispatchToProps = {
    onProcessLoadingActive,
    onProcessLoadingDeactive,
    updateWorkspace,
    changeReportMode,
    createReport,
    updateBreadcrumbTextTitle,
    updateToggleDrawer,
    updateSchemaForDataSource
};

const mapStateToProps = state => ({
    locale: state.TranslateReducer.locale,
    userId: state.Layouts.loginReducer.userId,
    layout: state.Report.sidePanelReducer.layout,
    theme: state.Report.sidePanelReducer.theme,
    reportId: state.Report.workspaceReducer.reportId
});

export default withTranslation(withRouter(connect(mapStateToProps, mapDispatchToProps)(DetailDataSource)));
