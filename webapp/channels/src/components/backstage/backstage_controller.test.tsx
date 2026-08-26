// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createMemoryHistory} from 'history';
import React from 'react';

import {renderWithContext, screen} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import BackstageController from './backstage_controller';

jest.mock('plugins/pluggable', () => () => null);
jest.mock('./components/backstage_navbar', () => () => <div data-testid='backstage-navbar'/>);
jest.mock('./components/backstage_sidebar', () => () => <div data-testid='backstage-sidebar'/>);
jest.mock('components/integrations', () => () => <div data-testid='integrations-page'/>);
jest.mock('components/emoji', () => () => <div data-testid='emoji-page'/>);
jest.mock('components/emoji/add_emoji', () => () => <div data-testid='add-emoji-page'/>);
jest.mock('components/integrations/installed_incoming_webhooks', () => () => <div data-testid='incoming-webhooks-page'/>);
jest.mock('components/integrations/commands_container', () => () => <div data-testid='commands-container'/>);

describe('components/backstage/BackstageController routes', () => {
    const user = TestHelper.getUserMock({id: 'user-id'});
    const team = TestHelper.getTeamMock({id: 'team-id', name: 'team_name'});

    const baseProps = {
        user,
        team,
        enableCustomEmoji: true,
        enableIncomingWebhooks: true,
        enableOutgoingWebhooks: true,
        enableCommands: true,
        enableOAuthServiceProvider: true,
        enableOutgoingOAuthConnections: true,
        canCreateOrDeleteCustomEmoji: true,
        canManageIntegrations: true,
    };

    const syncHistoryMock = (path: string) => {
        const historyMock = (global as any).historyMock;
        historyMock.location = {
            pathname: path,
            search: '',
            hash: '',
        };
    };

    const renderAtPath = (path: string) => {
        syncHistoryMock(path);
        const history = createMemoryHistory({initialEntries: [path]});
        return renderWithContext(
            <BackstageController {...baseProps}/>,
            {},
            {history},
        );
    };

    test('renders integrations hub at /:team/integrations', () => {
        renderAtPath('/team_name/integrations');

        expect(screen.getByTestId('integrations-page')).toBeInTheDocument();
    });

    test('renders nested integrations route at /:team/integrations/incoming_webhooks', () => {
        renderAtPath('/team_name/integrations/incoming_webhooks');

        expect(screen.getByTestId('incoming-webhooks-page')).toBeInTheDocument();
    });

    test('renders commands container at /:team/integrations/commands/installed', () => {
        renderAtPath('/team_name/integrations/commands/installed');

        expect(screen.getByTestId('commands-container')).toBeInTheDocument();
    });

    test('renders emoji list at /:team/emoji', () => {
        renderAtPath('/team_name/emoji');

        expect(screen.getByTestId('emoji-page')).toBeInTheDocument();
    });

    test('renders add emoji at /:team/emoji/add', () => {
        renderAtPath('/team_name/emoji/add');

        expect(screen.getByTestId('add-emoji-page')).toBeInTheDocument();
    });
});
