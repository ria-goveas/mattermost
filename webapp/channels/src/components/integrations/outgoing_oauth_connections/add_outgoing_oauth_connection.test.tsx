// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {BrowserRouter as Router} from 'react-router-dom';

import {Permissions} from 'mattermost-redux/constants';

import AddOutgoingOAuthConnection from 'components/integrations/outgoing_oauth_connections/add_outgoing_oauth_connection';

import {renderWithContext, screen, userEvent, waitFor} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

const mockNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => ({
    useNavigate: () => mockNavigate,
}));

const mockAddOutgoingOAuthConnection = jest.fn(() => () => Promise.resolve({data: {id: 'new-connection-id'}}));

jest.mock('mattermost-redux/actions/integrations', () => ({
    ...jest.requireActual('mattermost-redux/actions/integrations'),
    addOutgoingOAuthConnection: () => mockAddOutgoingOAuthConnection(),
}));

describe('components/integrations/AddOutgoingOAuthConnection', () => {
    const team = TestHelper.getTeamMock({
        id: 'dbcxd9wpzpbpfp8pad78xj12pr',
        name: 'test',
    });

    const state = {
        entities: {
            general: {
                config: {
                    EnableOutgoingOAuthConnections: 'true',
                },
                license: {
                    IsLicensed: 'true',
                    Cloud: 'true',
                },
            },
            users: {
                currentUserId: 'current_user_id',
                profiles: {
                    current_user_id: {roles: 'system_role'},
                },
            },
            roles: {
                roles: {
                    system_role: {id: 'system_role', permissions: [Permissions.MANAGE_OUTGOING_OAUTH_CONNECTIONS]},
                },
            },
        },
    };

    beforeEach(() => {
        mockNavigate.mockClear();
        mockAddOutgoingOAuthConnection.mockClear();
    });

    test('should match snapshot', () => {
        const baseProps: React.ComponentProps<typeof AddOutgoingOAuthConnection> = {
            team,
        };

        const props = {...baseProps};
        const {container} = renderWithContext(
            <Router>
                <AddOutgoingOAuthConnection {...props}/>
            </Router>,
            state,
        );

        expect(container).toMatchSnapshot();
    });

    test('should navigate to confirm page after successful save', async () => {
        const baseProps: React.ComponentProps<typeof AddOutgoingOAuthConnection> = {
            team,
        };

        const {container} = renderWithContext(
            <Router>
                <AddOutgoingOAuthConnection {...baseProps}/>
            </Router>,
            state,
        );

        await userEvent.type(container.querySelector('#name') as HTMLInputElement, 'My Connection');
        await userEvent.type(container.querySelector('#client_id') as HTMLInputElement, 'client-id');
        await userEvent.type(container.querySelector('#client_secret') as HTMLInputElement, 'client-secret');
        await userEvent.type(container.querySelector('#token_url') as HTMLInputElement, 'https://token.example.com');
        await userEvent.type(container.querySelector('#audienceUrls') as HTMLTextAreaElement, 'https://audience.example.com');

        await userEvent.click(container.querySelector('#saveConnection') as HTMLButtonElement);
        await userEvent.click(screen.getByText('Save anyway'));

        await waitFor(() => {
            expect(mockAddOutgoingOAuthConnection).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/test/integrations/confirm?type=outgoing-oauth2-connections&id=new-connection-id');
        });
    });
});
