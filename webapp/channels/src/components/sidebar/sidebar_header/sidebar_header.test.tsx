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

describe('SidebarHeader', () => {
    function createProps(overrides: Partial<Props> = {}) {
        const showNewChannelModal = jest.fn();
        const showMoreChannelsModal = jest.fn();
        const invitePeopleModal = jest.fn();
        const showCreateCategoryModal = jest.fn();
        const handleOpenDirectMessagesModal = jest.fn();
        const showCreateUserGroupModal = jest.fn();

        const props: Props = {
            showNewChannelModal,
            showMoreChannelsModal,
            invitePeopleModal,
            showCreateCategoryModal,
            canCreateChannel: true,
            canJoinPublicChannel: true,
            handleOpenDirectMessagesModal,
            unreadFilterEnabled: true,
            showCreateUserGroupModal,
            canCreateCustomGroups: true,
            ...overrides,
        };

        return {
            props,
            showNewChannelModal,
            showMoreChannelsModal,
            invitePeopleModal,
            showCreateCategoryModal,
            handleOpenDirectMessagesModal,
            showCreateUserGroupModal,
        };
    }

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

    const plusMenuButton = {name: /Browse or create channels/i};

    async function clickPlusMenuItem(name: string | RegExp) {
        await userEvent.click(screen.getByRole('button', plusMenuButton));
        const item = await screen.findByRole('menuitem', {name});
        await userEvent.click(item);
    }

    test('should render the team menu button', () => {
        const {props} = createProps();
        renderWithContext(<SidebarHeader {...props}/>, initialState);

        expect(screen.getByText('Steadfast')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: team.display_name})).toBeInTheDocument();
    });

    test('should render the \'Browse or create channels\' menu button', () => {
        const {props} = createProps();
        renderWithContext(<SidebarHeader {...props}/>, initialState);

        expect(screen.getByRole('button', plusMenuButton)).toBeInTheDocument();
    });

    test('should not render anything when team is empty', () => {
        const {props} = createProps();
        const state = {
            ...initialState,
            entities: {
                ...initialState.entities,
                teams: {
                    ...initialState.entities.teams,
                    currentTeamId: '',
                },
            },
        };
        renderWithContext(<SidebarHeader {...props}/>, state);

        expect(screen.queryByRole('button', {name: team.display_name})).toBeNull();
        expect(screen.queryByRole('button', plusMenuButton)).toBeNull();
    });

    test('clicking Browse channels opens the browse channels modal', async () => {
        const {props, showMoreChannelsModal, showNewChannelModal} = createProps();
        renderWithContext(<SidebarHeader {...props}/>, initialState);

        await clickPlusMenuItem(/^Browse channels$/);

        await waitFor(() => {
            expect(showMoreChannelsModal).toHaveBeenCalledTimes(1);
        });
        expect(showNewChannelModal).not.toHaveBeenCalled();
    });

    test('clicking Create new channel opens the create channel modal', async () => {
        const {props, showMoreChannelsModal, showNewChannelModal} = createProps();
        renderWithContext(<SidebarHeader {...props}/>, initialState);

        await clickPlusMenuItem(/^Create new channel$/);

        await waitFor(() => {
            expect(showNewChannelModal).toHaveBeenCalledTimes(1);
        });
        expect(showMoreChannelsModal).not.toHaveBeenCalled();
    });

    test.each([
        {
            label: 'direct message',
            itemName: /^Open a direct message$/,
            handler: 'handleOpenDirectMessagesModal' as const,
        },
        {
            label: 'user group',
            itemName: /^Create new user group$/,
            handler: 'showCreateUserGroupModal' as const,
        },
        {
            label: 'category',
            itemName: /^Create new category$/,
            handler: 'showCreateCategoryModal' as const,
            overrides: {unreadFilterEnabled: false},
        },
        {
            label: 'invite',
            itemName: /Invite people/,
            handler: 'invitePeopleModal' as const,
        },
    ])('$label keeps its own + menu handler', async ({itemName, handler, overrides}) => {
        const actions = createProps(overrides);
        renderWithContext(<SidebarHeader {...actions.props}/>, initialState);

        await clickPlusMenuItem(itemName);

        await waitFor(() => {
            expect(actions[handler]).toHaveBeenCalledTimes(1);
        });
        expect(actions.showMoreChannelsModal).not.toHaveBeenCalled();
        expect(actions.showNewChannelModal).not.toHaveBeenCalled();
    });
});
