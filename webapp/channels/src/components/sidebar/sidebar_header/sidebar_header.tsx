// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {useSelector} from 'react-redux';

import {getCurrentTeam} from 'mattermost-redux/selectors/entities/teams';

import SidebarBrowseOrAddChannelMenu from './sidebar_browse_or_add_channel_menu';
import SidebarTeamMenu from './sidebar_team_menu';

import './sidebar_header.scss';

export type Props = {
    showNewChannelModal: () => void;
    showMoreChannelsModal: () => void;
    showCreateUserGroupModal: () => void;
    invitePeopleModal: () => void;
    showCreateCategoryModal: () => void;
    canCreateChannel: boolean;
    canJoinPublicChannel: boolean;
    handleOpenDirectMessagesModal: () => void;
    unreadFilterEnabled: boolean;
    canCreateCustomGroups: boolean;
};

const SidebarHeader = ({
    showNewChannelModal,
    showMoreChannelsModal,
    showCreateUserGroupModal,
    invitePeopleModal,
    showCreateCategoryModal,
    canCreateChannel,
    canJoinPublicChannel,
    handleOpenDirectMessagesModal,
    unreadFilterEnabled,
    canCreateCustomGroups,
}: Props) => {
    const currentTeam = useSelector(getCurrentTeam);

    const onCreateNewChannelClick = useCallback(() => {
        showNewChannelModal();
    }, [showNewChannelModal]);

    // Browse channels must open the browse modal, never the create-channel modal.
    const onBrowseChannelClick = useCallback(() => {
        showMoreChannelsModal();
    }, [showMoreChannelsModal]);

    const onOpenDirectMessageClick = useCallback(() => {
        handleOpenDirectMessagesModal();
    }, [handleOpenDirectMessagesModal]);

    const onCreateNewUserGroupClick = useCallback(() => {
        showCreateUserGroupModal();
    }, [showCreateUserGroupModal]);

    const onCreateNewCategoryClick = useCallback(() => {
        showCreateCategoryModal();
    }, [showCreateCategoryModal]);

    const onInvitePeopleClick = useCallback(() => {
        invitePeopleModal();
    }, [invitePeopleModal]);

    if (!currentTeam) {
        return null;
    }

    return (
        <div className='sidebarHeaderContainer'>
            <SidebarTeamMenu currentTeam={currentTeam}/>
            {(canCreateChannel || canJoinPublicChannel) && (
                <SidebarBrowseOrAddChannelMenu
                    canCreateChannel={canCreateChannel}
                    onCreateNewChannelClick={onCreateNewChannelClick}
                    canJoinPublicChannel={canJoinPublicChannel}
                    onBrowseChannelClick={onBrowseChannelClick}
                    onOpenDirectMessageClick={onOpenDirectMessageClick}
                    canCreateCustomGroups={canCreateCustomGroups}
                    onCreateNewUserGroupClick={onCreateNewUserGroupClick}
                    unreadFilterEnabled={unreadFilterEnabled}
                    onCreateNewCategoryClick={onCreateNewCategoryClick}
                    onInvitePeopleClick={onInvitePeopleClick}
                />
            )}
        </div>
    );
};

export default SidebarHeader;
