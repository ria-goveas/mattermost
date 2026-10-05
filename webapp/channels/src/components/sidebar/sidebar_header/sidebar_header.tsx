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

const SidebarHeader = (props: Props) => {
    const currentTeam = useSelector(getCurrentTeam);
    const {showNewChannelModal, showMoreChannelsModal} = props;

    const handleCreateNewChannelClick = useCallback(() => {
        showNewChannelModal();
    }, [showNewChannelModal]);

    const handleBrowseChannelClick = useCallback(() => {
        showMoreChannelsModal();
    }, [showMoreChannelsModal]);

    if (!currentTeam) {
        return null;
    }

    return (
        <div className='sidebarHeaderContainer'>
            <SidebarTeamMenu currentTeam={currentTeam}/>
            {(props.canCreateChannel || props.canJoinPublicChannel) && (
                <SidebarBrowseOrAddChannelMenu
                    canCreateChannel={props.canCreateChannel}
                    onCreateNewChannelClick={handleCreateNewChannelClick}
                    canJoinPublicChannel={props.canJoinPublicChannel}
                    onBrowseChannelClick={handleBrowseChannelClick}
                    onOpenDirectMessageClick={props.handleOpenDirectMessagesModal}
                    canCreateCustomGroups={props.canCreateCustomGroups}
                    onCreateNewUserGroupClick={props.showCreateUserGroupModal}
                    unreadFilterEnabled={props.unreadFilterEnabled}
                    onCreateNewCategoryClick={props.showCreateCategoryModal}
                    onInvitePeopleClick={props.invitePeopleModal}
                />
            )}
        </div>
    );
};

export default SidebarHeader;
