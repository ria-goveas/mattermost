// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {ChannelType} from '@mattermost/types/channels';
import type {UserCustomStatus} from '@mattermost/types/users';

import {renderWithContext} from 'tests/react_testing_utils';
import Constants, {RHSStates} from 'utils/constants';
import {TestHelper} from 'utils/test_helper';

import ChannelHeader from './channel_header';

describe('components/ChannelHeader', () => {
    const baseProps = {
        actions: {
            showPinnedPosts: jest.fn(),
            showChannelFiles: jest.fn(),
            closeRightHandSide: jest.fn(),
            getCustomEmojisInText: jest.fn(),
            updateChannelNotifyProps: jest.fn(),
            showChannelMembers: jest.fn(),
            fetchChannelRemotes: jest.fn(),
        },
        team: TestHelper.getTeamMock({id: 'team_id'}),
        channel: TestHelper.getChannelMock({}),
        channelMember: TestHelper.getChannelMembershipMock({}),
        currentUser: TestHelper.getUserMock({}),
        isCustomStatusEnabled: false,
        isCustomStatusExpired: false,
        isFileAttachmentsEnabled: true,
        lastActivityTimestamp: 1632146562846,
        isLastActiveEnabled: true,
        memberCount: 2,
        dmUser: undefined,
        gmMembers: undefined,
        rhsState: RHSStates.CHANNEL_INFO,
        isChannelMuted: false,
        hasGuests: false,
        pinnedPostsCount: 0,
        customStatus: undefined,
        timestampUnits: [
            'now',
            'minute',
            'hour',
        ],
        hideGuestTags: false,
        remoteNames: [],
        sharedChannelsPluginsEnabled: false,
        isChannelAutotranslated: false,
    };

    const populatedProps = {
        ...baseProps,
        channel: TestHelper.getChannelMock({
            id: 'channel_id',
            team_id: 'team_id',
            name: 'Test',
            delete_at: 0,
        }),
        channelMember: TestHelper.getChannelMembershipMock({
            channel_id: 'channel_id',
            user_id: 'user_id',
        }),
        currentUser: TestHelper.getUserMock({
            id: 'user_id',
            bot_description: 'the bot description',
        }),
    };

    test('should render properly when empty', () => {
        const {container} = renderWithContext(
            <ChannelHeader {...baseProps}/>,
        );
        expect(container).toMatchSnapshot();
    });

    test('should render properly when populated', () => {
        const {container} = renderWithContext(
            <ChannelHeader {...populatedProps}/>,
        );
        expect(container).toMatchSnapshot();
    });

    test('should render properly when populated with channel props', () => {
        const props = {
            ...baseProps,
            channel: TestHelper.getChannelMock({
                id: 'channel_id',
                team_id: 'team_id',
                name: 'Test',
            }),
            channelMember: TestHelper.getChannelMembershipMock({
                channel_id: 'channel_id',
                user_id: 'user_id',
            }),
            currentUser: TestHelper.getUserMock({
                id: 'user_id',
            }),
        };

        const {container} = renderWithContext(
            <ChannelHeader {...props}/>,
        );
        expect(container).toMatchSnapshot();
    });

    test('should render archived view', () => {
        const props = {
            ...populatedProps,
            channel: {...populatedProps.channel, delete_at: 1234},
        };

        const {container} = renderWithContext(
            <ChannelHeader {...props}/>,
        );
        expect(container).toMatchSnapshot();
    });

    test('should render shared view', () => {
        const props = {
            ...populatedProps,
            channel: TestHelper.getChannelMock({
                ...populatedProps.channel,
                shared: true,
                type: Constants.OPEN_CHANNEL as ChannelType,
            }),
        };

        const {container} = renderWithContext(
            <ChannelHeader {...props}/>,
        );
        expect(container).toMatchSnapshot();
    });

    test('should render correct menu when muted', () => {
        const props = {
            ...populatedProps,
            isChannelMuted: true,
        };

        const {container} = renderWithContext(
            <ChannelHeader {...props}/>,
        );
        expect(container).toMatchSnapshot();
    });

    test('should unmute the channel when mute icon is clicked', () => {
        const props = {
            ...populatedProps,
            isChannelMuted: true,
        };

        const {container} = renderWithContext(
            <ChannelHeader {...props}/>,
        );

        const muteButton = container.querySelector('.channel-header__mute');
        expect(muteButton).not.toBeNull();
        (muteButton as HTMLElement).click();
        expect(props.actions.updateChannelNotifyProps).toHaveBeenCalledTimes(1);
        expect(props.actions.updateChannelNotifyProps).toHaveBeenCalledWith('user_id', 'channel_id', {mark_unread: 'all'});
    });

    test('should render active pinned posts', () => {
        const props = {
            ...populatedProps,
            rhsState: RHSStates.PIN,
        };

        const {container} = renderWithContext(
            <ChannelHeader {...props}/>,
        );
        expect(container).toMatchSnapshot();
    });

    test('should render active channel files', () => {
        const props = {
            ...populatedProps,
            rhsState: RHSStates.CHANNEL_FILES,
            showChannelFilesButton: true,
        };

        const {container} = renderWithContext(
            <ChannelHeader {...props}/>,
        );
        expect(container).toMatchSnapshot();
    });

    test('should render not active channel files', () => {
        const props = {
            ...populatedProps,
            rhsState: RHSStates.PIN,
            showChannelFilesButton: true,
        };

        const {container} = renderWithContext(
            <ChannelHeader {...props}/>,
        );
        expect(container).toMatchSnapshot();
    });

    test('should render active flagged posts', () => {
        const props = {
            ...populatedProps,
            rhsState: RHSStates.FLAG,
        };

        const {container} = renderWithContext(
            <ChannelHeader {...props}/>,
        );
        expect(container).toMatchSnapshot();
    });

    test('should render active mentions posts', () => {
        const props = {
            ...populatedProps,
            rhsState: RHSStates.MENTION,
        };

        const {container} = renderWithContext(
            <ChannelHeader {...props}/>,
        );
        expect(container).toMatchSnapshot();
    });

    test('should render the pinned icon with the pinned posts count', () => {
        const props = {
            ...populatedProps,
            pinnedPostsCount: 2,
        };
        const {container} = renderWithContext(
            <ChannelHeader {...props}/>,
        );
        expect(container).toMatchSnapshot();
    });

    test('should render properly when custom status is set', () => {
        const props = {
            ...populatedProps,
            channel: TestHelper.getChannelMock({
                type: Constants.DM_CHANNEL as ChannelType,
                status: 'offline',
            }),
            dmUser: TestHelper.getUserMock({
                id: 'user_id',
                is_bot: false,
            }),
            isCustomStatusEnabled: true,
            customStatus: {
                emoji: 'calender',
                text: 'In a meeting',
            } as UserCustomStatus,
        };

        const {container} = renderWithContext(
            <ChannelHeader {...props}/>,
        );
        expect(container).toMatchSnapshot();
    });

    test('should render properly when custom status is expired', () => {
        const props = {
            ...populatedProps,
            channel: TestHelper.getChannelMock({
                type: Constants.DM_CHANNEL as ChannelType,
                status: 'offline',
            }),
            dmUser: TestHelper.getUserMock({
                id: 'user_id',
                is_bot: false,
            }),
            isCustomStatusEnabled: true,
            isCustomStatusExpired: true,
            customStatus: {
                emoji: 'calender',
                text: 'In a meeting',
            } as UserCustomStatus,
        };

        const {container} = renderWithContext(
            <ChannelHeader {...props}/>,
        );
        expect(container).toMatchSnapshot();
    });

    test('should contain the channel info button', () => {
        const {container} = renderWithContext(
            <ChannelHeader {...populatedProps}/>,
        );

        // ChannelInfoButton renders a button with channel-info class
        const channelInfoButton = container.querySelector('.channel-header__info');
        expect(channelInfoButton).not.toBeNull();
    });

    test('should match snapshot with last active display', () => {
        const props = {
            ...populatedProps,
            channel: TestHelper.getChannelMock({
                type: Constants.DM_CHANNEL as ChannelType,
                status: 'offline',
            }),
            dmUser: TestHelper.getUserMock({
                id: 'user_id',
                is_bot: false,
                props: {
                    show_last_active: 'true',
                },
            }),
        };

        const {container} = renderWithContext(
            <ChannelHeader {...props}/>,
        );
        expect(container).toMatchSnapshot();
    });

    test('should match snapshot with no last active display because it is disabled', () => {
        const props = {
            ...populatedProps,
            isLastActiveEnabled: false,
            channel: TestHelper.getChannelMock({
                type: Constants.DM_CHANNEL as ChannelType,
                status: 'offline',
            }),
            dmUser: TestHelper.getUserMock({
                id: 'user_id',
                is_bot: false,
                props: {
                    show_last_active: 'false',
                },
            }),
        };

        const {container} = renderWithContext(
            <ChannelHeader {...props}/>,
        );
        expect(container).toMatchSnapshot();
    });

    test('shows the channel purpose under the channel name', () => {
        const props = {
            ...populatedProps,
            channel: TestHelper.getChannelMock({
                ...populatedProps.channel,
                purpose: 'Release notes and rollout plans',
            }),
        };

        const {container, store} = renderWithContext(
            <ChannelHeader {...props}/>,
        );

        const purpose = container.querySelector('.channel-header__purpose');
        expect(purpose).not.toBeNull();
        expect(purpose).toHaveTextContent('Release notes and rollout plans');
        expect(container.querySelector('.channel-header--has-purpose')).not.toBeNull();

        (purpose as HTMLElement).click();
        expect(store.getState().views.rhs.rhsState).toBe(RHSStates.CHANNEL_INFO);
    });

    test('truncates a long channel purpose to a single line', () => {
        const longPurpose = 'Coordinate release notes, rollout plans, and channel usage. '.repeat(5).slice(0, 250);
        const props = {
            ...populatedProps,
            channel: TestHelper.getChannelMock({
                ...populatedProps.channel,
                purpose: longPurpose,
            }),
        };

        const {container} = renderWithContext(
            <ChannelHeader {...props}/>,
        );

        const purpose = container.querySelector('.channel-header__purpose');
        expect(purpose).not.toBeNull();
        expect(purpose).toHaveClass('channel-header__purpose');
        expect(purpose).not.toHaveClass('channel-header__purpose--expanded');
        expect(purpose).toHaveTextContent(longPurpose);
    });

    test('hides the purpose line when the purpose is empty', () => {
        for (const purpose of ['', '   ']) {
            const props = {
                ...populatedProps,
                channel: TestHelper.getChannelMock({
                    ...populatedProps.channel,
                    purpose,
                }),
            };

            const {container} = renderWithContext(
                <ChannelHeader {...props}/>,
            );

            expect(container.querySelector('.channel-header__purpose')).toBeNull();
            expect(container.querySelector('.channel-header--has-purpose')).toBeNull();
        }
    });

    test('does not show a purpose line for direct and group messages', () => {
        const dmProps = {
            ...populatedProps,
            channel: TestHelper.getChannelMock({
                ...populatedProps.channel,
                type: Constants.DM_CHANNEL as ChannelType,
                purpose: 'Direct message purpose',
            }),
            dmUser: TestHelper.getUserMock({
                id: 'user_id',
                is_bot: false,
            }),
        };
        const {container: dmContainer} = renderWithContext(
            <ChannelHeader {...dmProps}/>,
        );
        expect(dmContainer.querySelector('.channel-header__purpose')).toBeNull();
        expect(dmContainer.querySelector('.channel-header--has-purpose')).toBeNull();

        const gmProps = {
            ...populatedProps,
            channel: TestHelper.getChannelMock({
                ...populatedProps.channel,
                type: Constants.GM_CHANNEL as ChannelType,
                purpose: 'Group message purpose',
            }),
        };
        const {container: gmContainer} = renderWithContext(
            <ChannelHeader {...gmProps}/>,
        );
        expect(gmContainer.querySelector('.channel-header__purpose')).toBeNull();
        expect(gmContainer.querySelector('.channel-header--has-purpose')).toBeNull();
    });
});
