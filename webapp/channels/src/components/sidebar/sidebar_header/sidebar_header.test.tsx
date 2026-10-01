// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {Permissions} from 'mattermost-redux/constants';

import {renderWithContext, screen, userEvent, waitFor, within} from 'tests/react_testing_utils';
import {CloudProducts} from 'utils/constants';
import {FileSizes} from 'utils/file_utils';
import {TestHelper} from 'utils/test_helper';

import SidebarHeader from './sidebar_header';
import type {Props} from './sidebar_header';

describe('SidebarHeader', () => {
    const defaultProps: Props = {
        showNewChannelModal: jest.fn(),
        showMoreChannelsModal: jest.fn(),
        invitePeopleModal: jest.fn(),
        showCreateCategoryModal: jest.fn(),
        canCreateChannel: true,
        canJoinPublicChannel: true,
        handleOpenDirectMessagesModal: jest.fn(),
        unreadFilterEnabled: false,
        showCreateUserGroupModal: jest.fn(),
        canCreateCustomGroups: true,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    async function openBrowseOrAddMenu(user = userEvent.setup()) {
        await user.click(screen.getByRole('button', {name: /Browse or create channels/i}));
        await screen.findByRole('menu');

        const portal = document.getElementById('root-portal');
        if (portal) {
            await waitFor(() => {
                expect(within(portal).queryByRole('tooltip', {hidden: true})).not.toBeInTheDocument();
            });
        }

        return user;
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

    test('should render the team menu button', () => {
        renderWithContext(<SidebarHeader {...defaultProps}/>, initialState);

        expect(screen.getByText('Steadfast')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: team.display_name})).toBeInTheDocument();
    });

    test('should render the \'Browse or create channels\' menu button', () => {
        renderWithContext(<SidebarHeader {...defaultProps}/>, initialState);

        expect(screen.getByRole('button', {name: /Browse or create channels/i})).toBeInTheDocument();
    });

    test('should not render anything when team is empty', () => {
        const state = {...initialState};
        state.entities.teams.currentTeamId = '';
        renderWithContext(<SidebarHeader {...defaultProps}/>, state);

        expect(screen.queryByRole('button', {name: team.display_name})).toBeNull();
        expect(screen.queryByRole('button', {name: /Add Channel Dropdown/i})).toBeNull();
    });

    test('should invoke showMoreChannelsModal when Browse channels is clicked', async () => {
        renderWithContext(<SidebarHeader {...defaultProps}/>, initialState);

        const user = await openBrowseOrAddMenu();
        await user.click(screen.getByRole('menuitem', {name: /browse channels/i}));

        expect(defaultProps.showMoreChannelsModal).toHaveBeenCalledTimes(1);
        expect(defaultProps.showNewChannelModal).not.toHaveBeenCalled();
    });

    test('should invoke showNewChannelModal when Create new channel is clicked', async () => {
        renderWithContext(<SidebarHeader {...defaultProps}/>, initialState);

        const user = await openBrowseOrAddMenu();
        await user.click(screen.getByRole('menuitem', {name: /create new channel/i}));

        expect(defaultProps.showNewChannelModal).toHaveBeenCalledTimes(1);
        expect(defaultProps.showMoreChannelsModal).not.toHaveBeenCalled();
    });

    test('should keep other + menu items on their own handlers', async () => {
        renderWithContext(<SidebarHeader {...defaultProps}/>, initialState);

        const user = userEvent.setup();

        await openBrowseOrAddMenu(user);
        await user.click(screen.getByRole('menuitem', {name: /open a direct message/i}));
        expect(defaultProps.handleOpenDirectMessagesModal).toHaveBeenCalledTimes(1);

        await openBrowseOrAddMenu(user);
        await user.click(screen.getByRole('menuitem', {name: /create new user group/i}));
        expect(defaultProps.showCreateUserGroupModal).toHaveBeenCalledTimes(1);

        await openBrowseOrAddMenu(user);
        await user.click(screen.getByRole('menuitem', {name: /create new category/i}));
        expect(defaultProps.showCreateCategoryModal).toHaveBeenCalledTimes(1);

        await openBrowseOrAddMenu(user);
        await user.click(screen.getByRole('menuitem', {name: /invite people/i}));
        expect(defaultProps.invitePeopleModal).toHaveBeenCalledTimes(1);

        expect(defaultProps.showMoreChannelsModal).not.toHaveBeenCalled();
        expect(defaultProps.showNewChannelModal).not.toHaveBeenCalled();
    });
});
