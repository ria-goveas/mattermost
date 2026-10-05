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

    const handleCreateNewChannelClick = useCallback(() => {
        showNewChannelModal();
    }, [showNewChannelModal]);

    // Browse channels opens the browse modal. Keep this off the create-channel handler.
    const handleBrowseChannelsClick = useCallback(() => {
        showMoreChannelsModal();
    }, [showMoreChannelsModal]);

    const handleOpenDirectMessageClick = useCallback(() => {
        handleOpenDirectMessagesModal();
    }, [handleOpenDirectMessagesModal]);

    const handleCreateUserGroupClick = useCallback(() => {
        showCreateUserGroupModal();
    }, [showCreateUserGroupModal]);

    const handleCreateCategoryClick = useCallback(() => {
        showCreateCategoryModal();
    }, [showCreateCategoryModal]);

    const handleInvitePeopleClick = useCallback(() => {
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
                    onCreateNewChannelClick={handleCreateNewChannelClick}
                    canJoinPublicChannel={canJoinPublicChannel}
                    onBrowseChannelClick={handleBrowseChannelsClick}
                    onOpenDirectMessageClick={handleOpenDirectMessageClick}
                    canCreateCustomGroups={canCreateCustomGroups}
                    onCreateNewUserGroupClick={handleCreateUserGroupClick}
                    unreadFilterEnabled={unreadFilterEnabled}
                    onCreateNewCategoryClick={handleCreateCategoryClick}
                    onInvitePeopleClick={handleInvitePeopleClick}
                />
            )}
        </div>
    );
};

export default SidebarHeader;
