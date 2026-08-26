// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import type {Dispatch} from 'redux';

import {createSelector} from 'mattermost-redux/selectors/create_selector';
import {
    getCurrentChannel,
    getMyCurrentChannelMembership,
} from 'mattermost-redux/selectors/entities/channels';
import {getCurrentUser} from 'mattermost-redux/selectors/entities/users';
import {isChannelMuted} from 'mattermost-redux/utils/channel_utils';

import {close as closeLhs} from 'actions/views/lhs';
import {
    closeRightHandSide as closeRhs,
    closeMenu as closeRhsMenu,
} from 'actions/views/rhs';
import {getIsMobileView} from 'selectors/views/browser';

import type {GlobalState} from 'types/store';

import MobileChannelHeader from './mobile_channel_header';

const isCurrentChannelMuted = createSelector(
    'isCurrentChannelMuted',
    getMyCurrentChannelMembership,
    (membership) => isChannelMuted(membership),
);

const mapStateToProps = (state: GlobalState) => ({
    user: getCurrentUser(state),
    channel: getCurrentChannel(state),
    isMobileView: getIsMobileView(state),
    isMuted: isCurrentChannelMuted(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    actions: bindActionCreators({
        closeLhs,
        closeRhs,
        closeRhsMenu,
    }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(MobileChannelHeader);
