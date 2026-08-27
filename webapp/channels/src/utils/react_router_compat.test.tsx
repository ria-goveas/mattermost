// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {useNavigate} from 'utils/react_router_compat';

import {renderHookWithContext} from 'tests/react_testing_utils';

describe('utils/react_router_compat', () => {
    test('useNavigate push and replace delegate to history', () => {
        const {result} = renderHookWithContext(() => useNavigate());
        const navigate = result.current;

        navigate('/teams/test');
        expect((global as any).historyMock.push).toHaveBeenCalledWith('/teams/test');

        navigate('/teams/other', {replace: true});
        expect((global as any).historyMock.replace).toHaveBeenCalledWith('/teams/other');

        navigate(-1);
        expect((global as any).historyMock.goBack).toHaveBeenCalled();
    });
});

describe('components migrated to useNavigate', () => {
    test('history buttons call navigate for back and forward', async () => {
        const HistoryButtons = require('components/global_header/left_controls/history_buttons/history_buttons').default;
        const {userEvent, renderWithContext, screen} = require('tests/react_testing_utils');

        renderWithContext(<HistoryButtons/>);

        await userEvent.click(screen.getByLabelText('Back'));
        expect((global as any).historyMock.goBack).toHaveBeenCalled();

        await userEvent.click(screen.getByLabelText('Forward'));
        expect((global as any).historyMock.go).toHaveBeenCalledWith(1);
    });
});
