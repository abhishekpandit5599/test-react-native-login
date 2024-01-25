/**
 * @format
 */
import 'react-native-polyfill-globals/auto';
import 'react-native-fetch-api';
import 'fast-text-encoding';
import {AppRegistry} from 'react-native';
import {name as appName} from './app.json';
import React from 'react';
import PolyfillCrypto from 'react-native-webview-crypto';
import {
  DelegationIdentity,
  Ed25519PublicKey,
  ECDSAKeyIdentity,
  DelegationChain,
} from '@dfinity/identity';
import {Actor, HttpAgent, toHex, fromHex} from '@dfinity/agent';
import {InAppBrowser} from 'react-native-inappbrowser-reborn';
import {StyleSheet, TouchableOpacity, Linking} from 'react-native';
import {createActor,backend} from './src/declarations/backend';

const RootComponent: React.FC = () => {
  let generatedKeyPair;

  const handleLogin = async () => {
    let keyPair = Ed25519PublicKey.generate();
    generatedKeyPair = keyPair;
    console.log('running handle login', keyPair);
    try {
      const url = `http://127.0.0.1:4943/?canisterId=by6od-j4aaa-aaaaa-qaadq-cai&publicKey=${toHex(
        keyPair.getPublicKey().toDer(),
      )}`;
      if (await InAppBrowser.isAvailable()) {
        const result = await InAppBrowser.open(url, {
          // iOS Properties
          dismissButtonStyle: 'cancel',
          preferredBarTintColor: '#453AA4',
          preferredControlTintColor: 'white',
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'fullScreen',
          modalTransitionStyle: 'coverVertical',
          modalEnabled: true,
          enableBarCollapsing: false,
          // Android Properties
          showTitle: true,
          toolbarColor: '#6200EE',
          secondaryToolbarColor: 'black',
          navigationBarColor: 'black',
          navigationBarDividerColor: 'white',
          enableUrlBarHiding: true,
          enableDefaultShare: true,
          forceCloseOnRedirection: false,
          animations: {
            startEnter: 'slide_in_right',
            startExit: 'slide_out_left',
            endEnter: 'slide_in_left',
            endExit: 'slide_out_right',
          },
          headers: {
            'my-custom-header': 'my custom header value',
          },
        });
        Linking.addEventListener('url', handleDeepLink);
        await this.sleep(800);
      } else Linking.openURL(url);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeepLink = async event => {
    let actor = backend;
    const deepLink = event.url;
    const urlObject = new URL(deepLink);
    const delegation = urlObject.searchParams.get('delegation');
    const chain = DelegationChain.fromJSON(
      JSON.parse(decodeURIComponent(delegation)),
    );
    const middleIdentity = DelegationIdentity.fromDelegation(
      generatedKeyPair,
      chain,
    );

    const agent = new HttpAgent({
      identity: middleIdentity,
      fetchOptions: {
        reactNative: {
          __nativeResponseType: 'base64',
        },
      },
      callOptions: {
        reactNative: {
          textStreaming: true,
        },
      },
      blsVerify: () => true,
      host: 'http://127.0.0.1:4943',
    });

    actor = createActor('avqkn-guaaa-aaaaa-qaaea-cai', {
      agent,
    });

    let whoami = await actor.whoami();
    console.log('whoami', whoami);
  };

  return (
    <>
      <PolyfillCrypto />
      <TouchableOpacity
        style={styles.loginBtn}
        onPress={() => {
          handleLogin();
        }}>
        <Text style={styles.loginBtnText}>Login with internet identity</Text>
      </TouchableOpacity>
    </>
  );
};

AppRegistry.registerComponent(appName, () => RootComponent);

const styles = StyleSheet.create({
  loginBtn: {
    display: 'flex',
    flexDirection: 'row',
    minWidth: 300,
    maxWidth: '80%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 10,
    marginBottom: 10,
  },
  loginBtnText: {
    fontSize: SIZES.medium,
    width: '40%',
    color: COLORS.inputBorder,
    fontWeight: 'bold',
    textAlign: 'left',
  },
});
