// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getRouteFlags} from './index';

describe('getRouteFlags', () => {
    it.each([
        ['/team/threads', {inGlobalThreads: true, inDrafts: false, inScheduledPosts: false}],
        ['/team/threads/thread-id', {inGlobalThreads: true, inDrafts: false, inScheduledPosts: false}],
        ['/team/drafts', {inGlobalThreads: false, inDrafts: true, inScheduledPosts: false}],
        ['/team/scheduled_posts', {inGlobalThreads: false, inDrafts: false, inScheduledPosts: true}],
        ['/team/channels/town-square', {inGlobalThreads: false, inDrafts: false, inScheduledPosts: false}],
    ])('matches %s', (pathname, expected) => {
        expect(getRouteFlags(pathname)).toEqual(expected);
    });
});
