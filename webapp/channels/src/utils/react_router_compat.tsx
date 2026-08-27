// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import type {RouteProps} from 'react-router-dom';
import {
    Redirect,
    Route,
    Switch,
    useHistory,
    useRouteMatch,
} from 'react-router-dom';

export * from 'react-router-dom';

type NavigateOptions = {
    replace?: boolean;
    state?: unknown;
};

type NavigateTo =
    | string
    | {
        pathname?: string;
        search?: string;
        hash?: string;
        state?: unknown;
    };

export type NavigateFunction = (to: NavigateTo | number, options?: NavigateOptions) => void;

/**
 * v6-style navigate hook implemented on top of react-router v5 history.
 * Swap the import to react-router-dom once the dependency is bumped.
 */
export function useNavigate(): NavigateFunction {
    const history = useHistory();

    return useCallback((to, options) => {
        if (typeof to === 'number') {
            history.go(to);
            return;
        }

        if (typeof to === 'string') {
            if (options?.replace) {
                history.replace(to, options.state);
            } else {
                history.push(to, options?.state);
            }
            return;
        }

        const location = {
            pathname: to.pathname,
            search: to.search,
            hash: to.hash,
            state: options?.state ?? to.state,
        };

        if (options?.replace) {
            history.replace(location);
        } else {
            history.push(location);
        }
    }, [history]);
}

/**
 * v6-style match hook implemented on top of react-router v5 useRouteMatch.
 */
export function useMatch<Params extends {[K in keyof Params]?: string} = Record<string, string | undefined>>(
    pattern: string | string[] | {path?: string; exact?: boolean; strict?: boolean; sensitive?: boolean},
) {
    return useRouteMatch<Params>(pattern);
}

type NavigateProps = {
    to: string;
    replace?: boolean;
};

export function Navigate({to, replace = true}: NavigateProps) {
    return (
        <Redirect
            to={to}
            push={!replace}
        />
    );
}

export const Routes = Switch;

type CompatRouteProps = Omit<RouteProps, 'component' | 'render'> & {
    element?: React.ReactNode;
};

export function CompatRoute({element, children, ...rest}: CompatRouteProps) {
    if (element) {
        return (
            <Route
                {...rest}
                render={() => element}
            />
        );
    }

    return (
        <Route {...rest}>
            {children}
        </Route>
    );
}
