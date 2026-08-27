// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useLocation} from 'react-router-dom';

import {getMe} from 'mattermost-redux/actions/users';
import {getCurrentUserId} from 'mattermost-redux/selectors/entities/users';

import {loadStatusesByIds} from 'actions/status_actions';

import ChannelPopout from 'components/channel_popout';
import HelpPopout from 'components/help_popout';
import LoggedIn from 'components/logged_in';
import ModalController from 'components/modal_controller';
import RhsPopout from 'components/rhs_popout';
import {useUserTheme} from 'components/theme_provider';
import ThreadPopout from 'components/thread_popout';

import Pluggable from 'plugins/pluggable';
import {TEAM_NAME_PATH_PATTERN, ID_PATH_PATTERN, IDENTIFIER_PATH_PATTERN} from 'utils/path';
import {useBrowserPopout} from 'utils/popouts/use_browser_popout';
import {CompatRoute, Routes} from 'utils/react_router_compat';

import './popout_controller.scss';

const PopoutController = () => {
    const dispatch = useDispatch();
    const currentUserId = useSelector(getCurrentUserId);
    const location = useLocation();

    useBrowserPopout();
    useUserTheme();

    useEffect(() => {
        document.body.classList.add('app__body', 'popout');
        dispatch(getMe());

        return () => {
            document.body.classList.remove('app__body', 'popout');
        };
    }, [dispatch]);

    useEffect(() => {
        if (currentUserId) {
            dispatch(loadStatusesByIds([currentUserId]));
        }
    }, [dispatch, currentUserId]);

    return (
        <LoggedIn
            match={{url: location.pathname}}
            location={location}
        >
            <ModalController/>
            <Pluggable pluggableName='Root'/>
            <Routes>
                <CompatRoute
                    path={`/_popout/thread/:team(${TEAM_NAME_PATH_PATTERN})/:postId(${ID_PATH_PATTERN})`}
                    element={<ThreadPopout/>}
                />
                <CompatRoute
                    path={`/_popout/channel/:team(${TEAM_NAME_PATH_PATTERN})/:path(channels|messages)/:identifier(${IDENTIFIER_PATH_PATTERN})/:postid(${ID_PATH_PATTERN})?`}
                    element={<ChannelPopout/>}
                />
                <CompatRoute
                    path={`/_popout/rhs/:team(${TEAM_NAME_PATH_PATTERN})`}
                    element={<RhsPopout/>}
                />
                <CompatRoute
                    path='/_popout/help/:page?'
                    element={<HelpPopout/>}
                />
            </Routes>
        </LoggedIn>
    );
};

export default PopoutController;
