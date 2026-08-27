// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {connect} from 'react-redux';
import {matchPath, useLocation} from 'react-router-dom';

import type {GlobalState} from '@mattermost/types/store';

import {getCurrentChannel, getUnreadStatus} from 'mattermost-redux/selectors/entities/channels';
import {getConfig} from 'mattermost-redux/selectors/entities/general';
import {getCurrentTeam} from 'mattermost-redux/selectors/entities/teams';

import UnreadsStatusHandler from './unreads_status_handler';

function mapStateToProps(state: GlobalState) {
    const config = getConfig(state);
    const currentChannel = getCurrentChannel(state);
    const currentTeammate = (currentChannel && currentChannel.teammate_id) ? currentChannel : null;
    const currentTeam = getCurrentTeam(state);

    return {
        currentChannel,
        currentTeam,
        currentTeammate,
        siteName: config.SiteName,
        unreadStatus: getUnreadStatus(state),
    };
}

const ConnectedUnreadsStatusHandler = connect(mapStateToProps)(UnreadsStatusHandler);

export default function UnreadsStatusHandlerContainer() {
    const {pathname} = useLocation();

    return (
        <ConnectedUnreadsStatusHandler
            inGlobalThreads={matchPath(pathname, {path: '/:team/threads/:threadIdentifier?'}) != null}
            inDrafts={matchPath(pathname, {path: '/:team/drafts'}) != null}
            inScheduledPosts={matchPath(pathname, {path: '/:team/scheduled_posts'}) != null}
        />
    );
}
