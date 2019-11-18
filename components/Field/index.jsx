// Libraries
import React, {Fragment, useRef, useImperativeHandle, useState, useEffect} from 'react';
import classnames from 'classnames';
import {UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, UncontrolledTooltip} from 'reactstrap';
import {DragSource, DropTarget} from 'react-dnd';

// Hook Functions
import usePrevious from 'Src/hooks/usePrevious';

// Assets
import styles from '../../styles.module.less';
import {withTranslation} from 'Locale/withTranslation';

// Constant
import {aggregationType, semanticType, statusType} from '../../constant';

// Hooks
import useDebounce from 'Hooks/useDebounce';

// Utils
import {formatDataTypeName, convertAggregation} from '../../utils';
import {handleError} from 'Src/handleError';
import {appConfig} from 'Src/constant';
import {getLinkFromState} from 'Src/utils';

const PATH = 'modules/Report/containers/DataSources/containers/Fields/components/Field/index.jsx';

const ItemTypes = {
    FIELD: 'field'
};

const defaultProps = {
    inputDescription: '',
    field: {
        id: 'section_id',
        name: 'section_name',
        label: 'Unknow',
        dataType: 'NUMBER',
        enable: 2,
        visible: 0,
        semantics: {
            conceptType: 'DIMENSION',
            semanticType: 'NUMBER'
        },
        aggregationType: '',
        description: 'This is default field'
    },
    index: 0
};

const defaultState = {
    inputDescription: ''
};

const Field = React.forwardRef(
    ({
        // dragNdrop
        isDragging = false,
        isOver = false,
        connectDragSource,
        connectDropTarget,
        // states
        field = defaultProps.field,
        index = defaultProps.index,
        // functions
        onClickChangeDataType,
        onClickChangeAggregation,
        updateDescription,
        onChangeFieldStatus,
        ...props
    }, ref) => {
        const elementRef = useRef(null);

        connectDragSource(elementRef);
        connectDropTarget(elementRef);
        useImperativeHandle(ref, () => ({
            getNode: () => elementRef.current
        }));

        const previousisDragging = usePrevious(isDragging) || true;

        const [inputDescription, setInputDescription] = useState(field.description);

        const debouncedSearching = useDebounce(inputDescription, 1200);

        useEffect(() => {
            try {
                if (debouncedSearching && debouncedSearching !== field.description) {
                    updateDescription(debouncedSearching, field.name);
                }

                if (debouncedSearching === null && debouncedSearching !== field.description) {
                    updateDescription('', field.name);
                }

            } catch (e) {
                handleError(e, {
                    component: PATH,
                    action: 'useEffect-inputDescription',
                    args: {}
                });
            }

        }, [debouncedSearching]);

        const HandleOnChangeDescription = (event) => {
            try {
                event.target.value ? setInputDescription(event.target.value) : setInputDescription(null);

            } catch (e) {
                handleError(e, {
                    component: PATH,
                    action: 'HandleOnChangeDescription',
                    args: {}
                });
            }
        };

        const onClickFXButton = () => {
            try {
                const {history, match, modeType, dataSourceSidePanel} = props;

                if (modeType === appConfig.MODE_EDIT_CONNECTION) {
                    const dataSourceId = dataSourceSidePanel ? dataSourceSidePanel.dataSourceId : '';

                    if (history && match && dataSourceId && field && field.name) {
                        history.push(`/${match.params.userId}/report/datasources/${dataSourceId}/customField/${field.name}/edit`);
                    }
                } else {
                    if (history && match && match.params && match.params.userId && field && field.name) {
                        history.push(`/${match.params.userId}/report/datasources/${match.params.dataSourceId}/customField/${field.name}/edit`);
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

        const isCustomFieldError = field.isCustomField && field.status === appConfig.CUSTOM_FIELD_INVALID;

        return (
            <Fragment>
                <tr
                    ref={elementRef}
                    style={{
                        // transform: isDragging ? 1.5 : 1,
                        opacity: isDragging ? 0.5 : 1,
                        cursor: 'move',
                        backgroundColor: isOver ? 'rgba(23, 162, 184, 0.5)' : 'white',
                        transition: 'all .2s ease-out'
                    }}
                    className={field.enable === statusType.FIELD_DISABLE ? classnames(styles['disabled'], 'disabled dragdrop-handle' ) : null}
                >
                    <td>
                        <div style={{padding: '10px', display: 'flex', justifyContent: 'space-between'}}>
                            <span disabled>{index + 1}</span>
                            {isCustomFieldError ? (
                                <>
                                    <i
                                        className="icon-warning ml-5"
                                        id={`field-${field.name}`}
                                        style={{transform: 'scale(0.85)'}}
                                    />
                                    <UncontrolledTooltip
                                        placement={'top'}
                                        className={'tooltip-warning'}
                                        target={`field-${field.name}`}
                                    >
                                        {props.translate('Invalid field', 'Invalid field')}
                                    </UncontrolledTooltip>
                                </>
                            ) : (
                                <span className='custom-switch'>
                                    <input
                                        type="checkbox"
                                        id={field.name || ''}
                                        value={field.enable || 1}
                                        checked={field.enable === statusType.FIELD_ENABLE}
                                        onChange={() => onChangeFieldStatus(field.enable, field.name)}
                                    />
                                    <label style={{marginLeft: '40px'}} htmlFor={field.name} />
                                </span>
                            )}
                        </div>
                    </td>
                    <td>
                        <div className='mt-5' style={{display: 'flex'}}>
                            {   field.isCustomField
                                ?
                                <div
                                    style={{
                                        backgroundColor: '#d2e9d0',
                                        whiteSpace: 'nowrap',
                                        display: 'flex'
                                    }}
                                    className={
                                        field.enable === statusType.FIELD_DISABLE
                                            ? classnames(styles['label-field'], styles['text-disable'])
                                            : classnames(styles['label-field'])
                                    }
                                >
                                    <label
                                        style={{
                                            textOverflow: 'ellipsis',
                                            overflow: 'hidden',
                                            maxWidth: '120px',
                                            width: '100%',
                                            marginBottom: 0
                                        }}
                                    >{field.label || ''}</label>
                                    <button
                                        disabled={field.enable === statusType.FIELD_DISABLE}
                                        onClick={() => onClickFXButton()}
                                        className={
                                            field.enable === statusType.FIELD_DISABLE
                                                ? classnames(styles['btn-fx'], styles['text-disable'], 'btn-fx')
                                                : classnames(styles['btn-fx'])
                                        }
                                    >
                                        fx
                                    </button>
                                </div>
                                :
                                <label
                                    style={{
                                        backgroundColor: field.semantics.semanticType === semanticType.STRING || field.semantics.semanticType === semanticType.COUNTRY || field.semantics.semanticType === semanticType.CITY || formatDataTypeName(field.semantics.semanticType) === 'Date' ? '#e8f4e7' : '#c4e2fb',
                                        textOverflow: 'ellipsis',
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap'
                                    }}
                                    className={
                                        field.enable === statusType.FIELD_DISABLE
                                            ? classnames(styles['label-field'], styles['text-disable'])
                                            : classnames(styles['label-field'])
                                    }
                                >{field.label}</label>
                            }
                            {   field.isCustomField &&
                                <UncontrolledDropdown>
                                    <DropdownToggle
                                        tag="span"
                                    >
                                        <i
                                            className={classnames(styles['icon-field'], 'icon-ants-three-dot-vertical')}
                                        />
                                    </DropdownToggle>
                                    <DropdownMenu>
                                        <DropdownItem tag="button" onClick={() => onChangeFieldStatus(statusType.FIELD_REMOVED, field.name)}>{props.translate('Remove','Remove')}</DropdownItem>
                                    </DropdownMenu>
                                </UncontrolledDropdown>
                            }
                        </div>
                    </td>
                    <td>
                        <div style={{width: '160px', marginLeft: '10px'}} className='mt-5 d-flex align-items-center'>
                            {formatDataTypeName(field.semantics.semanticType) === 'Date' ? <i className="icon-ants-calendar" style={{minWidth: '23px', textAlign: 'center' , color: '#61b76b'}} /> : field.semantics.semanticType === semanticType.STRING || field.semantics.semanticType === semanticType.COUNTRY || field.semantics.semanticType === semanticType.CITY
                                ? <span style={{color: '#61b76b'}}>ABC</span> : <strong style={{color: '#51a5d5'}}>123</strong>
                            }
                            {
                                field.semantics.semanticType === semanticType.NUMBER ||
                                field.semantics.semanticType === semanticType.PERCENT ||
                                field.semantics.semanticType === semanticType.CURRENCY ?
                                    <UncontrolledDropdown>
                                        <DropdownToggle
                                            disabled={field.enable === statusType.FIELD_DISABLE}
                                            className={
                                                classnames(styles['btn-default dropdown-toggle btn-full'], styles['btn-aggregation'], styles['text-disable'],
                                                    'btn btn-default btn-full dropdown-toggle')
                                            }
                                            tag="button"
                                        >
                                            {props.translate(`${formatDataTypeName(field.semantics.semanticType)}`,`${formatDataTypeName(field.semantics.semanticType)}`)}
                                        </DropdownToggle>
                                        <DropdownMenu>
                                            <DropdownItem tag="button" onClick={() => onClickChangeDataType('STRING', field.name)}>{props.translate('Text','Text')}</DropdownItem>
                                            <DropdownItem tag="button" onClick={() => onClickChangeDataType('NUMBER', field.name)}>{props.translate('Number','Number')}</DropdownItem>
                                            <DropdownItem tag="button" onClick={() => onClickChangeDataType('PERCENT', field.name)}>{props.translate('Percent','Percent')}</DropdownItem>
                                            <DropdownItem tag="button" onClick={() => onClickChangeDataType('CURRENCY', field.name)}>{props.translate('Currency','Currency')}</DropdownItem>
                                        </DropdownMenu>
                                    </UncontrolledDropdown>
                                    :
                                    <span  className="dropdown">
                                        <button
                                            className={
                                                classnames(styles['btn-default btn-full'], styles['btn-aggregation'], styles['text-disable'],
                                                    'btn btn-default btn-full')
                                            }
                                            type="button"
                                        >
                                            {field.semantics.semanticType === semanticType.STRING ? props.translate('Text','Text') : props.translate(`${formatDataTypeName(field.semantics.semanticType)}`,`${formatDataTypeName(field.semantics.semanticType)}`)}
                                        </button>
                                    </span>
                            }
                        </div>
                    </td>
                    <td>
                        <div style={{width: '160px'}} className='mt-5 d-flex align-items-center'>
                            {
                                field.semantics.semanticType === semanticType.NUMBER ||
                                field.semantics.semanticType === semanticType.PERCENT ||
                                field.semantics.semanticType === semanticType.CURRENCY ?
                                    <UncontrolledDropdown>
                                        <DropdownToggle disabled={field.enable === statusType.FIELD_DISABLE} className={classnames(styles['btn-default dropdown-toggle btn-full'], styles['btn-aggregation'], styles['text-disable'], 'btn btn-default btn-full dropdown-toggle')}  tag="button">
                                            {!field.aggregationType ? props.translate('None','None') : props.translate(`${convertAggregation(field.aggregationType)}`, `${convertAggregation(field.aggregationType)}`)}
                                        </DropdownToggle>
                                        <DropdownMenu>
                                            <DropdownItem tag="button" onClick={() => onClickChangeAggregation(aggregationType.NONE, field.name)}>{props.translate('None','None')}</DropdownItem>
                                            <DropdownItem tag="button" onClick={() => onClickChangeAggregation(aggregationType.COUNT, field.name)}>{props.translate('Count','Count')}</DropdownItem>
                                            <DropdownItem tag="button" onClick={() => onClickChangeAggregation(aggregationType.COUNT_DISTINCT, field.name)}>{props.translate('Count Distinct','Count Distinct')}</DropdownItem>
                                            <DropdownItem tag="button" onClick={() => onClickChangeAggregation(aggregationType.SUM, field.name)}>{props.translate('Sum','Sum')}</DropdownItem>
                                            <DropdownItem tag="button" onClick={() => onClickChangeAggregation(aggregationType.AVERAGE, field.name)}>{props.translate('Average','Average')}</DropdownItem>
                                            <DropdownItem tag="button" onClick={() => onClickChangeAggregation(aggregationType.MIN, field.name)}>{props.translate('Min','Min')}</DropdownItem>
                                            <DropdownItem tag="button" onClick={() => onClickChangeAggregation(aggregationType.MAX, field.name)}>{props.translate('Max','Max')}</DropdownItem>
                                        </DropdownMenu>
                                    </UncontrolledDropdown>
                                    :
                                    <span  className="dropdown">
                                        <button
                                            className={
                                                classnames(styles['btn-default btn-full'], styles['btn-aggregation'], styles['text-disable'],
                                                    'btn btn-default btn-full')
                                            }
                                            type="button"
                                        >
                                            {props.translate('None','None')}
                                        </button>
                                    </span>
                            }
                        </div>
                    </td>
                    <td>
                        {
                            <input
                                style={{backgroundColor: 'transparent', marginLeft: '10px'}}
                                className={classnames(styles['description'], 'description')}
                                value={inputDescription || ''}
                                placeholder={`${!field.description ? props.translate('Enter description...','Enter description...') : field.description || ''}`}
                                onChange={HandleOnChangeDescription}
                                disabled={field.enable === statusType.FIELD_DISABLE}
                            />
                        }
                    </td>
                </tr>
            </Fragment>
        );
    }
);

export default withTranslation(DropTarget(
    ItemTypes.FIELD,
    {
        drop(props, monitor, component) {
            // if (monitor.didDrop() && !monitor.isOver()) {
            //     return;
            // }
            // const hoveredIndex = monitor.getItem().index;

            return {
                index: props.index
            };
        },
        hover(props, monitor, component) {
            // if (!component) {
            //     return null;
            // }
            // // node = HTML Div element from imperative API
            // const node = component.getNode();

            // if (!node) {
            //     return null;
            // }

            const dragIndex = monitor.getItem().index;
            const hoverIndex = props.index;

            // Don't replace items with themselves
            if (dragIndex === hoverIndex) {
                return;
            }
            // // Determine rectangle on screen
            // const hoverBoundingRect = node.getBoundingClientRect();
            // // Get vertical middle
            // const hoverUpY = 0;
            // const hoverDownY = (hoverBoundingRect.bottom - hoverBoundingRect.top);
            // // Determine mouse position
            // const clientOffset = monitor.getClientOffset();
            // // Get pixels to the top
            // const hoverClientY = clientOffset.y - hoverBoundingRect.top;

            // // Only perform the move when the mouse has crossed half of the items height
            // // When dragging downwards, only move when the cursor is below 50%
            // // When dragging upwards, only move when the cursor is above 50%
            // // Dragging downwards
            // if (dragIndex < hoverIndex && hoverClientY < hoverUpY) {
            //     return;
            // }
            // // Dragging upwards
            // if (dragIndex > hoverIndex && hoverClientY > hoverDownY) {
            //     return;
            // }
            // // Time to actually perform the action

            // props.getDragIndex(dragIndex);

            props.handleSortWhenDrag(dragIndex, hoverIndex);

            // Note: we're mutating the monitor item here!
            // Generally it's better to avoid mutations,
            // but it's good here for the sake of performance
            // to avoid expensive index searches.
            monitor.getItem().index = hoverIndex;
        }
    },
    (connect, monitor) => ({
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver()
        // isOverCurrent: monitor.isOver({shallow: true})
    })
)(
    DragSource(
        ItemTypes.FIELD,
        {
            beginDrag: props => ({
                id: props.field.name,
                index: props.index,
                isDragging: true
            }),
            endDrag: props => ({
                index: props.index,
                isDragging: false
            })
        },
        (connect, monitor) => ({
            connectDragSource: connect.dragSource(),
            isDragging: monitor.isDragging()
        })
    )(Field)
));
