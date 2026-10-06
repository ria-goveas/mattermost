// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React, {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {FormattedMessage, useIntl} from 'react-intl';

import type {Channel} from '@mattermost/types/channels';
import type {UserProfile} from '@mattermost/types/users';

import {Constants} from 'utils/constants';

import ChannelInfoButton from './channel_info_button';
import CollapseLhsButton from './collapse_lhs_button';
import CollapseRhsButton from './collapse_rhs_button';
import ShowSearchButton from './show_search_button';
import UnmuteChannelButton from './unmute_channel_button';

import ChannelHeaderMenu from '../channel_header_menu/channel_header_menu';
import MobileChannelHeaderPlugins from '../channel_header_menu/menu_items/mobile_channel_header_plugins';

type MobileChannelPurposeProps = {
    channelId: string;
    purpose: string;
};

function MobileChannelPurpose({channelId, purpose}: MobileChannelPurposeProps) {
    const intl = useIntl();
    const [expanded, setExpanded] = useState(false);
    const [navbar, setNavbar] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setNavbar(document.getElementById('navbar'));
    }, []);

    useEffect(() => {
        setExpanded(false);
    }, [channelId]);

    const label = intl.formatMessage({
        id: 'channel_header.channelPurpose',
        defaultMessage: 'Channel purpose: {purpose}',
    }, {purpose});

    return (
        <>
            <button
                type='button'
                className='navbar-purpose'
                aria-label={label}
                aria-expanded={expanded}
                aria-controls='navbarPurposeCard'
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setExpanded((open) => !open);
                }}
            >
                {purpose}
            </button>
            {expanded && navbar && createPortal((
                <div
                    id='navbarPurposeCard'
                    className='navbar-purpose-card'
                    role='region'
                    aria-label={label}
                >
                    {purpose}
                </div>
            ), navbar)}
        </>
    );
}

type Props = {
    channel?: Channel;

    inGlobalThreads?: boolean;
    inDrafts?: boolean;
    isMobileView: boolean;
    isMuted?: boolean;
    isRHSOpen?: boolean;
    user: UserProfile;
    actions: {
        closeLhs: () => void;
        closeRhs: () => void;
        closeRhsMenu: () => void;
    };
};

export default class MobileChannelHeader extends React.PureComponent<Props> {
    componentDidMount() {
        document.querySelector('.inner-wrap')?.addEventListener('click', this.hideSidebars);
    }

    componentWillUnmount() {
        document.querySelector('.inner-wrap')?.removeEventListener('click', this.hideSidebars);
    }

    hideSidebars = (e: Event) => {
        if (this.props.isMobileView) {
            if (this.props.isRHSOpen) {
                this.props.actions.closeRhs();
            }

            const target = e.target as HTMLElement | undefined;

            if (target && target.className !== 'navbar-toggle' && target.className !== 'icon-bar') {
                this.props.actions.closeLhs();
                this.props.actions.closeRhsMenu();
            }
        }
    };

    render() {
        const {user, channel, isMuted, inGlobalThreads, inDrafts} = this.props;

        let purpose = '';
        if (
            channel &&
            !inGlobalThreads &&
            !inDrafts &&
            channel.type !== Constants.DM_CHANNEL &&
            channel.type !== Constants.GM_CHANNEL
        ) {
            purpose = channel.purpose?.trim() ?? '';
        }

        let heading;
        if (inGlobalThreads) {
            heading = (
                <FormattedMessage
                    id='globalThreads.heading'
                    defaultMessage='Followed threads'
                />
            );
        } else if (inDrafts) {
            heading = (
                <FormattedMessage
                    id='drafts.heading'
                    defaultMessage='Drafts'
                />
            );
        } else if (channel) {
            heading = (
                <>
                    {purpose ? (
                        <div className='navbar-brand__channel'>
                            <ChannelHeaderMenu
                                isMobile={true}
                            />
                            <MobileChannelPurpose
                                channelId={channel.id}
                                purpose={purpose}
                            />
                        </div>
                    ) : (
                        <ChannelHeaderMenu
                            isMobile={true}
                        />
                    )}

                    {isMuted && (
                        <UnmuteChannelButton
                            user={user}
                            channel={channel}
                        />
                    )}
                </>
            );
        }

        return (
            <div className='row header'>
                <div id='navbar_wrapper'>
                    <nav
                        id='navbar'
                        className='navbar navbar-default navbar-fixed-top'
                        role='navigation'
                    >
                        <div className='container-fluid theme'>
                            <div className='navbar-header'>
                                <CollapseLhsButton/>
                                <div className={classNames('navbar-brand', {GlobalThreads___title: inGlobalThreads})}>
                                    {heading}
                                </div>
                                <div className='spacer'/>
                                {channel && (
                                    <ChannelInfoButton
                                        channel={channel}
                                    />
                                )}
                                {channel && (
                                    <MobileChannelHeaderPlugins
                                        channel={channel}
                                        isDropdown={false}
                                    />
                                )}
                                <ShowSearchButton/>
                                <CollapseRhsButton/>
                            </div>
                        </div>
                    </nav>
                </div>
            </div>
        );
    }
}
