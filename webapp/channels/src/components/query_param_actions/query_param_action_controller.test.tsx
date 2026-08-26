// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createMemoryHistory} from 'history';
import React from 'react';
import * as ReactRedux from 'react-redux';

import {openModal} from 'actions/views/modals';

import {renderWithContext} from 'tests/react_testing_utils';

import QueryParamActionController from './query_param_action_controller';

// Mock react-redux since we just care about calling logic
jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useDispatch: jest.fn(),
}));

jest.mock('actions/views/modals', () => ({
    openModal: jest.fn(),
}));

describe('QueryParamActionController', () => {
    let mockDispatch: jest.Mock;

    beforeEach(() => {
        mockDispatch = jest.fn();
        jest.spyOn(ReactRedux, 'useDispatch').mockReturnValue(mockDispatch);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should dispatch openModal for INVITATION modal ID when passed valid open_invitation_modal action', () => {
        const history = createMemoryHistory({initialEntries: ['/?action=open_invitation_modal']});
        renderWithContext(<QueryParamActionController/>, {}, {history});

        expect(mockDispatch).toHaveBeenCalledWith(
            openModal({
                modalId: 'INVITATION',
                dialogType: expect.any(Function),
            }),
        );
    });

    it('should not dispatch any action when action query parameter is not present', () => {
        renderWithContext(<QueryParamActionController/>);

        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should not dispatch any action when action query parameter is not in list', () => {
        const history = createMemoryHistory({initialEntries: ['/?action=invalid_action']});
        renderWithContext(<QueryParamActionController/>, {}, {history});

        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should remove the action query parameter after dispatching the action', () => {
        const history = createMemoryHistory({initialEntries: ['/?action=open_invitation_modal']});
        renderWithContext(<QueryParamActionController/>, {}, {history});

        expect(mockDispatch).toHaveBeenCalledWith(
            openModal({
                modalId: 'INVITATION',
                dialogType: expect.any(Function),
            }),
        );

        expect(history.location.search).toBe('');
        expect(history.length).toBe(1);
    });
});
