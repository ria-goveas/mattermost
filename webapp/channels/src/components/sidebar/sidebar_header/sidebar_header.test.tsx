// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {Permissions} from 'mattermost-redux/constants';

import {renderWithContext, screen, userEvent, waitFor} from 'tests/react_testing_utils';
import {CloudProducts} from 'utils/constants';
import {FileSizes} from 'utils/file_utils';
import {TestHelper} from 'utils/test_helper';

import SidebarHeader from './sidebar_header';
import type {Props} from './sidebar_header';

async function openBrowseOrAddChannelMenu() {
    await userEvent.click(screen.getByRole('button', {name: /Browse or create channels/i}));
    await screen.findByRole('menuitem', {name: /Browse channels/i});
}

function freshHandlers(): Pick<Props,
'handleOpenDirectMessagesModal' |
'invitePeopleModal' |
'showCreateCategoryModal' |
'showCreateUserGroupModal' |
'showMoreChannelsModal' |
'showNewChannelModal'
> {
    return {
        handleOpenDirectMessagesModal: jest.fn(),
        invitePeopleModal: jest.fn(),
        showCreateCategoryModal: jest.fn(),
        showCreateUserGroupModal: jest.fn(),
        showMoreChannelsModal: jest.fn(),
        showNewChannelModal: jest.fn(),
    };
}

describe('SidebarHeader', () => {
    const defaultProps: Props = {
        showNewChannelModal: jest.fn(),
        showMoreChannelsModal: jest.fn(),
        invitePeopleModal: jest.fn(),
        showCreateCategoryModal: jest.fn(),
        canCreateChannel: true,
        canJoinPublicChannel: true,
        handleOpenDirectMessagesModal: jest.fn(),
        unreadFilterEnabled: true,
        showCreateUserGroupModal: jest.fn(),
        canCreateCustomGroups: true,
    };

    const team = TestHelper.getTeamMock({
        display_name: 'Steadfast',
    });

    const initialState = {
        entities: {
            general: {
                config: {},
            },
            preferences: {
                myPreferences: {},
            },
            teams: {
                currentTeamId: team.id,
                teams: {
                    [team.id]: team,
                },
                myMembers: {
                    [team.id]: {
                        roles: 'team_user',
                    },
                },
            },
            users: {
                profiles: {
                    uid: {
                        id: 'uid',
                        roles: 'system_user system_admin',
                    },
                },
                currentUserId: 'uid',
            },
            roles: {
                roles: {
                    system_admin: {
                        permissions: [Permissions.MANAGE_TEAM],
                    },
                    system_user: {
                        permissions: [],
                    },
                    team_user: {
                        permissions: [],
                    },
                },
            },
            usage: {
                integrations: {
                    enabled: 11,
                    enabledLoaded: true,
                },
                messages: {
                    history: 10000,
                    historyLoaded: true,
                },
                files: {
                    totalStorage: FileSizes.Gigabyte,
                    totalStorageLoaded: true,
                },
                teams: {
                    active: 1,
                    teamsLoaded: true,
                },
                boards: {
                    cards: 500,
                    cardsLoaded: true,
                },
            },
            cloud: {
                subscription: {
                    product_id: 'test_prod_1',
                    trial_end_at: 1652807380,
                    is_free_trial: 'false',
                },
                products: {
                    test_prod_1: {
                        id: 'test_prod_1',
                        sku: CloudProducts.STARTER,
                        price_per_seat: 0,
                    },
                },
                limits: {
                    limitsLoaded: true,
                    limits: {
                        integrations: {
                            enabled: 10,
                        },
                        messages: {
                            history: 10000,
                        },
                        files: {
                            total_storage: FileSizes.Gigabyte,
                        },
                        teams: {
                            active: 1,
                        },
                        boards: {
                            cards: 500,
                            views: 5,
                        },
                    },
                },
            },
        },
    };

    test('should render the team menu button', () => {
        renderWithContext(<SidebarHeader {...defaultProps}/>, initialState);

        expect(screen.getByText('Steadfast')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: team.display_name})).toBeInTheDocument();
    });

    test('should render the \'Browse or create channels\' menu button', () => {
        renderWithContext(<SidebarHeader {...defaultProps}/>, initialState);

        expect(screen.getByRole('button', {name: /Browse or create channels/i})).toBeInTheDocument();
    });

    test('should call showMoreChannelsModal when Browse channels is clicked', async () => {
        const handlers = freshHandlers();
        renderWithContext(
            <SidebarHeader
                {...defaultProps}
                {...handlers}
            />,
            initialState,
        );

        await openBrowseOrAddChannelMenu();
        await userEvent.click(screen.getByRole('menuitem', {name: /Browse channels/i}));

        // Menu.Item defers onClick until after the close animation.
        await waitFor(() => {
            expect(handlers.showMoreChannelsModal).toHaveBeenCalledTimes(1);
        });
        expect(handlers.showNewChannelModal).not.toHaveBeenCalled();
        expect(handlers.handleOpenDirectMessagesModal).not.toHaveBeenCalled();
        expect(handlers.showCreateUserGroupModal).not.toHaveBeenCalled();
        expect(handlers.showCreateCategoryModal).not.toHaveBeenCalled();
        expect(handlers.invitePeopleModal).not.toHaveBeenCalled();
    });

    test('should call showNewChannelModal when Create new channel is clicked', async () => {
        const handlers = freshHandlers();
        renderWithContext(
            <SidebarHeader
                {...defaultProps}
                {...handlers}
            />,
            initialState,
        );

        await openBrowseOrAddChannelMenu();
        await userEvent.click(screen.getByRole('menuitem', {name: /Create new channel/i}));

        await waitFor(() => {
            expect(handlers.showNewChannelModal).toHaveBeenCalledTimes(1);
        });
        expect(handlers.showMoreChannelsModal).not.toHaveBeenCalled();
        expect(handlers.handleOpenDirectMessagesModal).not.toHaveBeenCalled();
        expect(handlers.showCreateUserGroupModal).not.toHaveBeenCalled();
        expect(handlers.showCreateCategoryModal).not.toHaveBeenCalled();
        expect(handlers.invitePeopleModal).not.toHaveBeenCalled();
    });

    test('should leave other + menu items wired to their own handlers', async () => {
        const handlers = freshHandlers();
        renderWithContext(
            <SidebarHeader
                {...defaultProps}
                {...handlers}
                unreadFilterEnabled={false}
            />,
            initialState,
        );

        await openBrowseOrAddChannelMenu();
        await userEvent.click(screen.getByRole('menuitem', {name: /Open a direct message/i}));
        await waitFor(() => {
            expect(handlers.handleOpenDirectMessagesModal).toHaveBeenCalledTimes(1);
        });
        expect(handlers.showMoreChannelsModal).not.toHaveBeenCalled();
        expect(handlers.showNewChannelModal).not.toHaveBeenCalled();

        await openBrowseOrAddChannelMenu();
        await userEvent.click(screen.getByRole('menuitem', {name: /Create new user group/i}));
        await waitFor(() => {
            expect(handlers.showCreateUserGroupModal).toHaveBeenCalledTimes(1);
        });

        await openBrowseOrAddChannelMenu();
        await userEvent.click(screen.getByRole('menuitem', {name: /Create new category/i}));
        await waitFor(() => {
            expect(handlers.showCreateCategoryModal).toHaveBeenCalledTimes(1);
        });

        await openBrowseOrAddChannelMenu();
        await userEvent.click(screen.getByRole('menuitem', {name: /Invite people/i}));
        await waitFor(() => {
            expect(handlers.invitePeopleModal).toHaveBeenCalledTimes(1);
        });

        expect(handlers.showMoreChannelsModal).not.toHaveBeenCalled();
        expect(handlers.showNewChannelModal).not.toHaveBeenCalled();
    });

    test('should not render anything when team is empty', () => {
        const state = {...initialState};
        state.entities.teams.currentTeamId = '';
        renderWithContext(<SidebarHeader {...defaultProps}/>, state);

        expect(screen.queryByRole('button', {name: team.display_name})).toBeNull();
        expect(screen.queryByRole('button', {name: /Add Channel Dropdown/i})).toBeNull();
    });
});
