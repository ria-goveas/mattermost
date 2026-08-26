// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createMemoryHistory} from 'history';
import React from 'react';
import {Route} from 'react-router-dom';

import {renderWithContext, screen} from 'tests/react_testing_utils';

import ChannelViewWithRoute, {ChannelView} from './channel_view';
import type {Props} from './channel_view';

jest.mock('components/async_load', () => ({
    makeAsyncComponent: (name: string) => {
        const Component = () => <div data-testid={name}/>;
        Component.displayName = name;
        return Component;
    },
}));

jest.mock('components/deferComponentRender', () => {
    return jest.fn(() => {
        return function DeferredPostView(props: any) {
            return (
                <div
                    data-testid='deferred-post-view'
                    {...(props.focusedPostId ? {'data-focused-post-id': props.focusedPostId} : {})}
                    data-channel-id={props.channelId}
                />
            );
        };
    });
});

jest.mock('components/post_view', () => () => <div data-testid='post-view'/>);

jest.mock('client/web_websocket_client', () => ({
    __esModule: true,
    default: {updateActiveChannel: jest.fn()},
}));

jest.mock('./input_loading', () => () => <div data-testid='input-loading'/>);

describe('components/channel_view', () => {
    const baseProps: Props = {
        channelId: 'channelId',
        deactivatedChannel: false,
        pathname: '/team/channels/channelId',
        enableOnboardingFlow: true,
        teamUrl: '/team',
        channelIsArchived: false,
        isCloud: false,
        goToLastViewedChannel: jest.fn(),
        isFirstAdmin: false,
        enableWebSocketEventScope: false,
        isChannelBookmarksEnabled: false,
        missingChannelRole: false,
        fetchIsRestrictedDM: jest.fn(),
        canRestrictDirectMessage: false,
        restrictDirectMessage: false,
    };

    it('Should match snapshot with base props', () => {
        const {container} = renderWithContext(<ChannelView {...baseProps}/>);
        expect(container).toMatchSnapshot();
    });

    it('Should match snapshot if channel is archived', () => {
        const {container} = renderWithContext(
            <ChannelView
                {...baseProps}
                channelIsArchived={true}
            />,
        );
        expect(container).toMatchSnapshot();
    });

    it('Should match snapshot if channel is deactivated', () => {
        const {container} = renderWithContext(
            <ChannelView
                {...baseProps}
                deactivatedChannel={true}
            />,
        );
        expect(container).toMatchSnapshot();
    });

    it('Should have focusedPostId state based on props', () => {
        const {rerender} = renderWithContext(<ChannelView {...baseProps}/>);

        // Initially no focusedPostId
        expect(screen.getByTestId('deferred-post-view')).not.toHaveAttribute('data-focused-post-id');

        // Rerender with postid
        rerender(
            <ChannelView
                {...baseProps}
                channelId='newChannelId'
                pathname='/team/channels/channelId/postid'
                postId='postid'
            />,
        );
        expect(screen.getByTestId('deferred-post-view')).toHaveAttribute('data-focused-post-id', 'postid');

        // Rerender with different postid
        rerender(
            <ChannelView
                {...baseProps}
                channelId='newChannelId'
                pathname='/team/channels/channelId/postid1'
                postId='postid1'
            />,
        );
        expect(screen.getByTestId('deferred-post-view')).toHaveAttribute('data-focused-post-id', 'postid1');
    });

    it('reads the focused post from the route', () => {
        const history = createMemoryHistory({initialEntries: ['/team/channels/channel/postid']});

        renderWithContext(
            <Route path='/:team/channels/:identifier/:postid?'>
                <ChannelViewWithRoute {...baseProps}/>
            </Route>,
            {},
            {history},
        );

        expect(screen.getByTestId('deferred-post-view')).toHaveAttribute('data-focused-post-id', 'postid');
    });

    it('should call fetchRecentMentions on componentDidUpdate', () => {
        const {rerender} = renderWithContext(
            <ChannelView
                {...baseProps}
                canRestrictDirectMessage={true}
                restrictDirectMessage={undefined as any}
            />,
        );
        rerender(
            <ChannelView
                {...baseProps}
                canRestrictDirectMessage={true}
                restrictDirectMessage={undefined as any}
                channelId='newChannelId'
            />,
        );
        expect(baseProps.fetchIsRestrictedDM).toHaveBeenCalledTimes(1);
    });
});
