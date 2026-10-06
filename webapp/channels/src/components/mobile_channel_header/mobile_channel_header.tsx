// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React, {useCallback, useState} from 'react';
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
    purpose: string;
};

const MobileChannelPurpose = ({purpose}: MobileChannelPurposeProps) => {
    const intl = useIntl();
    const [expanded, setExpanded] = useState(false);

    const toggleExpanded = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        setExpanded((current) => !current);
    }, []);

    const ariaLabel = intl.formatMessage({
        id: 'channel_header.channelPurpose',
        defaultMessage: 'Channel purpose: {purpose}',
    }, {purpose});

    return (
        <button
            type='button'
            id='mobileChannelHeaderPurpose'
            className={classNames('channel-header__purpose channel-header__purpose--mobile', {
                'channel-header__purpose--truncated': !expanded,
                'channel-header__purpose--expanded': expanded,
            })}
            aria-label={ariaLabel}
            aria-expanded={expanded}
            onClick={toggleExpanded}
        >
            {purpose}
        </button>
    );
};

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
            const purpose = channel.purpose?.trim() ?? '';
            const showPurpose = Boolean(purpose) && (channel.type === Constants.OPEN_CHANNEL || channel.type === Constants.PRIVATE_CHANNEL);

            heading = (
                <>
                    {showPurpose ? (
                        <div className='channel-header__mobile-heading'>
                            <ChannelHeaderMenu
                                isMobile={true}
                            />
                            <MobileChannelPurpose
                                key={`${channel.id}:${purpose}`}
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
