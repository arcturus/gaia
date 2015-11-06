'use strict';

/* global MainNavigation */
/* global ContactsTag */ 
/* global TagSelector */
/* global MockMainNavigation */
/* global MocksHelper */
/* global MockFormDom */
/* global MockSelectionDom */
/* global MockMozL10n */
/* global MockContactsTag */

requireApp('test/unit/mock_form_dom.js.html');
requireApp('test/unit/mock_selection_dom.js.html');
requireApp('test/unit/mock_l10n.js');
requireApp('test/unit/mock_contacts_tag.js');
requireApp('test/unit/mock_navigation.js');
requireApp('test/unit/mock_main_navigation.js');
requireApp('js/utilities/tagSelector.js');
requireApp('js/tag_options.js');
require('/shared/test/unit/mocks/mock_lazy_loader.js');

var mocksHelper = new MocksHelper([
	'LazyLoader'
]);

mocksHelper.init();

suite('TagSelector', function() {
  var subject;

  suiteSetup(function() {
    subject = TagSelector;
    mocksHelper.suiteSetup();
    document.body.innerHTML = MockFormDom + MockSelectionDom;
    navigator.mozL10n = MockMozL10n;
    window.ContactsTag = MockContactsTag;
    window.MainNavigation = MockMainNavigation;
    document.body.dataset.taglist = 'phone-type';
  });

  setup(function() {
    this.sinon.spy(ContactsTag, 'filterTags');
    this.sinon.spy(ContactsTag, 'setCustomTag');
    this.sinon.spy(ContactsTag, 'setCustomTagVisibility');
    this.sinon.spy(ContactsTag, 'fillTagOptions');
    this.sinon.spy(MainNavigation, 'go');
  });

  suite('> Show', function() {
    test('Test show function calls', function() {
      TagSelector.show(document.body);
      sinon.assert.calledOnce(ContactsTag.filterTags);
      sinon.assert.calledOnce(ContactsTag.setCustomTag);
      sinon.assert.calledOnce(ContactsTag.setCustomTagVisibility);
      sinon.assert.calledOnce(ContactsTag.fillTagOptions);
      sinon.assert.calledOnce(MainNavigation.go);
    });  
  });
});
