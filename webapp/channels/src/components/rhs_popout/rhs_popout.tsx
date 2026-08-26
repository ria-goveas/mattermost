// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {CompatRoute, useLocation, useParams} from 'react-router-dom-v5-compat';

import {fetchChannelsAndMembers, getChannelMembers, selectChannel} from 'mattermost-redux/actions/channels';
import {selectTeam} from 'mattermost-redux/actions/teams';
import {getChannelByName} from 'mattermost-redux/selectors/entities/channels';

import {useTeamByName} from 'components/common/hooks/use_team';
import RhsPluginPopout from 'components/rhs_plugin_popout';
import RhsSearchPopout from 'components/rhs_search_popout';
import UnreadsStatusHandler from 'components/unreads_status_handler';

import type {GlobalState} from 'types/store';

import './rhs_popout.scss';

export default function RhsPopout() {
    const dispatch = useDispatch();
    const location = useLocation();

    const {team: teamName} = useParams<{team: string}>();

    const team = useTeamByName(teamName ?? '');
    const channelIdentifier = new URLSearchParams(location.search).get('channel') ?? '';
    const channel = useSelector((state: GlobalState) => (channelIdentifier ? getChannelByName(state, channelIdentifier) : undefined));
    const teamId = team?.id;

    const channelId = channel?.id;

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
                        <CompatRoute
                            path='/_popout/rhs/:team/search'
                            component={RhsSearchPopout}
                        />
                        <CompatRoute
                            path='/_popout/rhs/:team/plugin/:pluginId'
                            component={RhsPluginPopout}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
