// Libraries
import React, {Fragment, useState, useEffect} from 'react';
import {Modal} from 'reactstrap';
import PropTypes from 'prop-types';

// Components
import MessageBox from 'Src/components/MessageBox';

// Services
import * as datasourceServices from 'Services/v3.1/DataSource';

// Assets
import Loading from 'Assets/images/loading.gif';

// Utils
import {handleError} from 'Src/handleError';
import {withTranslation} from 'Locale/withTranslation';

const PATH = 'modules/Report/containers/DataSources/containers/Detail/components/EditDataFreshness/EditDataFreshness.jsx';

const defaultState = {
    timer: 1,
    dataFreshnessList: [],
    isLoading: false,
    message: '',
    statusResponse: -1,
    messageBoxSuccess: {
        icon: 'icon-success-green',
        title: 'Success',
        message: ''
    },
    messageBoxFail: {
        icon: 'icon-warning',
        title: 'Error',
        message: ''
    },
    isOpenMessageBox: false
};

const defaultProps = {
    dataSourceInfo: {
        dataSourceId: '517385401',
        dataSourceName: 'Google Sheets: List of New Arrival Products',
        timeRefresh: 1,
        status: 1
    },
    isShow: false
};

const DataFreshness = (props) => {
    const {
        isShow = defaultProps.isShow,
        dataSourceInfo = defaultProps.dataSourceInfo,
        toggle
    } = props;

    const [timer, setTimer] = useState(defaultState.timer);
    const [dataFreshnessList, setDataFreshnessList] = useState(defaultState.dataFreshnessList);
    const [isLoading, setIsLoading] = useState(defaultState.isLoading);
    const [isOpenMessageBox, setIsOpenMessageBox] = useState(defaultState.isOpenMessageBox);
    const [messageBox, setMessageBox] = useState(defaultState.messageBoxSuccess);

    useEffect(() => {
        try {
            if (messageBox.message !== '') {
                setIsOpenMessageBox(true);
            }
        } catch (e) {
            handleError(e, {
                component: PATH,
                action: 'useEffect-messageBox',
                args: {}
            });
        }
    }, [messageBox]);

    useEffect(() => {
        try {
            getDataFreshness();

            return () => setIsLoading(false);
        } catch (e) {
            handleError(e, {
                component: PATH,
                action: 'useEffect-componentDidMount-DataFreshness',
                args: {
                    timer
                }
            });
        }

    }, []);

    const getDataFreshness = async () => {
        try {
            setIsLoading(true);

            let responseDataFreshness = await datasourceServices.getList({
                type: 'get-refresh-time-info'
            });

            responseDataFreshness.data && setDataFreshnessList(responseDataFreshness.data.data);

            setIsLoading(false);
        } catch (e) {
            handleError(e, {
                component: PATH,
                action: 'fetchDataFreshness',
                args: {
                    timer
                }
            });
        }

    };

    const onClickSettingDataFreshness = async (timer) => {
        try {
            setIsLoading(true);

            let responseDataFreshness = await datasourceServices.create({
                'data_source_id': dataSourceInfo.dataSourceId || '',
                'refresh_time': timer || 1,
                'type': 'update-refresh-time'
            });

            if (responseDataFreshness && responseDataFreshness.data && responseDataFreshness.data.data) {
                responseDataFreshness.data.data.status === 1 &&
                    setMessageBox({
                        ...defaultState.messageBoxSuccess,
                        message: `${props.translate('Change data freshness completely','Change data freshness completely')}!`,
                        onClose: () => {props.fetchDataSourceInfo(); toggle()}
                    });
                responseDataFreshness.data.data.status === 0 &&
                    setMessageBox({
                        ...defaultState.messageBoxFail,
                        message: 'Can not change data freshness !'
                    });
            } else {
                setMessageBox({
                    ...defaultState.messageBoxFail,
                    message: 'Error'
                });
            }

            setIsLoading(false);

        } catch (e) {
            setMessageBox({
                ...defaultState.messageBoxFail,
                message: 'Error'
            });

            handleError(e, {
                component: PATH,
                action: 'onClickSettingDataFreshness',
                args: {
                    timer
                }
            });
        }
    };

    const onChangeDataFreshness = (event) => {
        try {
            setTimer(event.target.value);

        } catch (e) {
            handleError(e, {
                component: PATH,
                action: 'onChangeDataFreshness',
                args: {
                    event
                }
            });
        }
    };

    try {
        return (
            <Fragment>
                {
                    isOpenMessageBox
                        ?
                        <MessageBox
                            id={'data-freshness'}
                            onClose={toggle}
                            onConfirm={toggle}
                            {...messageBox}
                            isOpen={isOpenMessageBox}
                            btnCloseName='Close'
                            icon={messageBox.icon}
                            title={messageBox.title}
                            message={messageBox.message}
                        />
                        :
                        <Modal isOpen={isShow} toggle={toggle} className="modal-dialog" style={{width: '377px'}}>
                            {isLoading &&
                            <div id="loading" style={{backgroundColor: 'white'}}>
                                <img src={Loading} alt="Loading" /><br />
                                <span>{props.translate('Loading', 'Loading')}...</span>
                            </div>
                            }
                            <div style={{width: '525px', height: '320px'}} className='modal-content'>
                                <div className='modal-header pb-10'>
                                    <h5 className='modal-title'>
                                        <strong>{props.translate('Data freshness', 'Data freshness')}</strong></h5>
                                    <button type="button" className="close" onClick={toggle}><i
                                        className="icon-close-square" /></button>
                                </div>
                                <div style={{display: 'flex', paddingTop: '15px'}} className="ml-25">
                                    <i className="icon-sheets mr-10" />
                                    <p>Google Sheets: {dataSourceInfo.dataSourceName || ''}</p>
                                </div>
                                <div style={{marginTop: '15px'}} className="modal-body pt-5 pb-5">
                                    <div>
                                        <p>{props.translate('How fresh do you need this data to be', 'How fresh do you need this data to be')}?</p>
                                    </div>
                                    <div className="form form-export">
                                        {
                                            dataFreshnessList.map((timer, index) => {
                                                let checkedTimeRefresh = +dataSourceInfo.timeRefresh === +timer.value ? true : false;

                                                return <div className="radio-multi" key={index}>
                                                    <label>
                                                        <input
                                                            type="radio"
                                                            value={timer.value || 1}
                                                            name="dataFreshnessTime"
                                                            defaultChecked={checkedTimeRefresh}
                                                            onChange={onChangeDataFreshness}
                                                        />
                                                        <span className="icon-radio" />
                                                        <span
                                                            style={{marginLeft: '5px'}}>{props.translate(timer.title || '', timer.title || '')}</span>
                                                        {index === 0 && <span
                                                            style={{color: '#b3b3b3'}}> ({props.translate('default', 'default')})</span>}
                                                    </label>
                                                </div>;
                                            })
                                        }
                                    </div>
                                </div>
                                <div className="modal-footer d-block">
                                    <hr className="mt-0 mr-0" />
                                    <button
                                        type="button"
                                        className="btn btn-green ml-0 mr-10"
                                        onClick={() => onClickSettingDataFreshness(timer)}
                                    >
                                        {props.translate('Set data freshness', 'Set data freshness')}
                                    </button>
                                    <button type="button" className="btn btn-grey"
                                        onClick={toggle}>{props.translate('Cancel', 'Cancel')}</button>
                                </div>
                            </div>
                        </Modal>
                }
            </Fragment>
        );
    } catch (e) {
        handleError(e, {
            component: PATH
        });

        return null;
    }
};

const propTypes = {
    isShow: PropTypes.bool,
    dataSourceInfo: PropTypes.object, // include dataSourceId, +timeRefresh, dataSourceName
    toggle: PropTypes.func
};

DataFreshness.propTypes = propTypes;
DataFreshness.defaultProps = defaultProps;

export default withTranslation(DataFreshness);
