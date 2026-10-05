// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {DeepPartial} from '@mattermost/types/utilities';

import {Permissions, Preferences} from 'mattermost-redux/constants';

import mergeObjects from 'packages/mattermost-redux/test/merge_objects';
import {fireEvent, renderWithContext, screen, userEvent, waitFor} from 'tests/react_testing_utils';
import Constants, {ModalIdentifiers} from 'utils/constants';
import {TestHelper} from 'utils/test_helper';

import type {GlobalState} from 'types/store';

import Sidebar from './sidebar';

jest.mock('components/more_direct_channels', () => {
    const React = require('react');

    return {
        __esModule: true,
        default: () => React.createElement('div', null, 'Direct Messages'),
    };
});

describe('components/sidebar', () => {
    const currentTeam = TestHelper.getTeamMock({
        id: 'current_team_id',
        display_name: 'Current Test Team',
    });

    const initialState: DeepPartial<GlobalState> = {
        entities: {
            teams: {
                currentTeamId: currentTeam.id,
                teams: {
                    [currentTeam.id]: currentTeam,
                },
                myMembers: {
                    [currentTeam.id]: {
                        roles: 'team_user',
                    },
                },
            },
            users: {
                currentUserId: 'current_user_id',
                profiles: {
                    current_user_id: {
                        id: 'current_user_id',
                        roles: 'system_user system_admin',
                    },
                },
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
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    };

    const baseProps = {
        canCreatePublicChannel: true,
        canCreatePrivateChannel: true,
        canJoinPublicChannel: true,
        isOpen: false,
        teamId: currentTeam.id,
        hasSeenModal: true,
        isCloud: false,
        unreadFilterEnabled: false,
        isMobileView: false,
        isKeyBoardShortcutModalOpen: false,
        userGroupsEnabled: false,
        canCreateCustomGroups: true,
        actions: {
            createCategory: jest.fn(),
            fetchMyCategories: jest.fn(),
            openModal: jest.fn(),
            closeModal: jest.fn(),
            clearChannelSelection: jest.fn(),
            closeRightHandSide: jest.fn(),
        },
    };

    test('should render the sidebar components correctly', () => {
        renderWithContext(
            <Sidebar {...baseProps}/>,
            initialState,
        );

        // Check for SidebarContainer that is the parent of the sidebar
        expect(document.getElementById('SidebarContainer')).toBeInTheDocument();

        expect(screen.getByRole('application', {name: /channel sidebar region/i})).toBeInTheDocument();
    });

    test('should not rendering anything when teamId is missing', () => {
        const props = {
            ...baseProps,
            teamId: '',
        };
        renderWithContext(
            <Sidebar {...props}/>,
            initialState,
        );

        expect(screen.queryByRole('application', {name: /channel sidebar region/i})).toBeNull();
    });

    describe('unreads category', () => {
        const currentUserId = 'current_user_id';

        // SidebarList loads UnreadChannels with React.lazy. Preload it so the
        // assertion is not racing the chunk (CI shard load makes that import
        // slower than waitFor's default timeout, and the fallback is null).
        beforeAll(() => import('./unread_channels'));

        function buildUnreadState(channel2Unread: boolean) {
            const channel1 = TestHelper.getChannelMock({id: 'channel1', team_id: currentTeam.id});
            const channel2 = TestHelper.getChannelMock({id: 'channel2', team_id: currentTeam.id});
            const channel2Count = channel2Unread ? 15 : 10;

            const state: DeepPartial<GlobalState> = {
                entities: {
                    channels: {
                        currentChannelId: channel1.id,
                        channels: {
                            channel1,
                            channel2,
                        },
                        channelsInTeam: {
                            [currentTeam.id]: new Set([channel1.id, channel2.id]),
                        },
                        messageCounts: {
                            channel1: {total: 10, root: 10},
                            channel2: {total: channel2Count, root: channel2Count},
                        },
                        myMembers: {
                            channel1: TestHelper.getChannelMembershipMock({channel_id: channel1.id, user_id: currentUserId, msg_count: 10, msg_count_root: 10}),
                            channel2: TestHelper.getChannelMembershipMock({channel_id: channel2.id, user_id: currentUserId, msg_count: 10, msg_count_root: 10}),
                        },
                    },
                    teams: {
                        currentTeamId: currentTeam.id,
                        teams: {
                            [currentTeam.id]: currentTeam,
                        },
                        myMembers: {
                            [currentTeam.id]: {
                                roles: 'team_user',
                            },
                        },
                    },
                    users: {
                        currentUserId,
                        profiles: {
                            [currentUserId]: {
                                id: currentUserId,
                                roles: 'system_user system_admin',
                            },
                        },
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
                    general: {
                        config: {
                            CollapsedThreads: 'disabled',
                        },
                    },
                },
            };

            return {state, channel1, channel2};
        }

        test('should not render unreads category when disabled by user preference', async () => {
            const {state} = buildUnreadState(true);
            const testState = {
                entities: {
                    preferences: {
                        myPreferences: TestHelper.getPreferencesMock([
                            {category: Preferences.CATEGORY_SIDEBAR_SETTINGS, name: Preferences.SHOW_UNREAD_SECTION, value: 'false'},
                        ]),
                    },
                },
            };

            renderWithContext(
                <Sidebar {...baseProps}/>,
                mergeObjects(state, testState),
            );

            await waitFor(() => {
                expect(screen.queryByText('UNREADS')).not.toBeInTheDocument();
            });
        });

        test('should render unreads category when there are unread channels', async () => {
            const {state} = buildUnreadState(true);
            const testState: DeepPartial<GlobalState> = {
                entities: {
                    preferences: {
                        myPreferences: TestHelper.getPreferencesMock([
                            {category: Preferences.CATEGORY_SIDEBAR_SETTINGS, name: Preferences.SHOW_UNREAD_SECTION, value: 'true'},
                        ]),
                    },
                },
            };

            renderWithContext(
                <Sidebar {...baseProps}/>,
                mergeObjects(state, testState),
            );

            expect(await screen.findByText('UNREADS')).toBeInTheDocument();
        });

        test('should not render unreads category when there are no unread channels', async () => {
            const {state} = buildUnreadState(false);
            const testState: DeepPartial<GlobalState> = {
                entities: {
                    preferences: {
                        myPreferences: TestHelper.getPreferencesMock([
                            {category: Preferences.CATEGORY_SIDEBAR_SETTINGS, name: Preferences.SHOW_UNREAD_SECTION, value: 'true'},
                        ]),
                    },
                },
            };

            renderWithContext(
                <Sidebar {...baseProps}/>,
                mergeObjects(state, testState),
            );

            await waitFor(() => {
                expect(screen.queryByText('UNREADS')).not.toBeInTheDocument();
            });
        });

        test('should render unreads category when there are no unread channels but the current channel was previously unread', async () => {
            const {state, channel1} = buildUnreadState(false);
            const testState: DeepPartial<GlobalState> = {
                entities: {
                    preferences: {
                        myPreferences: TestHelper.getPreferencesMock([
                            {category: Preferences.CATEGORY_SIDEBAR_SETTINGS, name: Preferences.SHOW_UNREAD_SECTION, value: 'true'},
                        ]),
                    },
                },
                views: {
                    channel: {
                        lastUnreadChannel: {id: channel1.id},
                    },
                },
            };

            renderWithContext(
                <Sidebar {...baseProps}/>,
                mergeObjects(state, testState),
            );

            expect(await screen.findByText('UNREADS')).toBeInTheDocument();
        });
    });

    describe('modals', () => {
        test('should call Shortcut modal on FORWARD_SLASH+ctrl/meta', () => {
            const openModalSpy = jest.fn();
            const closeModalSpy = jest.fn();

            const props = {
                ...baseProps,
                isKeyBoardShortcutModalOpen: false,
                actions: {
                    ...baseProps.actions,
                    openModal: openModalSpy,
                    closeModal: closeModalSpy,
                },
            };

            renderWithContext(
                <Sidebar {...props}/>,
                initialState,
            );
            expect(document.getElementById('SidebarContainer')).toBeInTheDocument();

            // Test with backslash key (should not trigger the modal)
            // fireEvent on document used because userEvent.keyboard requires element focus
            fireEvent.keyDown(document, {
                key: '\\',
                code: 'Backslash',
                keyCode: Constants.KeyCodes.BACK_SLASH[1],
                ctrlKey: true,
            });
            expect(openModalSpy).not.toHaveBeenCalled();

            // Test with 'ù' key but with forward slash keyCode (should trigger the modal)
            // fireEvent on document used because userEvent.keyboard requires element focus
            fireEvent.keyDown(document, {
                key: 'ù',
                code: 'Slash',
                keyCode: Constants.KeyCodes.FORWARD_SLASH[1],
                ctrlKey: true,
            });
            expect(openModalSpy).toHaveBeenCalledWith(expect.objectContaining({
                modalId: ModalIdentifiers.KEYBOARD_SHORTCUTS_MODAL,
            }));

            // Reset the spy
            openModalSpy.mockClear();

            // Test with '/' key but with seven keyCode (should trigger the modal)
            // fireEvent on document used because userEvent.keyboard requires element focus
            fireEvent.keyDown(document, {
                key: '/',
                code: 'Digit7',
                keyCode: Constants.KeyCodes.SEVEN[1],
                ctrlKey: true,
            });
            expect(openModalSpy).toHaveBeenCalledWith(expect.objectContaining({
                modalId: ModalIdentifiers.KEYBOARD_SHORTCUTS_MODAL,
            }));

            // Reset the spy
            openModalSpy.mockClear();

            // Test with forward slash key (should trigger the modal)
            // fireEvent on document used because userEvent.keyboard requires element focus
            fireEvent.keyDown(document, {
                key: '/',
                code: 'Slash',
                keyCode: Constants.KeyCodes.FORWARD_SLASH[1],
                ctrlKey: true,
            });
            expect(openModalSpy).toHaveBeenCalledWith(expect.objectContaining({
                modalId: ModalIdentifiers.KEYBOARD_SHORTCUTS_MODAL,
            }));
        });

        test('should close Shortcut modal on FORWARD_SLASH+ctrl/meta when already open', () => {
            const openModalSpy = jest.fn();
            const closeModalSpy = jest.fn();

            const props = {
                ...baseProps,
                isKeyBoardShortcutModalOpen: true, // Modal is already open
                actions: {
                    ...baseProps.actions,
                    openModal: openModalSpy,
                    closeModal: closeModalSpy,
                },
            };

            renderWithContext(
                <Sidebar {...props}/>,
                initialState,
            );

            expect(document.getElementById('SidebarContainer')).toBeInTheDocument();

            // Test with forward slash key (should close the modal since it's already open)
            // fireEvent on document used because userEvent.keyboard requires element focus
            fireEvent.keyDown(document, {
                key: '/',
                code: 'Slash',
                keyCode: Constants.KeyCodes.FORWARD_SLASH[1],
                ctrlKey: true,
            });

            // Should call closeModal with the keyboard shortcuts modal ID
            expect(closeModalSpy).toHaveBeenCalledWith(ModalIdentifiers.KEYBOARD_SHORTCUTS_MODAL);

            // Should not call openModal
            expect(openModalSpy).not.toHaveBeenCalled();
        });
    });

    describe('browse or add channel menu', () => {
        async function clickPlusMenuItem(name: RegExp) {
            await userEvent.click(screen.getByRole('button', {name: /browse or create channels/i}));
            await userEvent.click(await screen.findByRole('menuitem', {name}));
        }

        function renderSidebar() {
            const openModal = jest.fn();
            const props = {
                ...baseProps,
                actions: {
                    ...baseProps.actions,
                    openModal,
                },
            };

            renderWithContext(
                <Sidebar {...props}/>,
                initialState,
            );

            return {openModal};
        }

        function expectOpenedModal(openModal: jest.Mock, modalId: string, displayName: string) {
            expect(openModal).toHaveBeenCalledTimes(1);
            const modalData = openModal.mock.calls[0][0];
            expect(modalData.modalId).toBe(modalId);
            expect(modalData.dialogType.displayName).toBe(displayName);
        }

        test('Browse channels opens the browse channels modal', async () => {
            const {openModal} = renderSidebar();

            await clickPlusMenuItem(/^Browse channels$/);

            await waitFor(() => {
                expectOpenedModal(openModal, ModalIdentifiers.MORE_CHANNELS, 'BrowseChannels');
            });
        });

        test('Create new channel opens the create channel modal', async () => {
            const {openModal} = renderSidebar();

            await clickPlusMenuItem(/^Create new channel$/);

            await waitFor(() => {
                expectOpenedModal(openModal, ModalIdentifiers.NEW_CHANNEL_MODAL, 'NewChannelModal');
            });
        });

        test('Open a direct message does not open the channel modals', async () => {
            const {openModal} = renderSidebar();

            await clickPlusMenuItem(/^Open a direct message$/);

            await waitFor(() => {
                expect(screen.getByText('Direct Messages')).toBeInTheDocument();
            });
            expect(openModal).not.toHaveBeenCalled();
        });

        test('Create new user group opens the user group modal', async () => {
            const {openModal} = renderSidebar();

            await clickPlusMenuItem(/^Create new user group$/);

            await waitFor(() => {
                expectOpenedModal(openModal, ModalIdentifiers.USER_GROUPS_CREATE, 'CreateUserGroupsModal');
            });
        });

        test('Create new category opens the category modal', async () => {
            const {openModal} = renderSidebar();

            await clickPlusMenuItem(/^Create new category$/);

            await waitFor(() => {
                expectOpenedModal(openModal, ModalIdentifiers.EDIT_CATEGORY, 'EditCategoryModal');
            });
        });

        test('Invite people opens the invitation modal', async () => {
            const {openModal} = renderSidebar();

            await clickPlusMenuItem(/^Invite people/);

            await waitFor(() => {
                expectOpenedModal(openModal, ModalIdentifiers.INVITATION, 'InvitationModal');
            });
        });
    });
});
