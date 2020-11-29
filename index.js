const { Plugin } = require('powercord/entities');
const { getModule } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');
const { getReactInstance, getOwnerInstance, waitFor, findInTree } = require('powercord/util');
module.exports = class BetterUtilityClasses extends Plugin {
  async startPlugin () {
    document.body.classList.add('better-utilitycls');

    const MemberListItem = await getModule(x => x.default?.displayName === 'MemberListItem');
    inject('better-utilitycls-memberlist', MemberListItem.default.prototype, 'render', (args, res) => {
      res.props['data-user-id'] = res._owner?.stateNode.props.user.id;
      return res;
    });


    const DirectMessage = await getModule(x => x.default?.displayName === 'PrivateChannel');
    const oDirectMessage = DirectMessage.DirectMessage;
    inject('better-utilitycls-dmlist', DirectMessage, 'DirectMessage', (args, res) => {
      res.ref = el => {
        if (el) {
          const elem = (getReactInstance(el) || el._reactInternalFiber)?.child?.child?.child?.child?.child?.child?.stateNode;
          if (elem) {
            elem.setAttribute('data-user-id', res.props.user.id);
            elem.setAttribute('data-channel-id', res.props.channel.id);
          }
        }
      };
      return res;
    });
    Object.assign(DirectMessage.DirectMessage, oDirectMessage);

    const UserPopout = getModule(x => x.default?.displayName === 'UserPopout', false);
    const oUserPopout = UserPopout.default;
    inject('better-utilitycls-userpopout', UserPopout, 'default', (args, res) => {
      res.ref = elem => {
        if (elem) {
          const container = findInTree((getReactInstance(elem) || elem._reactInternalFiber).return, x => x.stateNode, { walkable: [ 'return' ] });
          container.stateNode.setAttribute('data-user-id', res.props.user.id);
        }
      };
      return res;
    });
    Object.assign(UserPopout.default, oUserPopout);

    const classes = await getModule([ 'container', 'usernameContainer' ]); // from game activity toggle
    let container = await waitFor(`.${classes.container}`);
    if (container.parentElement.className.includes('powercord-spotify')) {
      container = document.querySelectorAll(`.${classes.container}`)[document.querySelectorAll(`.${classes.container}`).length - 1];
    }
    const Account = getOwnerInstance(container);
    inject('better-utilitycls-account', Account.__proto__, 'render', (args, res) => {
      let r = res;
      if (res instanceof Array) {
        r = res.find(x => x.props.className);
      }
      if (r.props.children[0].props.children.props.children().props.children.props.src) {
        // eslint-disable-next-line prefer-destructuring
        r.props['data-user-id'] = r.props.children[0].props.children.props.children().props.children.props.src.match(/\/avatars\/(\d+)/)[1];
      }
      return res;
    });


    const Channel = getOwnerInstance(await waitFor(`.${(await getModule([ 'chat' ])).chat}`));
    inject('better-utilitycls-channel', Channel.__proto__, 'render', (args, res) => {
      res.props['data-channel-id'] = res.props.children[3].props.children[0].props.channel.id;
      res.props['data-guild-id'] = res.props.children[3].props.children[0].props.guild?.id || '@me';
      return res;
    });
  }

  pluginWillUnload () {
    document.body.classList.remove('better-utilitycls');
    uninject('better-utilitycls-memberlist');
    uninject('better-utilitycls-dmlist');
    uninject('better-utilitycls-userpopout');
    uninject('better-utilitycls-account');
    uninject('better-utilitycls-channel');
  }
};
