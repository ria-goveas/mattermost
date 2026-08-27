// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {Redirect, Route as RRRoute, Switch, useHistory, useRouteMatch} from 'react-router-dom';
import type {RouteProps, match as Match} from 'react-router-dom';

import type {LocationDescriptor, LocationDescriptorObject} from 'history';

/**
 * v6-shaped routing helpers implemented on react-router-dom@5.3.4.
 *
 * react-router-dom v5 does not export useNavigate / Routes / Navigate / useMatch.
 * Import those APIs from this module until the coordinated package bump. Do not
 * import them from 'react-router-dom' yet, and do not change getHistory() or the
 * plugin window.ReactRouterDom export.
 */

export type To = LocationDescriptor;

export type NavigateOptions = {
    replace?: boolean;
    state?: unknown;
};

export type NavigateFunction = {
    (to: number): void;
    (to: To, options?: NavigateOptions): void;
};

export function useNavigate(): NavigateFunction {
    const history = useHistory();

    return useCallback((to: To | number, options?: NavigateOptions) => {
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

        const location: LocationDescriptorObject = options?.state === undefined ? to : {...to, state: options.state};
        if (options?.replace) {
            history.replace(location);
        } else {
            history.push(location);
        }
    }, [history]) as NavigateFunction;
}

export type NavigateProps = {
    to: To;
    replace?: boolean;
    state?: unknown;
};

export function Navigate({to, replace = false, state}: NavigateProps) {
    const dest = typeof to === 'object' && state !== undefined ? {...to, state} : to;
    return (
        <Redirect
            to={dest}
            push={!replace}
        />
    );
}

type CompatRouteProps = RouteProps & {
    element?: React.ReactNode;
};

export function Routes({children}: {children?: React.ReactNode}) {
    return (
        <Switch>
            {React.Children.map(children, (child) => {
                if (!React.isValidElement(child)) {
                    return child;
                }

                const childProps = child.props as CompatRouteProps;
                if (childProps.element == null || childProps.exact !== undefined) {
                    return child;
                }

                const path = childProps.path;
                if (typeof path === 'string' && path.endsWith('/*')) {
                    const splatPath = path === '/*' ? '/' : path.slice(0, -2);
                    return React.cloneElement(child, {path: splatPath, exact: false} as Partial<CompatRouteProps>);
                }

                // Switch reads exact off the child element, not the inner v5 Route.
                return React.cloneElement(child, {exact: true} as Partial<CompatRouteProps>);
            })}
        </Switch>
    );
}

export function Route({element, exact, path, component, render, children, ...rest}: CompatRouteProps) {
    let resolvedPath = path;
    let resolvedExact = exact;

    if (typeof path === 'string' && path.endsWith('/*')) {
        resolvedPath = path === '/*' ? '/' : path.slice(0, -2);
        if (resolvedExact === undefined) {
            resolvedExact = false;
        }
    } else if (element != null && resolvedExact === undefined) {
        // v6 is exact by default; keep that while still matching with v5 Switch.
        resolvedExact = true;
    }

    if (element != null) {
        return (
            <RRRoute
                {...rest}
                path={resolvedPath}
                exact={resolvedExact}
                render={() => <>{element}</>}
            />
        );
    }

    return (
        <RRRoute
            {...rest}
            path={resolvedPath}
            exact={resolvedExact}
            component={component}
            render={render}
        >
            {children}
        </RRRoute>
    );
}

export type PathPattern = {
    path: string;
    end?: boolean;
};

export function useMatch<Params extends {[K in keyof Params]?: string} = Record<string, string>>(
    pattern?: string | PathPattern,
): Match<Params> | null {
    const v5Pattern = typeof pattern === 'object' && pattern != null ? {path: pattern.path, exact: pattern.end ?? true} : pattern;
    return useRouteMatch<Params>(v5Pattern as never) ?? null;
}
