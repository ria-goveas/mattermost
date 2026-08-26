// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {memo, useCallback} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';

import {WithTooltip} from '@mattermost/shared/components/tooltip';

import {Permissions} from 'mattermost-redux/constants';
import {getCurrentChannel} from 'mattermost-redux/selectors/entities/channels';
import {haveIChannelPermission} from 'mattermost-redux/selectors/entities/roles';

import {openModal} from 'actions/views/modals';

import EditChannelPurposeModal from 'components/edit_channel_purpose_modal';

import {Constants, ModalIdentifiers} from 'utils/constants';

import type {GlobalState} from 'types/store';

import './channel_header_purpose.scss';

const ChannelHeaderPurpose = () => {
    const {formatMessage} = useIntl();
    const dispatch = useDispatch();
    const channel = useSelector(getCurrentChannel);

    const canManageProperties = useSelector((state: GlobalState) => {
        if (!channel) {
            return false;
        }

        const permission = channel.type === Constants.PRIVATE_CHANNEL ?
            Permissions.MANAGE_PRIVATE_CHANNEL_PROPERTIES :
            Permissions.MANAGE_PUBLIC_CHANNEL_PROPERTIES;

        return haveIChannelPermission(state, channel.team_id, channel.id, permission);
    });

    const openEditPurpose = useCallback(() => {
        if (!channel) {
            return;
        }

        dispatch(openModal({
            modalId: ModalIdentifiers.EDIT_CHANNEL_PURPOSE,
            dialogType: EditChannelPurposeModal,
            dialogProps: {channel},
        }));
    }, [channel, dispatch]);

    if (!channel || channel.type === Constants.DM_CHANNEL || channel.type === Constants.GM_CHANNEL) {
        return null;
    }

    const canEdit = channel.delete_at === 0 && canManageProperties;
    const purpose = channel.purpose?.trim() ?? '';

    if (!purpose && !canEdit) {
        return null;
    }

    const editLabel = formatMessage({id: 'channel_info_rhs.edit_link', defaultMessage: 'Edit'});
    const editTooltip = formatMessage({id: 'channel_info_rhs.about_area.edit_channel_purpose', defaultMessage: 'Edit channel purpose'});

    return (
        <div
            id='channelHeaderPurpose'
            className='ChannelHeaderPurpose'
            data-testid='channelHeaderPurpose'
        >
            <div className='ChannelHeaderPurpose__content'>
                {purpose ? (
                    <span
                        className='ChannelHeaderPurpose__text'
                        title={purpose}
                    >
                        {purpose}
                    </span>
                ) : (
                    <button
                        type='button'
                        className='ChannelHeaderPurpose__add'
                        onClick={openEditPurpose}
                    >
                        <FormattedMessage
                            id='channel_info_rhs.about_area.add_channel_purpose'
                            defaultMessage='Add a channel purpose'
                        />
                        <i
                            className='icon icon-pencil-outline'
                            aria-hidden={true}
                        />
                    </button>
                )}
            </div>
            {purpose && canEdit && (
                <div className='ChannelHeaderPurpose__edit'>
                    <WithTooltip title={editTooltip}>
                        <button
                            type='button'
                            className='ChannelHeaderPurpose__editButton'
                            onClick={openEditPurpose}
                            aria-label={editLabel}
                        >
                            <i
                                className='icon icon-pencil-outline'
                                aria-hidden={true}
                            />
                        </button>
                    </WithTooltip>
                </div>
            )}
        </div>
    );
};

export default memo(ChannelHeaderPurpose);
