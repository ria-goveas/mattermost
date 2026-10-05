// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {ChannelType} from '@mattermost/types/channels';

import {fireEvent, renderWithContext, screen} from 'tests/react_testing_utils';
import {Constants} from 'utils/constants';
import {TestHelper} from 'utils/test_helper';

import ChannelHeaderMobile from './mobile_channel_header';

describe('components/ChannelHeaderMobile/ChannelHeaderMobile', () => {
    global.document.querySelector = jest.fn().mockReturnValue({
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
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

        test('shows the channel purpose', () => {
            renderWithContext(
                <ChannelHeaderMobile
                    channel={TestHelper.getChannelMock({
                        ...channel,
                        purpose: 'Release notes and rollout plans',
                    })}
                    isMobileView={true}
                    user={user}
                    actions={actions}
                />,
            );

            expect(screen.getByRole('button', {name: 'Release notes and rollout plans'})).toBeInTheDocument();
        });

        test('truncates a long purpose until it is tapped', () => {
            const longPurpose = 'Coordinate release notes, rollout plans, and channel usage. '.repeat(5).slice(0, 250);
            renderWithContext(
                <ChannelHeaderMobile
                    channel={TestHelper.getChannelMock({
                        ...channel,
                        purpose: longPurpose,
                    })}
                    isMobileView={true}
                    user={user}
                    actions={actions}
                />,
            );

            const purpose = screen.getByRole('button', {name: longPurpose});
            expect(purpose).toHaveClass('channel-header__purpose');
            expect(purpose).not.toHaveClass('channel-header__purpose--expanded');
            expect(purpose).toHaveAttribute('aria-expanded', 'false');

            fireEvent.click(purpose);
            expect(purpose).toHaveClass('channel-header__purpose--expanded');
            expect(purpose).toHaveAttribute('aria-expanded', 'true');
            expect(purpose).toHaveTextContent(longPurpose);
        });

        test('hides the purpose line when the purpose is empty', () => {
            for (const purpose of ['', '   ']) {
                const {container} = renderWithContext(
                    <ChannelHeaderMobile
                        channel={TestHelper.getChannelMock({
                            ...channel,
                            purpose,
                        })}
                        isMobileView={true}
                        user={user}
                        actions={actions}
                    />,
                );

                expect(container.querySelector('.channel-header__purpose')).toBeNull();
            }
        });

        test('does not show a purpose line for direct and group messages', () => {
            const {container: dmContainer} = renderWithContext(
                <ChannelHeaderMobile
                    channel={TestHelper.getChannelMock({
                        ...channel,
                        type: Constants.DM_CHANNEL as ChannelType,
                        purpose: 'Direct message purpose',
                    })}
                    isMobileView={true}
                    user={user}
                    actions={actions}
                />,
            );
            expect(dmContainer.querySelector('.channel-header__purpose')).toBeNull();
            expect(screen.queryByText('Direct message purpose')).not.toBeInTheDocument();

            const {container: gmContainer} = renderWithContext(
                <ChannelHeaderMobile
                    channel={TestHelper.getChannelMock({
                        ...channel,
                        type: Constants.GM_CHANNEL as ChannelType,
                        purpose: 'Group message purpose',
                    })}
                    isMobileView={true}
                    user={user}
                    actions={actions}
                />,
            );
            expect(gmContainer.querySelector('.channel-header__purpose')).toBeNull();
            expect(screen.queryByText('Group message purpose')).not.toBeInTheDocument();
        });
    });
});
