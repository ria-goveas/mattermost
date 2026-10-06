// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen, userEvent} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import ChannelHeaderMobile from './mobile_channel_header';

describe('components/ChannelHeaderMobile/ChannelHeaderMobile', () => {
    const querySelector = document.querySelector.bind(document);
    global.document.querySelector = jest.fn().mockImplementation((selector: string) => {
        if (selector === '.inner-wrap') {
            return {
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
            };
        }

        return querySelector(selector);
    });

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

        test('toggles the channel purpose without opening the channel menu', async () => {
            const purpose = 'Route warehouse exceptions here before posting in general';
            const channelWithPurpose = TestHelper.getChannelMock({
                ...channel,
                purpose,
            });

            renderWithContext(
                <ChannelHeaderMobile
                    channel={channelWithPurpose}
                    isMobileView={true}
                    user={user}
                    actions={actions}
                />,
                {
                    entities: {
                        channels: {
                            currentChannelId: channelWithPurpose.id,
                            channels: {
                                [channelWithPurpose.id]: channelWithPurpose,
                            },
                        },
                        users: {
                            currentUserId: user.id,
                            profiles: {
                                [user.id]: user,
                            },
                        },
                    },
                },
            );

            const purposeButton = screen.getByRole('button', {name: `Channel purpose: ${purpose}`});
            expect(purposeButton).toHaveClass('channel-header__purpose--truncated');
            expect(purposeButton).toHaveAttribute('aria-expanded', 'false');

            const menuButton = screen.getByRole('button', {name: `${channelWithPurpose.display_name} channel menu`});
            expect(menuButton).toHaveAttribute('aria-expanded', 'false');

            await userEvent.click(purposeButton);
            expect(purposeButton).toHaveClass('channel-header__purpose--expanded');
            expect(purposeButton).toHaveAttribute('aria-expanded', 'true');
            expect(purposeButton).toHaveTextContent(purpose);
            expect(menuButton).toHaveAttribute('aria-expanded', 'false');
            expect(screen.queryByRole('menu')).not.toBeInTheDocument();

            await userEvent.click(purposeButton);
            expect(purposeButton).toHaveClass('channel-header__purpose--truncated');
            expect(purposeButton).toHaveAttribute('aria-expanded', 'false');
            expect(menuButton).toHaveAttribute('aria-expanded', 'false');
        });
    });
});
