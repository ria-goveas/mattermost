// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen, userEvent} from 'tests/react_testing_utils';
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

        test('renders a truncated purpose that expands below the navbar', async () => {
            const purpose = 'Warehouse updates and shift handoffs';
            renderWithContext(
                <ChannelHeaderMobile
                    channel={{...channel, purpose}}
                    isMobileView={true}
                    user={user}
                    actions={actions}
                />,
            );

            const purposeButton = screen.getByRole('button', {name: `Channel purpose: ${purpose}`});
            expect(purposeButton).toHaveClass('mobile-channel-header__purpose');
            expect(purposeButton).toHaveAttribute('aria-expanded', 'false');
            expect(document.getElementById('mobileChannelPurposeCard')).toBeNull();

            await userEvent.click(purposeButton);

            const card = document.getElementById('mobileChannelPurposeCard');
            expect(card).toBeInTheDocument();
            expect(card).toHaveTextContent(purpose);
            expect(card).toHaveClass('mobile-channel-header__purpose-card');
            expect(document.getElementById('navbar')?.contains(card)).toBe(false);
            expect(purposeButton).toHaveAttribute('aria-expanded', 'true');

            await userEvent.click(purposeButton);
            expect(document.getElementById('mobileChannelPurposeCard')).toBeNull();
        });

        test('does not render a purpose for direct messages', () => {
            renderWithContext(
                <ChannelHeaderMobile
                    channel={{...channel, type: 'D', purpose: 'hidden purpose'}}
                    isMobileView={true}
                    user={user}
                    actions={actions}
                />,
            );

            expect(screen.queryByRole('button', {name: /Channel purpose:/})).not.toBeInTheDocument();
        });

        test('collapses the purpose when the channel changes', async () => {
            const {rerender} = renderWithContext(
                <ChannelHeaderMobile
                    channel={{...channel, purpose: 'First purpose'}}
                    isMobileView={true}
                    user={user}
                    actions={actions}
                />,
            );

            await userEvent.click(screen.getByRole('button', {name: 'Channel purpose: First purpose'}));
            expect(document.getElementById('mobileChannelPurposeCard')).toBeInTheDocument();

            rerender(
                <ChannelHeaderMobile
                    channel={{...channel, id: 'other_channel', purpose: 'Second purpose'}}
                    isMobileView={true}
                    user={user}
                    actions={actions}
                />,
            );

            expect(document.getElementById('mobileChannelPurposeCard')).toBeNull();
            expect(screen.getByRole('button', {name: 'Channel purpose: Second purpose'})).toHaveAttribute('aria-expanded', 'false');
        });
    });
});
