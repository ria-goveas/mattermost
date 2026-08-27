// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useMemo, useCallback} from 'react';
import {useSelector, shallowEqual} from 'react-redux';
import {useParams} from 'react-router-dom';

import type {Team} from '@mattermost/types/teams';
import type {UserThread} from '@mattermost/types/threads';

import {getCurrentTeamId} from 'mattermost-redux/selectors/entities/teams';
import {getCurrentUserId} from 'mattermost-redux/selectors/entities/users';

import {useNavigate} from 'utils/react_router_v6';

/**
 * GlobalThreads-specific hook for nav/routing, selection, and common data needed for actions.
 */
export function useThreadRouting() {
    const matchParams = useParams<{team: string; threadIdentifier?: UserThread['id']}>();
    const params = useMemo(() => matchParams, [matchParams.threadIdentifier, matchParams.team]);
    const navigate = useNavigate();

    const currentTeamId = useSelector(getCurrentTeamId, shallowEqual);
    const currentUserId = useSelector(getCurrentUserId, shallowEqual);

    const select = useCallback((threadId?: UserThread['id']) => {
        return navigate(`/${params.team}/threads${threadId ? '/' + threadId : ''}`);
    }, [navigate, params.team]);

    const clear = useCallback(() => navigate(`/${params.team}/threads`, {replace: true}), [navigate, params.team]);

    const goToInChannel = useCallback((threadId?: UserThread['id'], teamName: Team['name'] = params.team) => {
        return navigate(`/${teamName}/pl/${threadId ?? params.threadIdentifier}`);
    }, [navigate, params.threadIdentifier, params.team]);

    return {
        params,
        currentTeamId,
        currentUserId,
        clear,
        select,
        goToInChannel,
    };
}
