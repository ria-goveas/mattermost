// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import AddOAuthApp from 'components/integrations/add_oauth_app/add_oauth_app';

import {renderWithContext, screen, userEvent, waitFor} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

const mockNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => ({
    useNavigate: () => mockNavigate,
}));

jest.mock('components/permissions_gates/system_permission_gate', () => ({children}: {children: React.ReactNode}) => <>{children}</>);

describe('components/integrations/AddOAuthApp', () => {
    const team = TestHelper.getTeamMock({
        id: 'dbcxd9wpzpbpfp8pad78xj12pr',
        name: 'test',
    });

    beforeEach(() => {
        mockNavigate.mockClear();
    });

    test('should match snapshot', () => {
        const emptyFunction = jest.fn();
        const {container} = renderWithContext(
            <AddOAuthApp
                team={team}
                actions={{addOAuthApp: emptyFunction}}
            />,
        );

        expect(container).toMatchSnapshot();
    });

    test('should navigate to confirm page after successful save', async () => {
        const oauthAppId = 'new-oauth-app-id';
        const addOAuthApp = jest.fn().mockResolvedValue({data: {id: oauthAppId}});

        renderWithContext(
            <AddOAuthApp
                team={team}
                actions={{addOAuthApp}}
            />,
        );

        await userEvent.type(document.querySelector('#name') as HTMLInputElement, 'My App');
        await userEvent.type(document.querySelector('#description') as HTMLInputElement, 'App description');
        await userEvent.type(document.querySelector('#homepage') as HTMLInputElement, 'https://example.com');
        await userEvent.type(document.querySelector('#callbackUrls') as HTMLTextAreaElement, 'https://example.com/callback');
        await userEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            expect(addOAuthApp).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith(`/test/integrations/confirm?type=oauth2-apps&id=${oauthAppId}`);
        });
    });
});
