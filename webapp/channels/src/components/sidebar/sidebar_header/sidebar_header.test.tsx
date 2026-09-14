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

type MenuHandlers = Pick<Props,
'handleOpenDirectMessagesModal' |
'invitePeopleModal' |
'showCreateCategoryModal' |
'showCreateUserGroupModal' |
'showMoreChannelsModal' |
'showNewChannelModal'
>;

function createMenuHandlers(): MenuHandlers {
    return {
        handleOpenDirectMessagesModal: jest.fn(),
        invitePeopleModal: jest.fn(),
        showCreateCategoryModal: jest.fn(),
        showCreateUserGroupModal: jest.fn(),
        showMoreChannelsModal: jest.fn(),
        showNewChannelModal: jest.fn(),
    };
}

async function openBrowseOrAddChannelMenu() {
    await userEvent.click(screen.getByRole('button', {name: /Browse or create channels/i}));
    await screen.findByRole('menuitem', {name: /Browse channels/i});
}

async function clickPlusMenuItem(name: RegExp) {
    await openBrowseOrAddChannelMenu();
    await userEvent.click(screen.getByRole('menuitem', {name}));
}

function expectOnlyHandlerCalled(handlers: MenuHandlers, called: keyof MenuHandlers) {
    (Object.keys(handlers) as Array<keyof MenuHandlers>).forEach((key) => {
        if (key === called) {
            expect(handlers[key]).toHaveBeenCalledTimes(1);
        } else {
            expect(handlers[key]).not.toHaveBeenCalled();
        }
    });
}

describe('SidebarHeader', () => {
    const defaultProps: Props = {
        ...createMenuHandlers(),
        canCreateChannel: true,
        canJoinPublicChannel: true,
        unreadFilterEnabled: true,
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

    test('should open Browse Channels (showMoreChannelsModal), not Create Channel, when Browse channels is clicked', async () => {
        const handlers = createMenuHandlers();
        renderWithContext(
            <SidebarHeader
                {...defaultProps}
                {...handlers}
            />,
            initialState,
        );

        await clickPlusMenuItem(/Browse channels/i);

        // Menu.Item queues onClick until after the close animation.
        await waitFor(() => {
            expect(handlers.showMoreChannelsModal).toHaveBeenCalledTimes(1);
        });
        expectOnlyHandlerCalled(handlers, 'showMoreChannelsModal');
    });

    test('should open Create Channel (showNewChannelModal) when Create new channel is clicked', async () => {
        const handlers = createMenuHandlers();
        renderWithContext(
            <SidebarHeader
                {...defaultProps}
                {...handlers}
            />,
            initialState,
        );

        await clickPlusMenuItem(/Create new channel/i);

        await waitFor(() => {
            expect(handlers.showNewChannelModal).toHaveBeenCalledTimes(1);
        });
        expectOnlyHandlerCalled(handlers, 'showNewChannelModal');
    });

    test.each([
        [/Open a direct message/i, 'handleOpenDirectMessagesModal'],
        [/Create new user group/i, 'showCreateUserGroupModal'],
        [/Create new category/i, 'showCreateCategoryModal'],
        [/Invite people/i, 'invitePeopleModal'],
    ] as const)('should keep + menu item %s on its own handler', async (itemName, handlerKey) => {
        const handlers = createMenuHandlers();
        renderWithContext(
            <SidebarHeader
                {...defaultProps}
                {...handlers}
                unreadFilterEnabled={false}
            />,
            initialState,
        );

        await clickPlusMenuItem(itemName);

        await waitFor(() => {
            expect(handlers[handlerKey]).toHaveBeenCalledTimes(1);
        });
        expectOnlyHandlerCalled(handlers, handlerKey);
    });

    test('should not render anything when team is empty', () => {
        const state = {...initialState};
        state.entities.teams.currentTeamId = '';
        renderWithContext(<SidebarHeader {...defaultProps}/>, state);

        expect(screen.queryByRole('button', {name: team.display_name})).toBeNull();
        expect(screen.queryByRole('button', {name: /Add Channel Dropdown/i})).toBeNull();
    });
});
