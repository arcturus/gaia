'use strict';

/* global GaiaGrid, MozActivity, Promise, GridIconRenderer */
/* jshint nonew: false */

(function(exports) {

  const TYPE = 'contact';

  function Contact(contact) {
    this.detail = contact;
    this.detail.type = TYPE;
  }

  Contact.prototype = {
    __proto__: GaiaGrid.GridItem.prototype,

    renderer: GridIconRenderer.TYPE.CLIP,

    get pixelHeight() {
      return this.grid.layout.gridItemHeight;
    },

    get gridWidth() {
      return 1;
    },

    get name() {
      var name = 'No name';
      var ctc = this.detail;
      if (ctc.name[0]) {
        name = ctc.name[0];
      } else if (ctc.givenName[0] || ctc.familyName[0]) {
        var components = [];
        if (ctc.givenName[0]) {
          components.push(ctc.givenName[0]);
        }
        if (ctc.familyName[0]) {
          components.push(ctc.familyName[0]);
        }
        name = components.split(' ');
      } else if (ctc.tel[0]) {
        name = ctc.tel[0].value;
      } else if (ctc.email[0]) {
        name = ctc.email[0].value;
      }

      return name;
    },

    get identifier() {
      return this.detail.id;
    },

    get icon() {
      var photo = this.detail.photo;
      if (Array.isArray(photo) && photo.length > 0) {
        return 'app://' + photo;
      }
      return this.defaultIcon;
    },

    update: function update() {

    },

    isEditable: function() {
      return true;
    },

    isRemovable: function() {
      return false;
    },

    isDraggable: function() {
      return true;
    },

    fetchIconBlob: function() {
      var contact = this.detail;
      return new Promise(function (resolve, reject) {
        if (contact.photo && Array.isArray(contact.photo) &&
         contact.photo.length > 0) {
          resolve(contact.photo[0]);
        } else {
          reject('No photo for contact');
        }

      });
    },

    launch: function() {
      new MozActivity({
        name: 'open',
        data: {
          type: 'webcontacts/contact',
          params: {
            id: this.detail.id
          }
        }
      });
    },

    edit: function() {
      new MozActivity({
        name: 'update',
        data: {
          type: 'webcontacts/contact',
          params: {
            id: this.detail.id
          }
        }
      });
    }
  };

  exports.GaiaGrid.Contact = Contact;
})(window);
