(function(exports) {

  var DEFAULT_IMAGE = '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';

  function getName(contact) {
    var name = null;

    if (Array.isArray(contact.name) && contact.name.length > 0) {
      name = contact.name[0];
    } else {
      var components = [];
      if (Array.isArray(contact.givenName)) {
        components.concat(contact.givenName);
      }
      if (Array.isArray(contact.familyName)) {
        components.concat(contact.familyName);
      }

      name = components.join(' ');
    }

    if (name === null || name.trim().length === 0) {
      name = 'Unnamed';
    }

    return name;
  }

  function getPhoto(contact) {
    if (!Array.isArray(contact.photo) || contact.photo.length === 0) {
      return Promise.resolve(DEFAULT_IMAGE);
    }

    var blob = contact.photo.length > 1 ?
      contact.photo[1] :
      contact.photo[0];

    return photoToBase64(blob);
  }

  function photoToBase64(blob) {
    return new Promise(resolve => {
      var reader = new window.FileReader();
      reader.readAsDataURL(blob); 
      reader.onloadend = () => {
          resolve(reader.result);
      };
    });
  }

  function buildOpenGraphNode(name, value) {
    var ogNode = document.createElement('meta');
    ogNode.setAttribute('property', 'og:' + name);
    ogNode.setAttribute('content', value);

    return ogNode;
  }

  var ContactsPin = {
    pinData: function(contact) {
      var ogName = buildOpenGraphNode('site_name', getName(contact));
      document.head.appendChild(ogName);

      getPhoto(contact).then(photo => {
        var ogPhoto = buildOpenGraphNode('photo', photo);
        document.head.appendChild(ogPhoto);
      });
    }
  };

  exports.ContactsPin = ContactsPin;

})(window);
