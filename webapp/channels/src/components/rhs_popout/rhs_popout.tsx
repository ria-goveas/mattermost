// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useLocation, useParams} from 'react-router-dom';

import {fetchChannelsAndMembers, getChannelMembers, selectChannel} from 'mattermost-redux/actions/channels';
import {selectTeam} from 'mattermost-redux/actions/teams';
import {getChannelByName} from 'mattermost-redux/selectors/entities/channels';

import {useTeamByName} from 'components/common/hooks/use_team';
import RhsPluginPopout from 'components/rhs_plugin_popout';
import RhsSearchPopout from 'components/rhs_search_popout';
import UnreadsStatusHandler from 'components/unreads_status_handler';

import {CompatRoute, Routes, useMatch} from 'utils/react_router_compat';

import type {GlobalState} from 'types/store';

import './rhs_popout.scss';

export default function RhsPopout() {
    const match = useMatch('/_popout/rhs/:team');

    const dispatch = useDispatch();
    const location = useLocation();

    const {team: teamName} = useParams<{team: string}>();

    const team = useTeamByName(teamName);
    const channelIdentifier = new URLSearchParams(location.search).get('channel') ?? '';
    const channel = useSelector((state: GlobalState) => (channelIdentifier ? getChannelByName(state, channelIdentifier) : undefined));
    const teamId = team?.id;

    const channelId = channel?.id;
    const basePath = match?.path ?? `/_popout/rhs/:team`;

    useEffect(() => {
        if (channelId) {
            dispatch(selectChannel(channelId));
            dispatch(getChannelMembers(channelId));
        }
    }, [dispatch, channelId]);

    useEffect(() => {
        if (teamId) {
            dispatch(selectTeam(teamId));
            dispatch(fetchChannelsAndMembers(teamId));
        }
    }, [dispatch, teamId]);

    return (
        <>
            <UnreadsStatusHandler/>
            <div className='main-wrapper rhs-popout'>
                <div className='sidebar--right'>
                    <div className='sidebar-right__body'>
                        <Routes>
                            <CompatRoute
                                path={`${basePath}/search`}
                                element={<RhsSearchPopout/>}
                            />
                            <CompatRoute
                                path={`${basePath}/plugin/:pluginId`}
                                element={<RhsPluginPopout/>}
                            />
                        </Routes>
                    </div>
                </div>
            </div>
        </>
    );
}
