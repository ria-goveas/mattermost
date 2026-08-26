// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import AddCommand from 'components/integrations/add_command/add_command';

import {renderWithContext, screen, userEvent, waitFor} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

const mockNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => ({
    useNavigate: () => mockNavigate,
}));

describe('components/integrations/AddCommand', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
    });

    test('should match snapshot', () => {
        const emptyFunction = jest.fn();
        const team = TestHelper.getTeamMock({name: 'test'});

        const {container} = renderWithContext(
            <AddCommand
                team={team}
                actions={{addCommand: emptyFunction}}
            />,
        );
        expect(container).toMatchSnapshot();
    });

    test('should navigate to confirm page after successful save', async () => {
        const commandId = 'new-command-id';
        const team = TestHelper.getTeamMock({name: 'test'});
        const addCommand = jest.fn().mockResolvedValue({data: {id: commandId}});

        renderWithContext(
            <AddCommand
                team={team}
                actions={{addCommand}}
            />,
        );

        await userEvent.type(document.querySelector('#trigger') as HTMLInputElement, 'mytrigger');
        await userEvent.type(document.querySelector('#url') as HTMLInputElement, 'https://example.com/hook');
        await userEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            expect(addCommand).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith(`/test/integrations/commands/confirm?type=commands&id=${commandId}`);
        });
    });
});
