// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createMemoryHistory} from 'history';
import React from 'react';
import {CompatRouter, Route, Routes} from 'react-router-dom-v5-compat';

import {renderWithContext, screen, waitFor} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import CommandsContainer from './commands_container';

jest.mock('components/integrations/installed_commands', () => () => <div data-testid='installed-commands'/>);
jest.mock('components/integrations/add_command', () => () => <div data-testid='add-command'/>);
jest.mock('components/integrations/edit_command', () => () => <div data-testid='edit-command'/>);
jest.mock('components/integrations/confirm_integration', () => () => <div data-testid='confirm-integration'/>);

describe('components/integrations/commands_container/CommandsContainer routes', () => {
    const team = TestHelper.getTeamMock({id: 'team-id', name: 'team_name'});
    const user = TestHelper.getUserMock({id: 'user-id'});

    const baseProps = {
        team,
        user,
        commands: [],
        enableCommands: false,
        actions: {
            loadCommandsAndProfilesForTeam: jest.fn().mockResolvedValue({data: true}),
        },
    };

    const bindHistoryMock = (history: ReturnType<typeof createMemoryHistory>) => {
        const historyMock = (global as any).historyMock;
        historyMock.location = history.location;
        historyMock.replace = jest.fn((to: string) => {
            history.replace(to);
            historyMock.location = history.location;
        });
        historyMock.listen = history.listen.bind(history);
    };

    const renderAtPath = (path: string) => {
        const history = createMemoryHistory({initialEntries: [path]});
        bindHistoryMock(history);
        return renderWithContext(
            <CompatRouter>
                <Routes>
                    <Route
                        path='/team_name/integrations/commands/*'
                        element={<CommandsContainer {...baseProps}/>}
                    />
                </Routes>
            </CompatRouter>,
            {},
            {history},
        );
    };

    test('redirects /commands to /commands/installed', async () => {
        const history = createMemoryHistory({initialEntries: ['/team_name/integrations/commands']});
        bindHistoryMock(history);
        renderWithContext(
            <CompatRouter>
                <Routes>
                    <Route
                        path='/team_name/integrations/commands/*'
                        element={<CommandsContainer {...baseProps}/>}
                    />
                </Routes>
            </CompatRouter>,
            {},
            {history},
        );

        expect(await screen.findByTestId('installed-commands')).toBeInTheDocument();
        await waitFor(() => {
            expect(history.location.pathname).toBe('/team_name/integrations/commands/installed');
        });
    });

    test('renders installed commands at /commands/installed', () => {
        renderAtPath('/team_name/integrations/commands/installed');

        expect(screen.getByTestId('installed-commands')).toBeInTheDocument();
    });

    test('renders add command at /commands/add', () => {
        renderAtPath('/team_name/integrations/commands/add');

        expect(screen.getByTestId('add-command')).toBeInTheDocument();
    });

    test('renders edit command at /commands/edit', () => {
        renderAtPath('/team_name/integrations/commands/edit');

        expect(screen.getByTestId('edit-command')).toBeInTheDocument();
    });

    test('renders confirm integration at /commands/confirm', () => {
        renderAtPath('/team_name/integrations/commands/confirm');

        expect(screen.getByTestId('confirm-integration')).toBeInTheDocument();
    });
});
