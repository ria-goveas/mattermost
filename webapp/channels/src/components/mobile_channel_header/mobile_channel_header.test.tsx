// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen, userEvent} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import ChannelHeaderMobile from './mobile_channel_header';

jest.mock('../channel_header_menu/channel_header_menu', () => {
    const React = require('react');

    return function MockChannelHeaderMenu() {
        const [open, setOpen] = React.useState(false);

        return (
            <button
                type='button'
                id='channelHeaderDropdownButton'
                aria-label='display_name channel menu'
                aria-expanded={open}
                onClick={() => setOpen(true)}
            >
                <strong id='channelHeaderTitle'>{'display_name'}</strong>
            </button>
        );
    };
});

describe('components/ChannelHeaderMobile/ChannelHeaderMobile', () => {
    const originalQuerySelector = document.querySelector.bind(document);
    global.document.querySelector = jest.fn((selector: string) => {
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

        test('shows a truncated purpose under the channel name and expands it below the navbar', async () => {
            const purpose = 'Route inbound pallets to the east dock before noon';
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
            );

            const purposeButton = screen.getByRole('button', {name: `Channel purpose: ${purpose}`});
            expect(purposeButton).toHaveClass('channel-header__mobile-purpose');
            expect(purposeButton).toHaveTextContent(purpose);
            expect(document.getElementById('navbar')).toContainElement(purposeButton);
            expect(document.getElementById('channelHeaderMobilePurposeCard')).not.toBeInTheDocument();

            const channelName = document.getElementById('channelHeaderTitle');
            expect(channelName).not.toBeNull();
            await userEvent.click(purposeButton);

            const card = document.getElementById('channelHeaderMobilePurposeCard');
            expect(card).toBeInTheDocument();
            expect(card).toHaveTextContent(purpose);
            expect(document.getElementById('navbar')).not.toContainElement(card);
            expect(document.getElementById('channelHeaderTitle')).toBe(channelName);

            await userEvent.click(purposeButton);
            expect(document.getElementById('channelHeaderMobilePurposeCard')).not.toBeInTheDocument();
            expect(document.getElementById('channelHeaderTitle')).toBe(channelName);
        });

        test('keeps the channel menu on the channel name when a purpose is shown', async () => {
            const channelWithPurpose = TestHelper.getChannelMock({
                ...channel,
                display_name: 'display_name',
                purpose: 'Dock assignments',
            });

            renderWithContext(
                <ChannelHeaderMobile
                    channel={channelWithPurpose}
                    isMobileView={true}
                    user={user}
                    actions={actions}
                />,
            );

            const menuButton = screen.getByRole('button', {name: 'display_name channel menu'});
            const purposeButton = screen.getByRole('button', {name: 'Channel purpose: Dock assignments'});
            expect(menuButton).toHaveAttribute('aria-expanded', 'false');

            await userEvent.click(purposeButton);
            expect(menuButton).toHaveAttribute('aria-expanded', 'false');
            expect(document.getElementById('channelHeaderMobilePurposeCard')).toBeInTheDocument();

            await userEvent.click(menuButton);
            expect(menuButton).toHaveAttribute('aria-expanded', 'true');
            expect(document.getElementById('channelHeaderMobilePurposeCard')).toBeInTheDocument();
        });

        test('does not show a purpose line for direct messages or an empty purpose', () => {
            const directChannel = TestHelper.getChannelMock({
                ...channel,
                type: 'D',
                purpose: 'A direct purpose',
            });

            const {rerender} = renderWithContext(
                <ChannelHeaderMobile
                    channel={directChannel}
                    isMobileView={true}
                    user={user}
                    actions={actions}
                />,
            );
            expect(screen.queryByRole('button', {name: /Channel purpose:/})).not.toBeInTheDocument();

            rerender(
                <ChannelHeaderMobile
                    channel={TestHelper.getChannelMock({
                        ...channel,
                        purpose: '',
                    })}
                    isMobileView={true}
                    user={user}
                    actions={actions}
                />,
            );
            expect(screen.queryByRole('button', {name: /Channel purpose:/})).not.toBeInTheDocument();
        });
    });
});
