// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {MemoryRouter} from 'react-router-dom';

import {render, renderHook, screen} from 'tests/react_testing_utils';

import {Navigate, Route, Routes, useMatch, useNavigate} from './react_router_v6';

describe('utils/react_router_v6', () => {
    const historyMock = (global as any).historyMock;

    beforeEach(() => {
        historyMock.push.mockClear();
        historyMock.replace.mockClear();
        historyMock.go.mockClear();
    });

    describe('useNavigate', () => {
        test('navigates with push by default', () => {
            const {result} = renderHook(() => useNavigate());

            result.current('/login');

            expect(historyMock.push).toHaveBeenCalledWith('/login');
        });

        test('navigates with replace when requested', () => {
            const {result} = renderHook(() => useNavigate());

            result.current('/login', {replace: true});

            expect(historyMock.replace).toHaveBeenCalledWith('/login');
        });

        test('treats numeric deltas as history.go', () => {
            const {result} = renderHook(() => useNavigate());

            result.current(-1);
            result.current(1);

            expect(historyMock.go).toHaveBeenNthCalledWith(1, -1);
            expect(historyMock.go).toHaveBeenNthCalledWith(2, 1);
        });
    });

    describe('Routes / Route / Navigate', () => {
        test('renders the matching element and supports fallback Navigate', () => {
            render(
                <MemoryRouter initialEntries={['/unknown']}>
                    <Routes>
                        <Route
                            path='/login'
                            element={<div>{'login page'}</div>}
                        />
                        <Route
                            path='/*'
                            element={
                                <Navigate
                                    to='/login'
                                    replace={true}
                                />
                            }
                        />
                    </Routes>
                </MemoryRouter>,
            );

            expect(screen.getByText('login page')).toBeInTheDocument();
        });

        test('matches an element route exactly by default', () => {
            render(
                <MemoryRouter initialEntries={['/claim/email_to_ldap']}>
                    <Routes>
                        <Route
                            path='/claim'
                            element={<div>{'claim index'}</div>}
                        />
                        <Route
                            path='/claim/email_to_ldap'
                            element={<div>{'email to ldap'}</div>}
                        />
                    </Routes>
                </MemoryRouter>,
            );

            expect(screen.getByText('email to ldap')).toBeInTheDocument();
            expect(screen.queryByText('claim index')).not.toBeInTheDocument();
        });
    });

    describe('useMatch', () => {
        test('returns a match for the current path pattern', () => {
            const {result} = renderHook(() => useMatch('/:team/drafts'), {
                wrapper: ({children}) => (
                    <MemoryRouter initialEntries={['/acme/drafts']}>
                        {children}
                    </MemoryRouter>
                ),
            });

            expect(result.current?.params).toEqual({team: 'acme'});
        });

        test('returns null when the pattern does not match', () => {
            const {result} = renderHook(() => useMatch('/:team/drafts'), {
                wrapper: ({children}) => (
                    <MemoryRouter initialEntries={['/acme/channels/town-square']}>
                        {children}
                    </MemoryRouter>
                ),
            });

            expect(result.current).toBeNull();
        });
    });
});
