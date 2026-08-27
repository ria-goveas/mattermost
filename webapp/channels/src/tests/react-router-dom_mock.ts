// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

(global as any).historyMock = {
    length: -1,
    action: 'PUSH',
    location: {
        pathname: '/a-mocked-location',
        search: '',
        hash: '',
    },
    push: jest.fn(),
    replace: jest.fn(),
    go: jest.fn(),
    goBack: jest.fn(),
    goForward: jest.fn(),
    block: jest.fn(),
    listen: jest.fn(),
    createHref: jest.fn(),
};

const createNavigateMock = () => {
    const historyMock = (global as any).historyMock;
    return jest.fn((to: unknown, options?: {replace?: boolean}) => {
        if (typeof to === 'number') {
            if (to === -1) {
                historyMock.goBack();
                return;
            }
            historyMock.go(to);
            return;
        }

        if (options?.replace) {
            historyMock.replace(to);
        } else {
            historyMock.push(to);
        }
    });
};

(global as any).navigateMock = createNavigateMock();

jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom');

    return {
        ...actual,
        useHistory: () => (global as any).historyMock,
    };
});

jest.mock('utils/react_router_compat', () => {
    const actual = jest.requireActual('utils/react_router_compat');

    return {
        ...actual,
        useNavigate: () => {
            (global as any).navigateMock = createNavigateMock();
            return (global as any).navigateMock;
        },
    };
});

jest.mock('utils/browser_history', () => {
    return {
        getHistory: () => (global as any).historyMock,
    };
});

export {};
