// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen, userEvent} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import ChannelHeaderMobile from './mobile_channel_header';

describe('components/ChannelHeaderMobile/ChannelHeaderMobile', () => {
    const originalQuerySelector = document.querySelector.bind(document);
    document.querySelector = jest.fn((selector: string) => {
        if (selector === '.inner-wrap') {
            return {
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
            };
        }

        return originalQuerySelector(selector);
    }) as typeof document.querySelector;

    const user = TestHelper.getUserMock({
        id: 'user_id',
    });
    const channel = TestHelper.getChannelMock({
        type: 'O',
        id: 'channel_id',
        display_name: 'display_name',
        team_id: 'team_id',
    });
    const actions = {
        closeLhs: jest.fn(),
        closeRhs: jest.fn(),
        closeRhsMenu: jest.fn(),
    };

    describe('components/ChannelHeaderMenu/MenuItem/ChannelHeaderMobile', () => {
        test('renders the component correctly', () => {
            renderWithContext(
                <div
                    className='inner-wrap'
                    data-testid='wrapper'
                >
                    <ChannelHeaderMobile
                        channel={channel}
                        isMobileView={false}
                        user={user}
                        actions={actions}
                    />
                </div>,
            );

            let menuItem = screen.getByText('Toggle sidebar');
            expect(menuItem).toBeInTheDocument();

            menuItem = screen.getByLabelText('Info');
            expect(menuItem).toBeInTheDocument();

            menuItem = screen.getByLabelText('Search');
            expect(menuItem).toBeInTheDocument();

            menuItem = screen.getByText('Toggle right sidebar');
            expect(menuItem).toBeInTheDocument();

            const wrapper = screen.getByTestId('wrapper');
            expect(wrapper).toBeInTheDocument();
        });

        test('renders the component correctly, global threads', () => {
            renderWithContext(
                <div
                    className='inner-wrap'
                    data-testid='wrapper'
                >
                    <ChannelHeaderMobile
                        channel={channel}
                        isMobileView={false}
                        inGlobalThreads={true}
                        user={user}
                        actions={actions}
                    />
                </div>,
            );

            const menuItem = screen.getByText('Followed threads');
            expect(menuItem).toBeInTheDocument();
        });

        test('renders the component correctly, in drafts', () => {
            renderWithContext(
                <div
                    className='inner-wrap'
                    data-testid='wrapper'
                >
                    <ChannelHeaderMobile
                        channel={channel}
                        isMobileView={false}
                        inDrafts={true}
                        user={user}
                        actions={actions}
                    />
                </div>,
            );

            const menuItem = screen.getByText('Drafts');
            expect(menuItem).toBeInTheDocument();
        });

        test('renders a truncated purpose that expands and collapses', async () => {
            const purpose = 'Warehouse receiving only — do not post outbound freight here';
            renderWithContext(
                <ChannelHeaderMobile
                    channel={{
                        ...channel,
                        purpose,
                    }}
                    isMobileView={true}
                    user={user}
                    actions={actions}
                />,
            );

            const purposeButton = screen.getByRole('button', {name: `Channel purpose: ${purpose}`});
            expect(purposeButton).toHaveClass('navbar-purpose');
            expect(purposeButton).toHaveAttribute('aria-expanded', 'false');
            expect(document.getElementById('navbarPurposeCard')).toBeNull();

            await userEvent.click(purposeButton);
            const card = document.getElementById('navbarPurposeCard');
            expect(card).not.toBeNull();
            expect(card).toHaveTextContent(purpose);
            expect(card).toHaveClass('navbar-purpose-card');
            expect(purposeButton).toHaveAttribute('aria-expanded', 'true');

            await userEvent.click(purposeButton);
            expect(document.getElementById('navbarPurposeCard')).toBeNull();
            expect(purposeButton).toHaveAttribute('aria-expanded', 'false');
        });

        test('does not render a purpose for direct messages', () => {
            renderWithContext(
                <ChannelHeaderMobile
                    channel={{
                        ...channel,
                        type: 'D',
                        purpose: 'DM purpose',
                    }}
                    isMobileView={true}
                    user={user}
                    actions={actions}
                />,
            );

            expect(screen.queryByRole('button', {name: /Channel purpose:/})).not.toBeInTheDocument();
        });

        test('tapping the channel name still opens the channel menu', async () => {
            const purpose = 'Inbound only';
            const stateChannel = {
                ...channel,
                purpose,
            };
            renderWithContext(
                <ChannelHeaderMobile
                    channel={stateChannel}
                    isMobileView={true}
                    user={user}
                    actions={actions}
                />,
                {
                    entities: {
                        channels: {
                            currentChannelId: channel.id,
                            channels: {
                                [channel.id]: stateChannel,
                            },
                            myMembers: {
                                [channel.id]: TestHelper.getChannelMembershipMock({
                                    channel_id: channel.id,
                                    user_id: user.id,
                                }),
                            },
                        },
                        users: {
                            currentUserId: user.id,
                            profiles: {
                                [user.id]: user,
                            },
                        },
                        teams: {
                            currentTeamId: channel.team_id,
                        },
                        general: {
                            license: {},
                        },
                    },
                },
            );

            const purposeButton = screen.getByRole('button', {name: `Channel purpose: ${purpose}`});
            const menuButton = document.getElementById('channelHeaderDropdownButton');
            expect(menuButton).not.toBeNull();
            expect(menuButton).toHaveAttribute('aria-expanded', 'false');

            await userEvent.click(purposeButton);
            expect(menuButton).toHaveAttribute('aria-expanded', 'false');
            expect(document.getElementById('navbarPurposeCard')).not.toBeNull();

            await userEvent.click(menuButton!);
            expect(menuButton).toHaveAttribute('aria-expanded', 'true');

            // Opening this menu logs a pre-existing isReadonly DOM warning.
            jest.spyOn(console, 'error').mockClear();
        });
    });
});
