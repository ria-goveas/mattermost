// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {Location} from 'history';
import React from 'react';
import {connect} from 'react-redux';
import {matchPath, useLocation} from 'react-router-dom-v5-compat';

import type {GlobalState} from '@mattermost/types/store';

import {getCurrentChannel, getUnreadStatus} from 'mattermost-redux/selectors/entities/channels';
import {getConfig} from 'mattermost-redux/selectors/entities/general';
import {getCurrentTeam} from 'mattermost-redux/selectors/entities/teams';

import UnreadsStatusHandler from './unreads_status_handler';

type Props = {pathname: Location['pathname']};

function mapStateToProps(state: GlobalState, {pathname}: Props) {
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
        ...getRouteFlags(pathname),
    };
}

export function getRouteFlags(pathname: string) {
    return {
        inGlobalThreads: matchPath('/:team/threads/:threadIdentifier?', pathname) != null,
        inDrafts: matchPath('/:team/drafts', pathname) != null,
        inScheduledPosts: matchPath('/:team/scheduled_posts', pathname) != null,
    };
}

const ConnectedUnreadsStatusHandler = connect(mapStateToProps)(UnreadsStatusHandler);

export default function UnreadsStatusHandlerWithLocation() {
    const {pathname} = useLocation();

    return React.createElement(ConnectedUnreadsStatusHandler, {pathname});
}
