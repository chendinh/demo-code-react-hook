import React, {useEffect, useMemo, useState} from 'react';
import classnames from 'classnames';

import CreateNewFieldBody from 'Modules/Report/components/CreateNewField/components/CreateNewFieldBody';
import {DndProvider} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

// Assets
import styles from './styles.module.less';
import Loading from 'Assets/images/loading.gif';

// Services
import * as schemaServices from 'Services/Report/schema';
import * as datasourceServices from 'Services/v3.1/DataSource';

// Utils
import {withTranslation} from 'Locale/withTranslation';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import {hideLoading, showLoading} from 'Modules/Layouts/actions';
import {getLinkFromState, getObjectPropSafely} from 'Src/utils';
import {updateDataTypes} from 'Modules/Report/components/SidePanel/actions';
import {handleError} from 'Src/handleError';

const PATH = 'modules/Report/containers/DataSources/containers/Fields/containers/CustomField/index.jsx';

const CustomField = (props) => {
    const [schemas, setSchemas] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [dataSourceInfo, setDataSourceInfo] = useState({});

    const dataSource = useMemo(() => {
        return {
            id: props.match.params.dataSourceId
        };
    }, [props.match.params.dataSourceId]);

    const fetchDataSourceInfo = async () => {
        try {
            setIsLoading(true);

            let responseDataSourceServices = await datasourceServices.get({
                id:  props.match.params.dataSourceId || '',

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

            setIsLoading(false);
        } catch (e) {
            handleError(e, {
                component: PATH,
                action: 'fetchDataSourceInfo'
            });
        }
    };

    useEffect(() => {
        getSchemas();
    }, [dataSource.id]);

    useEffect(() => {
        fetchDataSourceInfo();
    }, []);

    const getSchemas = () => {
        try {
            props.showLoading();

            const getList = schemaServices.getList({
                data_source_id: dataSource.id
            });

            if (getList) {
                getList.then((res) => {
                    props.hideLoading();

                    if (res && res.data && res.data.data && res.data.data.schemas) {
                        setSchemas(res.data.data.schemas);
                    }
                }).catch(() => props.hideLoading());
            } else {
                props.hideLoading();
            }
        } catch (e) {
            handleError(e, {
                component: PATH,
                action: 'getSchemas'
            });
        }
    };

    const onClickCancel = () => {
        props.history.push(getLinkFromState('report.datasources.fields', {
            ...props.match.params
        }));
    };

    const onClickEditConection = () => {
        props.history.push(getLinkFromState('report.datasources.connection', {
            ...props.match.params
        }));
    };

    const onClickAllField = () => {
        props.history.push(getLinkFromState('report.datasources.fields', {
            ...props.match.params
        }));
    };

    try {
        return (
            <div className={classnames(styles['block-inner-content-data-source'])}>
                {isLoading &&
                            <div id="loading">
                                <img src={Loading} alt="Loading" style={{marginLeft: '50px'}} /><br />
                                <span style={{marginLeft: '35px'}}>{props.translate('Loading', 'Loading')}...</span>
                            </div>
                }
                <div className={classnames(styles['header'])}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <div className={classnames(styles['navigator'])} >
                            <div className={classnames(styles['go-back'])}>
                                <button 
                                    className="btn" 
                                    onClick={onClickAllField}
                                >
                                    <i className="icon-arrow-pre" />
                                    <div className={classnames(styles['title'])}>{props.translate('All Fields','All Fields')}</div>
                                </button>
                            </div>
                        </div>
                        <div className={classnames(styles['title-header-popup'])}>
                            <div style={{display: 'flex'}}>
                                <p>
                                    {dataSourceInfo && dataSourceInfo.dataSourceName ? dataSourceInfo.dataSourceName : ''}
                                </p>
                            </div>
                        </div>
                         
                    </div>
                   
                    <div style={{float: 'right'}}>
                        <button
                            style={{width: '130px'}}
                            className={classnames(styles['btn-full'], 'btn btn-default')}
                            onClick={onClickEditConection}
                        >
                            {props.translate('Edit Connection', 'Edit Connection')}
                        </button>
                    </div>
                </div>
                {/* <div className={classnames(styles['body'])}> */}
                {/* <div className={classnames(styles['header-body'])}>
                    </div> */}
                {/* <div className={classnames(styles['table-responsive'], 'table-responsive')}> */}
                {/* <div className={classnames(styles['modal-create-new-field'], styles['active'])}> */}
                {/* <div className={classnames(styles['ants-container'])}> */}
                {/* <div className={styles['header']}>
                                    <div className={styles['title']}>{'default dataSource'}</div>
                                    <i
                                        className={'icon-ants-double-four-dots'}
                                        // onMouseDown={onMouseDownResize}
                                    />
                                    <button className={'btn btn-green'}>{props.translate('Done','Done')}</button>
                                </div> */}
                {/* <div className={styles['body']}> */}

                {/*    <DndProvider backend={HTML5Backend}> */}
                {/*        <CreateNewFieldBody */}
                {/*            modalTop={modalTop} */}
                {/*            dataTypes={props.dataTypes} */}
                {/*            isReady={animation} */}
                {/*            dataSource={dataSource} */}
                {/*            defaultSchema={defaultSchema} */}
                {/*            showLoading={props.showLoading} */}
                {/*            hideLoading={props.hideLoading} */}
                {/*            getSchema={props.getSchema} */}
                {/*            updateGlobalModal={props.updateGlobalModal} */}
                {/*            // onCancel={onClickCancel} */}
                {/*        /> */}
                {/*    </DndProvider> */}
                {/* </div> */}
                <div className={classnames(styles['body'])} style={{height: 500}}>
                    <DndProvider backend={HTML5Backend}>
                        <CreateNewFieldBody
                            fieldCode={props.match.params.fieldCode}
                            translate={props.translate}
                            dataTypes={props.dataTypes}
                            dataSource={dataSource}
                            defaultSchema={schemas}
                            showLoading={props.showLoading}
                            hideLoading={props.hideLoading}
                            getSchema={getSchemas}
                            onCancel={onClickCancel}
                            updateDataTypes={props.updateDataTypes}
                        />
                    </DndProvider>
                </div>
                {/* </div> */}
                {/* </div> */}
                {/* </div> */}
                {/* </div> */}
            </div>
        );
    } catch (e) {
        handleError(e, {
            component: PATH
        });
    }
};

const mapStateToProps = state => {
    return {
        dataTypes: getObjectPropSafely(() => state.Report.sidePanelReducer.dataTypes, {})
    };
};

const mapDispatchToProps = {
    showLoading,
    hideLoading,
    updateDataTypes
};

export default withTranslation(withRouter(connect(mapStateToProps, mapDispatchToProps)(CustomField)));
