// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import * as ReactRedux from 'react-redux';
import {MemoryRouter, Route} from 'react-router-dom';
import {useNavigate} from 'utils/react_router_compat';

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

jest.mock('utils/react_router_compat', () => ({
    ...jest.requireActual('utils/react_router_compat'),
    useNavigate: jest.fn(),
}));

describe('QueryParamActionController', () => {
    let mockDispatch: jest.Mock;

    let mockNavigate: jest.Mock;

    beforeEach(() => {
        mockDispatch = jest.fn();
        jest.spyOn(ReactRedux, 'useDispatch').mockReturnValue(mockDispatch);
        mockNavigate = jest.fn();
        (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should dispatch openModal for INVITATION modal ID when passed valid open_invitation_modal action', () => {
        renderWithContext(
            <MemoryRouter initialEntries={['/?action=open_invitation_modal']}>
                <Route
                    path='/'
                    component={QueryParamActionController}
                />
            </MemoryRouter>,
        );

        expect(mockDispatch).toHaveBeenCalledWith(
            openModal({
                modalId: 'INVITATION',
                dialogType: expect.any(Function),
            }),
        );
    });

    it('should not dispatch any action when action query parameter is not present', () => {
        renderWithContext(
            <MemoryRouter initialEntries={['/']}>
                <Route
                    path='/'
                    component={QueryParamActionController}
                />
            </MemoryRouter>,
        );

        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should not dispatch any action when action query parameter is not in list', () => {
        renderWithContext(
            <MemoryRouter initialEntries={['/?action=invalid_action']}>
                <Route
                    path='/'
                    component={QueryParamActionController}
                />
            </MemoryRouter>,
        );

        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should remove the action query parameter after dispatching the action', () => {
        renderWithContext(
            <MemoryRouter initialEntries={['/?action=open_invitation_modal']}>
                <Route
                    path='/'
                    component={QueryParamActionController}
                />
            </MemoryRouter>,
        );

        expect(mockDispatch).toHaveBeenCalledWith(
            openModal({
                modalId: 'INVITATION',
                dialogType: expect.any(Function),
            }),
        );

        expect(mockNavigate).toHaveBeenCalledWith({
            search: '',
        }, {replace: true});
    });
});
