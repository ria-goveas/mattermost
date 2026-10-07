// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React from 'react';
import type {MouseEvent} from 'react';
import {FormattedMessage, injectIntl} from 'react-intl';
import type {WrappedComponentProps} from 'react-intl';

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

type Props = WrappedComponentProps & {
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

type State = {
    purposeExpanded: boolean;
};

function visibleChannelPurpose(channel: Channel | undefined, inGlobalThreads?: boolean, inDrafts?: boolean): string {
    if (!channel || inGlobalThreads || inDrafts) {
        return '';
    }
    if (channel.type === Constants.DM_CHANNEL || channel.type === Constants.GM_CHANNEL) {
        return '';
    }

    return (channel.purpose || '').trim().slice(0, Constants.MAX_CHANNELPURPOSE_LENGTH);
}

class MobileChannelHeader extends React.PureComponent<Props, State> {
    state: State = {
        purposeExpanded: false,
    };

    componentDidMount() {
        document.querySelector('.inner-wrap')?.addEventListener('click', this.hideSidebars);
    }

    componentDidUpdate(prevProps: Props) {
        const channelChanged = this.props.channel?.id !== prevProps.channel?.id;
        const leftChannel = this.props.inGlobalThreads !== prevProps.inGlobalThreads || this.props.inDrafts !== prevProps.inDrafts;
        if ((channelChanged || leftChannel) && this.state.purposeExpanded) {
            this.setState({purposeExpanded: false});
        }
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

    togglePurpose = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        this.setState((prevState) => ({purposeExpanded: !prevState.purposeExpanded}));
    };

    render() {
        const {user, channel, isMuted, inGlobalThreads, inDrafts} = this.props;
        const purpose = visibleChannelPurpose(channel, inGlobalThreads, inDrafts);
        const purposeAriaLabel = purpose ? this.props.intl.formatMessage({
            id: 'channel_header.channelPurpose',
            defaultMessage: 'Channel purpose: {purpose}',
        }, {purpose}) : '';

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
                    <ChannelHeaderMenu
                        isMobile={true}
                    />

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
                                <div
                                    className={classNames('navbar-brand', {
                                        GlobalThreads___title: inGlobalThreads,
                                        'navbar-brand--with-purpose': Boolean(purpose),
                                    })}
                                >
                                    {purpose ? (
                                        <>
                                            <div className='navbar-brand__title'>
                                                {heading}
                                            </div>
                                            <button
                                                type='button'
                                                className='channel-header__mobile-purpose'
                                                aria-label={purposeAriaLabel}
                                                aria-expanded={this.state.purposeExpanded}
                                                aria-controls='channelHeaderMobilePurposeCard'
                                                onClick={this.togglePurpose}
                                            >
                                                {purpose}
                                            </button>
                                        </>
                                    ) : heading}
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
                {this.state.purposeExpanded && purpose && (
                    <div
                        id='channelHeaderMobilePurposeCard'
                        className='channel-header__mobile-purpose-card'
                        role='region'
                        aria-label={purposeAriaLabel}
                    >
                        {purpose}
                    </div>
                )}
            </div>
        );
    }
}

export default injectIntl(MobileChannelHeader);
