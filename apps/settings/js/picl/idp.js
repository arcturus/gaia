/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

// Private key from mockmyid.com
const MOCKMY_SECRET_KEY = navigator.jwcrypto.loadSecretKeyFromObject({
  algorithm: 'DS',
  x: '385cb3509f086e110c5e24bdd395a84b335a09ae',
  p: 'ff600483db6abfc5b45eab78594b3533d550d9f1bf2a992a7a8daa6dc34f8045ad4e6e0c429d334eeeaaefd7e23d4810be00e4cc1492cba325ba81ff2d5a5b305a8d17eb3bf4a06a349d392e00d329744a5179380344e82a18c47933438f891e22aeef812d69c8f75e326cb70ea000c3f776dfdbd604638c2ef717fc26d02e17',
  q: 'e21e04f911d1ed7991008ecaab3bf775984309c3',
  g: 'c52a4a0ff3b7e61fdf1867ce84138369a6154f4afa92966e3c827e25cfa6cf508b90e5de419e1337e07a2e9e2a3cd5dea704d175f8ebf6af397d69e110b96afb17c7a03259329e4829b0d03bbc7896b15b4ade53e130858cc34d96269aa89041f409136c7242a38895c9d5bccad4f389af1d7a4bd1398bd072dffa896233397a'
});

const MOCKMY_ISSUER = 'mockmyid.com';

/*
* Creates an IDP that can create users
* and issue certs
**/

function Idp(options) {
    options = options || {};
    this.domain = options.issuer || MOCKMY_ISSUER;
    this.privatekey = options.privatekey || MOCKMY_SECRET_KEY;
}

Idp.prototype.createUser = function(options, callback) {
    options = options || {};
    if (!options.domain) {
        options.domain = this.domain;
    }
    if (!options.privatekey) {
        options.privatekey = this.privatekey;
    }

    var user = new User(options);
    user.setup(function(signedUser) {
        user = signedUser;
        callback(user);
    });
};

Idp.prototype.getAssertion = function(options, callback) {
  this.createUser(options, function(signedUser) {
    signedUser.getAssertion(options.audience, options.assertionDuration, function(backedAssertion) {
        callback(backedAssertion);
    });
  });
};

function User(options) {
    this.options = options;
}

User.prototype.setup = function(callback) {
    var self = this;
    var duration = typeof self.options.certDuration !== 'undefined' ?
                    self.options.certDuration :
                    60 * 60 * 1000;

    navigator.jwcrypto.generateKeypair({
        algorithm: 'DS',
        keysize: 256
    }, function(err, keypair) {
        if (err) {
            console.error(err);
        }

        self._keyPair = keypair;
        var expiration = +new Date() + duration;

        navigator.jwcrypto.cert.sign(
            {
                publicKey: self._keyPair.publicKey,
                principal: { email: self.options.email }
            },
            {
                expiresAt: expiration,
                issuer: self.options.domain,
                issuedAt: new Date()
            },
            {}, self.options.privatekey,
            function(err, signedCert) {
                if (err) {
                    console.error(err);
                }
                self._cert = signedCert;
                document.dispatchEvent(new Event('jwcryptoSigned'));
            }
        );
    });
    document.addEventListener('jwcryptoSigned', function() {
        callback(self);
    }, false);
};

User.prototype.getAssertion = function(audience, duration, callback) {
    var backedAssertion;
    var self = this;
    var expirationDate = +new Date() + (typeof duration !== 'undefined' ? duration : 60 * 60 * 1000);
    navigator.jwcrypto.assertion.sign({},
        {
          audience: audience,
          issuer: this.options.domain,
          expiresAt: expirationDate
        },
        this._keyPair.secretKey,
        function(err, signedObject) {
            if (err) {
                return deferred.reject(err);
            }
            backedAssertion = navigator.jwcrypto.cert.bundle([self._cert], signedObject);
            callback(backedAssertion);
        }
    );
};
